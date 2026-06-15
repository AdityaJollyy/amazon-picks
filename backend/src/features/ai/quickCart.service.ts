import { generateJSON } from "../../config/bedrock.js";
import { ApiError } from "../../utils/ApiError.js";
import { prisma } from "../../config/prisma.js";
import {
  retrieveCandidates,
  type RetrievedCandidate,
} from "./retrieve.service.js";
import {
  EXPAND_SYSTEM_PROMPT,
  CURATE_SYSTEM_PROMPT,
  buildExpandUserPrompt,
  buildCurateUserPrompt,
  VIBE_CATEGORIES,
  type ExpandedIntent,
  type CurateResult,
  type CuratedPick,
  type CuratedDrop,
  type VibeCategory,
} from "./quickCart.prompt.js";

/**
 * Quick Mode pipeline:
 *
 *   1. EXPAND  (LLM)  — intent + available categories → vibe + 5-10 phrases
 *   2. RETRIEVE (SQL) — parallel hybrid search per phrase, dedupe to a pool
 *   3. CURATE   (LLM) — pool + intent → 5-10 items with sane quantities
 *
 * The curator decides quantities AFTER seeing real units/pack sizes, so a
 * "tissue box (200 pulls)" no longer gets ordered 10 times for a party of 10.
 */

const RETRIEVAL_PER_PHRASE = 6;
const POOL_CAP = 30;
const MIN_PHRASES = 1;
const MAX_PHRASES = 10;
const MIN_ITEMS = 1;
const MAX_ITEMS = 10;
const MAX_QTY_PER_LINE = 12;
const MAX_INTENT_LEN = 500;

export interface QuickCartInput {
  intent: string;
  groupSize: number;
  zoneCode: string;
  zoneLabel?: string;
}

export interface QuickCartItem {
  product: RetrievedCandidate;
  quantity: number;
  why: string;
  priority: "must" | "nice";
}

export interface QuickCartDropped {
  query: string;
  reason: string;
  priority: "must" | "nice";
}

export interface QuickCart {
  items: QuickCartItem[];
  total: number;
  itemCount: number;
}

export interface BuildResult {
  vibe_category: VibeCategory;
  intent_summary: string;
  cart: QuickCart;
  dropped: QuickCartDropped[];
}

/* ─────────────────────────────  validators  ───────────────────────────── */

const isVibe = (v: unknown): v is VibeCategory =>
  typeof v === "string" && (VIBE_CATEGORIES as readonly string[]).includes(v);

const validateExpand = (raw: unknown): ExpandedIntent => {
  if (!raw || typeof raw !== "object") {
    throw new ApiError(502, "AI expand returned non-object");
  }
  const r = raw as Record<string, unknown>;

  if (!isVibe(r.vibe_category)) {
    throw new ApiError(
      502,
      `AI returned invalid vibe_category: ${String(r.vibe_category)}`
    );
  }

  const intent_summary =
    typeof r.intent_summary === "string" ? r.intent_summary.trim() : "";

  const phrasesRaw = Array.isArray(r.search_phrases) ? r.search_phrases : [];
  const seen = new Set<string>();
  const search_phrases: string[] = [];
  for (const p of phrasesRaw) {
    if (typeof p !== "string") continue;
    const phrase = p.trim().toLowerCase();
    if (!phrase || phrase.length < 2) continue;
    if (seen.has(phrase)) continue;
    seen.add(phrase);
    search_phrases.push(phrase);
    if (search_phrases.length >= MAX_PHRASES) break;
  }
  if (search_phrases.length < MIN_PHRASES) {
    throw new ApiError(502, "AI expand returned no usable search phrases");
  }

  return { vibe_category: r.vibe_category, intent_summary, search_phrases };
};

const validateCurate = (raw: unknown): CurateResult => {
  if (!raw || typeof raw !== "object") {
    throw new ApiError(502, "AI curate returned non-object");
  }
  const r = raw as Record<string, unknown>;

  const itemsRaw = Array.isArray(r.items) ? r.items : [];
  const items: CuratedPick[] = itemsRaw.flatMap((it): CuratedPick[] => {
    if (!it || typeof it !== "object") return [];
    const o = it as Record<string, unknown>;
    const product_id = typeof o.product_id === "string" ? o.product_id : "";
    const qty = Number(o.quantity);
    const why = typeof o.why === "string" ? o.why.trim() : "";
    if (!product_id || !Number.isFinite(qty) || qty <= 0) return [];
    return [
      {
        product_id,
        quantity: Math.max(1, Math.min(MAX_QTY_PER_LINE, Math.round(qty))),
        why,
      },
    ];
  });

  const droppedRaw = Array.isArray(r.dropped) ? r.dropped : [];
  const dropped: CuratedDrop[] = droppedRaw.flatMap((d): CuratedDrop[] => {
    if (!d || typeof d !== "object") return [];
    const o = d as Record<string, unknown>;
    const label = typeof o.label === "string" ? o.label.trim() : "";
    const reason = typeof o.reason === "string" ? o.reason.trim() : "";
    if (!label) return [];
    return [{ label, reason: reason || "no good match in your zone" }];
  });

  return { items, dropped };
};

