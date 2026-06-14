import { generateJSON } from "../../config/bedrock.js";
import { ApiError } from "../../utils/ApiError.js";
import { retrieveCandidates, type RetrievedCandidate } from "./retrieve.service.js";
import {
  QUICK_CART_SYSTEM_PROMPT,
  buildQuickCartUserPrompt,
  VIBE_CATEGORIES,
  type ParsedIntent,
  type VibeCategory,
} from "./quickCart.prompt.js";
import {
  BUDGET_TIERS,
  selectForTier,
  type BudgetTier,
} from "./quickCart.selector.js";

/**
 * Orchestrates the Quick Mode flow:
 *   1. LLM parses free-text intent → vibe + shopping list
 *   2. Hybrid retrieval finds candidate products per item
 *   3. Per-budget-tier selector picks one product per item
 *   4. Carts assembled at three price points; near-duplicates dropped
 */

export interface QuickCartInput {
  intent: string;
  groupSize: number;
  budgetTier: BudgetTier; // currently informational — we always build all 3
  zoneCode: string;
}

export interface CartItem {
  product: RetrievedCandidate;
  quantity: number;
}

export interface Cart {
  tier: BudgetTier;
  title: string;
  items: CartItem[];
  total: number;
}

export interface QuickCartResult {
  vibe_category: VibeCategory;
  carts: Cart[];
}

const TIER_TITLES: Record<BudgetTier, string> = {
  Essentials: "Essentials",
  Standard: "Standard Mix",
  Premium: "Premium Picks",
};

const RETRIEVAL_LIMIT = 12; // pool large enough for the selector to choose from
const MAX_SHOPPING_LIST = 10;

const isVibe = (v: unknown): v is VibeCategory =>
  typeof v === "string" && (VIBE_CATEGORIES as readonly string[]).includes(v);

const validateParsedIntent = (raw: unknown): ParsedIntent => {
  if (!raw || typeof raw !== "object") {
    throw new ApiError(502, "AI did not return an object");
  }
  const r = raw as Record<string, unknown>;

  if (!isVibe(r.vibe_category)) {
    throw new ApiError(502, `AI returned invalid vibe_category: ${String(r.vibe_category)}`);
  }
  if (!Array.isArray(r.shopping_list) || r.shopping_list.length === 0) {
    throw new ApiError(502, "AI returned empty or invalid shopping_list");
  }

  const list = r.shopping_list.slice(0, MAX_SHOPPING_LIST).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const i = item as Record<string, unknown>;
    const query = typeof i.query === "string" ? i.query.trim() : "";
    const qty = Number(i.quantity);
    if (!query || !Number.isFinite(qty) || qty <= 0) return [];
    return [{ query, quantity: Math.max(1, Math.round(qty)) }];
  });

  if (list.length === 0) {
    throw new ApiError(502, "AI returned no usable shopping_list entries");
  }

  return { vibe_category: r.vibe_category, shopping_list: list };
};

const cartFingerprint = (cart: Cart): string =>
  cart.items.map((i) => `${i.product.id}x${i.quantity}`).sort().join("|");

export const generateQuickCart = async (
  input: QuickCartInput
): Promise<QuickCartResult> => {
  const intent = input.intent.trim();
  if (!intent) throw new ApiError(400, "Intent is required");

  const groupSize = Math.max(1, Math.min(50, Math.round(input.groupSize)));

  // Step 1 — parse intent into vibe + shopping list.
  const parsed = validateParsedIntent(
    await generateJSON(QUICK_CART_SYSTEM_PROMPT, buildQuickCartUserPrompt(intent, groupSize))
  );

  // Step 2 — retrieve candidates for every shopping list item in parallel.
  const retrievals = await Promise.all(
    parsed.shopping_list.map(async (item) => ({
      query: item.query,
      quantity: item.quantity * groupSize,
      candidates: await retrieveCandidates(item.query, input.zoneCode, {
        limit: RETRIEVAL_LIMIT,
      }),
    }))
  );

  // Step 3 — assemble one cart per budget tier.
  const builtCarts: Cart[] = BUDGET_TIERS.map((tier) => {
    const items: CartItem[] = [];
    const seenProductIds = new Set<string>();

    for (const r of retrievals) {
      const product = selectForTier(r.candidates, tier);
      if (!product) continue;
      // Dedupe within a cart: if the selector picked the same product for two
      // different queries (can happen with vague intents), merge quantities.
      if (seenProductIds.has(product.id)) {
        const existing = items.find((it) => it.product.id === product.id)!;
        existing.quantity += r.quantity;
        continue;
      }
      seenProductIds.add(product.id);
      items.push({ product, quantity: r.quantity });
    }

    const total = items.reduce(
      (sum, it) => sum + it.product.price * it.quantity,
      0
    );

    return { tier, title: TIER_TITLES[tier], items, total };
  }).filter((cart) => cart.items.length > 0);

  // Step 4 — drop carts that are identical to a cheaper tier (no real choice).
  const seenFingerprints = new Set<string>();
  const carts = builtCarts.filter((cart) => {
    const fp = cartFingerprint(cart);
    if (seenFingerprints.has(fp)) return false;
    seenFingerprints.add(fp);
    return true;
  });

  if (carts.length === 0) {
    throw new ApiError(
      404,
      "Could not build a cart — no in-stock candidates found for this intent in this zone"
    );
  }

  return { vibe_category: parsed.vibe_category, carts };
};