/* ─────────────────────────────  helpers  ───────────────────────────── */

const formatNow = (d: Date): string => {
  const datePart = d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timePart = d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const hour = d.getHours();
  let bucket: string;
  if (hour < 5) bucket = "late night";
  else if (hour < 12) bucket = "morning";
  else if (hour < 17) bucket = "afternoon";
  else if (hour < 21) bucket = "evening";
  else bucket = "late night";
  return `${datePart}, ${timePart} (${bucket})`;
};

const sanitizeIntent = (intent: string): string => {
  const trimmed = intent.trim();
  if (!trimmed) throw new ApiError(400, "Intent is required");
  if (trimmed.length > MAX_INTENT_LEN) {
    throw new ApiError(400, `Intent is too long (max ${MAX_INTENT_LEN} chars)`);
  }
  return trimmed;
};

const clampGroupSize = (n: number): number =>
  Math.max(1, Math.min(20, Math.round(n)));

/**
 * Pick the product-type words from a name. Two products that share at least
 * one of these are treated as duplicates of the same need ("Amul Gold Milk"
 * vs "Heritage Toned Milk" → both have "milk", so we keep one). Only
 * GENERIC type words live here — brand names (Kurkure, Pepsi, Coke, ORSL)
 * are deliberately excluded so e.g. "Kurkure ... Chips" still trips on
 * "chips" against an existing Lay's pick.
 */
const TYPE_KEYWORDS = [
  "milk", "bread", "egg", "eggs", "butter", "cheese", "yogurt", "curd", "paneer",
  "rice", "atta", "dal", "oil", "ghee",
  "chips", "namkeen", "popcorn", "biscuit", "biscuits", "cookie", "cookies",
  "chocolate", "cake", "rasgulla", "barfi", "halwa", "muffin", "pastry",
  "cola", "soda", "juice", "tea", "coffee", "lassi", "water",
  "paracetamol", "balm", "spray", "syrup", "ors", "tablet", "tablets",
  "tissue", "tissues", "napkin", "napkins", "foil", "wrap",
  "shampoo", "conditioner", "soap", "bodywash", "handwash", "toothpaste",
  "detergent", "cleaner",
  "candle", "candles", "balloon", "balloons",
  "noodles", "pasta", "sauce", "ketchup", "jam", "honey", "spread",
  "banana", "apple", "tomato", "onion", "potato", "spinach", "coriander",
];
const TYPE_KEYWORD_SET = new Set(TYPE_KEYWORDS);

const extractTypeKeywords = (name: string): string[] => {
  const lower = name.toLowerCase();
  const tokens = lower
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const hits = new Set<string>();
  for (const t of tokens) {
    if (TYPE_KEYWORD_SET.has(t)) hits.add(t);
  }
  // Substring fallbacks for product TYPES that brand names often hide
  // ("ORSL" is an ORS, "Prolyte" → ORS via the (ORS) suffix already covered).
  if (/\b(ors|orsl|prolyte|electral|enerzal)\b/.test(lower)) hits.add("ors");
  if (/\b(crocin|dolo|saridon|calpol|combiflam|paracetamol|panadol)\b/.test(lower))
    hits.add("paracetamol");
  return [...hits];
};

/**
 * Cache the catalog category list — it changes rarely (only on a reseed) so
 * a one-shot fetch + in-memory cache is fine. Reset on process restart.
 */
let cachedCategoryNames: string[] | null = null;
const fetchCategoryNames = async (): Promise<string[]> => {
  if (cachedCategoryNames) return cachedCategoryNames;
  const rows = await prisma.category.findMany({
    select: { name: true },
    orderBy: { name: "asc" },
  });
  cachedCategoryNames = rows.map((r) => r.name);
  return cachedCategoryNames;
};

/* ─────────────────────────────  pipeline  ───────────────────────────── */

export const buildQuickCart = async (
  input: QuickCartInput
): Promise<BuildResult> => {
  const intent = sanitizeIntent(input.intent);
  const groupSize = clampGroupSize(input.groupSize);
  const zoneLabel = input.zoneLabel?.trim() || input.zoneCode;
  const nowLabel = formatNow(new Date());

  // 1. EXPAND ───────────────────────────────────────────────────────────────
  const availableCategories = await fetchCategoryNames();
  const expanded = validateExpand(
    await generateJSON(
      EXPAND_SYSTEM_PROMPT,
      buildExpandUserPrompt({
        intent,
        groupSize,
        zoneLabel,
        nowLabel,
        availableCategories,
      })
    )
  );

  // 2. RETRIEVE ─────────────────────────────────────────────────────────────
  const perPhrase = await Promise.all(
    expanded.search_phrases.map(async (phrase) => ({
      phrase,
      candidates: await retrieveCandidates(phrase, input.zoneCode, {
        limit: RETRIEVAL_PER_PHRASE,
      }),
    }))
  );

  // Dedupe: same product can show up under multiple phrases. Keep first hit
  // (preserves the strongest match) and remember which phrase surfaced it.
  const pool: RetrievedCandidate[] = [];
  const seen = new Set<string>();
  for (const r of perPhrase) {
    for (const c of r.candidates) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      pool.push(c);
      if (pool.length >= POOL_CAP) break;
    }
    if (pool.length >= POOL_CAP) break;
  }

  if (pool.length === 0) {
    throw new ApiError(
      404,
      "Nothing matched in your zone — try a different request or zone"
    );
  }

  // 3. CURATE ───────────────────────────────────────────────────────────────
  const curated = validateCurate(
    await generateJSON(
      CURATE_SYSTEM_PROMPT,
      buildCurateUserPrompt({
        intent,
        groupSize,
        vibe: expanded.vibe_category,
        intentSummary: expanded.intent_summary,
        zoneLabel,
        pool: pool.map((c) => ({
          id: c.id,
          name: c.name,
          brand: c.brand,
          unit: c.unit,
          price: c.price,
          mrp: c.mrp,
          rating: c.rating,
          reviewCount: c.reviewCount,
          stock: c.stock,
          categoryName: c.categoryName,
        })),
      })
    )
  );

  // 4. RESOLVE picks back to full RetrievedCandidate, dedupe, clamp to stock,
  //    and enforce a "one per product type" guard. The prompt asks for this
  //    but the model still occasionally outputs 3 breads or 2 milks. We use
  //    name-keyword overlap so that "milk + bread + eggs" still survives even
  //    though they all live in "Dairy, Bread & Eggs".
  const poolById = new Map(pool.map((c) => [c.id, c]));
  const items: QuickCartItem[] = [];
  const usedIds = new Set<string>();
  const usedKeywords = new Set<string>();

  for (const pick of curated.items) {
    const product = poolById.get(pick.product_id);
    if (!product) continue;
    if (usedIds.has(product.id)) continue;

    const keywords = extractTypeKeywords(product.name);
    // Block only when the new product brings NO new type-keyword. So
    // "Amul Milk" after "Heritage Milk" is blocked (both = ["milk"]), but
    // "Tissue Napkin" after "Tissue Box" is allowed (introduces "napkin").
    // Products with no recognised keywords always pass through.
    if (keywords.length > 0 && keywords.every((k) => usedKeywords.has(k))) {
      continue;
    }

    usedIds.add(product.id);
    for (const k of keywords) usedKeywords.add(k);

    const quantity = Math.max(
      1,
      Math.min(pick.quantity, product.stock, MAX_QTY_PER_LINE)
    );
    items.push({ product, quantity, why: pick.why, priority: "must" });
    if (items.length >= MAX_ITEMS) break;
  }

  if (items.length < MIN_ITEMS) {
    throw new ApiError(
      404,
      "Couldn't curate a cart — nothing matched well enough in your zone"
    );
  }

  const dropped: QuickCartDropped[] = curated.dropped.map((d) => ({
    query: d.label,
    reason: d.reason,
    priority: "must" as const,
  }));

  const total = items.reduce(
    (sum, it) => sum + it.product.price * it.quantity,
    0
  );
  const itemCount = items.reduce((n, it) => n + it.quantity, 0);

  return {
    vibe_category: expanded.vibe_category,
    intent_summary: expanded.intent_summary,
    cart: { items, total, itemCount },
    dropped,
  };
};
