import { generateJSON } from "../../config/bedrock.js";
import { ApiError } from "../../utils/ApiError.js";
import {
  retrieveCandidates,
  type RetrievedCandidate,
} from "./retrieve.service.js";
import {
  PLAN_SYSTEM_PROMPT,
  PICK_SYSTEM_PROMPT,
  buildPlanUserPrompt,
  buildPickUserPrompt,
  VIBE_CATEGORIES,
  type ShoppingPlan,
  type PlannedNeed,
  type PickResult,
  type PickedItem,
  type SkippedItem,
  type VibeCategory,
} from "./quickCart.prompt.js";

/**
 * Two-step AI cart builder, split so the user can SEE and EDIT the plan
 * before the catalog search runs.
 *
 *   planCart()  — Claude reads the customer's intent + context and emits a
 *                 shopping plan: vibe label, intent summary, and a list of
 *                 needs with FINAL quantities (no per-person multiplication
 *                 downstream). No retrieval or product selection happens here.
 *
 *   buildCart() — Given a plan (possibly edited by the user — items removed,
 *                 etc.), runs hybrid retrieval per need with a similarity
 *                 floor, then asks Claude to pick the best in-stock SKU per
 *                 line (or skip with a reason). Returns one curated cart plus
 *                 any dropped lines.
 */

const RETRIEVAL_LIMIT = 8;
const MAX_NEEDS = 8;
const MAX_QTY_PER_LINE = 12;
const MAX_INTENT_LEN = 500;

export interface PlanInput {
  intent: string;
  groupSize: number;
  zoneCode: string;
  zoneLabel?: string;
}

export interface BuildInput {
  intent: string;
  groupSize: number;
  zoneCode: string;
  plan: ShoppingPlan;
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

export interface PlanResult {
  plan: ShoppingPlan;
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

const isPriority = (v: unknown): v is "must" | "nice" =>
  v === "must" || v === "nice";

/** Normalize raw needs (from the AI OR from a user-edited request body). */
const normalizeNeeds = (raw: unknown): PlannedNeed[] => {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw.slice(0, MAX_NEEDS).flatMap((item): PlannedNeed[] => {
    if (!item || typeof item !== "object") return [];
    const i = item as Record<string, unknown>;
    const query = typeof i.query === "string" ? i.query.trim() : "";
    const qty = Number(i.quantity);
    if (!query || !Number.isFinite(qty) || qty <= 0) return [];
    const key = query.toLowerCase();
    if (seen.has(key)) return [];
    seen.add(key);
    const priority = isPriority(i.priority) ? i.priority : "must";
    const note = typeof i.note === "string" ? i.note.trim() : undefined;
    return [
      {
        query,
        quantity: Math.max(1, Math.min(MAX_QTY_PER_LINE, Math.round(qty))),
        priority,
        ...(note ? { note } : {}),
      },
    ];
  });
};

const validateAiPlan = (raw: unknown): ShoppingPlan => {
  if (!raw || typeof raw !== "object") {
    throw new ApiError(502, "AI plan was not an object");
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

  const needs = normalizeNeeds(r.needs);
  if (needs.length === 0) {
    throw new ApiError(502, "AI plan had no usable needs");
  }

  return { vibe_category: r.vibe_category, intent_summary, needs };
};

/** Validate a plan as it arrives from the client (it may have been edited). */
export const validateClientPlan = (raw: unknown): ShoppingPlan => {
  if (!raw || typeof raw !== "object") {
    throw new ApiError(400, "Missing or invalid 'plan'");
  }
  const r = raw as Record<string, unknown>;

  if (!isVibe(r.vibe_category)) {
    throw new ApiError(400, "plan.vibe_category is missing or invalid");
  }

  const intent_summary =
    typeof r.intent_summary === "string" ? r.intent_summary.trim() : "";

  const needs = normalizeNeeds(r.needs);
  if (needs.length === 0) {
    throw new ApiError(400, "plan.needs must contain at least one item");
  }

  return { vibe_category: r.vibe_category, intent_summary, needs };
};

const validatePickResult = (raw: unknown): PickResult => {
  if (!raw || typeof raw !== "object") {
    throw new ApiError(502, "AI pick result was not an object");
  }
  const r = raw as Record<string, unknown>;

  const picksRaw = Array.isArray(r.picks) ? r.picks : [];
  const skippedRaw = Array.isArray(r.skipped) ? r.skipped : [];

  const picks: PickedItem[] = picksRaw.flatMap((p): PickedItem[] => {
    if (!p || typeof p !== "object") return [];
    const o = p as Record<string, unknown>;
    const query = typeof o.query === "string" ? o.query.trim() : "";
    const product_id = typeof o.product_id === "string" ? o.product_id : "";
    const qty = Number(o.quantity);
    const why = typeof o.why === "string" ? o.why.trim() : "";
    if (!query || !product_id || !Number.isFinite(qty) || qty <= 0) return [];
    return [
      {
        query,
        product_id,
        quantity: Math.max(1, Math.min(MAX_QTY_PER_LINE, Math.round(qty))),
        why,
      },
    ];
  });

  const skipped: SkippedItem[] = skippedRaw.flatMap((s): SkippedItem[] => {
    if (!s || typeof s !== "object") return [];
    const o = s as Record<string, unknown>;
    const query = typeof o.query === "string" ? o.query.trim() : "";
    const reason = typeof o.reason === "string" ? o.reason.trim() : "";
    if (!query) return [];
    return [{ query, reason: reason || "no good match" }];
  });

  return { picks, skipped };
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

/* ─────────────────────────────  step 1: PLAN  ───────────────────────────── */

export const planCart = async (input: PlanInput): Promise<PlanResult> => {
  const intent = sanitizeIntent(input.intent);
  const groupSize = clampGroupSize(input.groupSize);
  const zoneLabel = input.zoneLabel?.trim() || input.zoneCode;
  const nowLabel = formatNow(new Date());

  const plan = validateAiPlan(
    await generateJSON(
      PLAN_SYSTEM_PROMPT,
      buildPlanUserPrompt({ intent, groupSize, zoneLabel, nowLabel })
    )
  );

  return { plan };
};

/* ─────────────────────────────  step 2: BUILD  ───────────────────────────── */

export const buildCart = async (input: BuildInput): Promise<BuildResult> => {
  const intent = sanitizeIntent(input.intent);
  const groupSize = clampGroupSize(input.groupSize);
  const plan = input.plan;

  // 1. RETRIEVE — one parallel hybrid search per need.
  const retrievals = await Promise.all(
    plan.needs.map(async (need) => ({
      need,
      candidates: await retrieveCandidates(need.query, input.zoneCode, {
        limit: RETRIEVAL_LIMIT,
      }),
    }))
  );

  // Lookup table so we can resolve picked product_ids back to the full
  // RetrievedCandidate. Only candidates we actually showed the model are
  // eligible — anything outside this map is treated as a hallucinated id.
  const candidateById = new Map<string, RetrievedCandidate>();
  for (const r of retrievals) {
    for (const c of r.candidates) candidateById.set(c.id, c);
  }

  const autoDropped: QuickCartDropped[] = retrievals
    .filter((r) => r.candidates.length === 0)
    .map((r) => ({
      query: r.need.query,
      reason: "no in-stock match in your zone",
      priority: r.need.priority,
    }));

  const linesForPick = retrievals.filter((r) => r.candidates.length > 0);

  if (linesForPick.length === 0) {
    throw new ApiError(
      404,
      "Nothing on your list was in stock in your zone right now"
    );
  }

  // 2. PICK — model chooses one product per line (or skips with a reason).
  const pickRaw = await generateJSON(
    PICK_SYSTEM_PROMPT,
    buildPickUserPrompt({
      plan: { ...plan, needs: linesForPick.map((l) => l.need) },
      intent,
      groupSize,
      candidatesPerNeed: linesForPick.map((l) => ({
        query: l.need.query,
        candidates: l.candidates.map((c) => ({
          id: c.id,
          name: c.name,
          brand: c.brand,
          unit: c.unit,
          price: c.price,
          mrp: c.mrp,
          rating: c.rating,
          reviewCount: c.reviewCount,
          stock: c.stock,
          similarity: c.similarity,
          rankScore: c.rankScore,
        })),
      })),
    })
  );
  const picked = validatePickResult(pickRaw);

  // 3. ASSEMBLE — turn picks into cart items, attach `why`, clamp to stock,
  //    and skip duplicate product_ids the model accidentally picked twice.
  const items: QuickCartItem[] = [];
  const usedProductIds = new Set<string>();
  const aiSkippedByQuery = new Map<string, string>(
    picked.skipped.map((s) => [s.query.toLowerCase(), s.reason])
  );
  const handledQueries = new Set<string>();

  for (const pick of picked.picks) {
    const product = candidateById.get(pick.product_id);
    if (!product) continue;
    if (usedProductIds.has(product.id)) continue;

    const need = linesForPick
      .map((l) => l.need)
      .find((n) => n.query.toLowerCase() === pick.query.toLowerCase());
    if (!need) continue;

    const quantity = Math.max(
      1,
      Math.min(pick.quantity, need.quantity, product.stock, MAX_QTY_PER_LINE)
    );

    items.push({
      product,
      quantity,
      why: pick.why,
      priority: need.priority,
    });
    usedProductIds.add(product.id);
    handledQueries.add(need.query.toLowerCase());
  }

  const aiDropped: QuickCartDropped[] = linesForPick
    .filter((l) => !handledQueries.has(l.need.query.toLowerCase()))
    .map((l) => ({
      query: l.need.query,
      reason:
        aiSkippedByQuery.get(l.need.query.toLowerCase()) ?? "no good match",
      priority: l.need.priority,
    }));

  const dropped = [...autoDropped, ...aiDropped];

  if (items.length === 0) {
    throw new ApiError(
      404,
      "Couldn't build a cart — nothing matched well enough in your zone"
    );
  }

  const total = items.reduce(
    (sum, it) => sum + it.product.price * it.quantity,
    0
  );
  const itemCount = items.reduce((n, it) => n + it.quantity, 0);

  return {
    vibe_category: plan.vibe_category,
    intent_summary: plan.intent_summary,
    cart: { items, total, itemCount },
    dropped,
  };
};

/* ────────────────────────  one-shot: plan + build  ──────────────────────── */

/**
 * Single-call entry point used by the redesigned Quick Mode UI. Internally
 * this is `planCart` followed by `buildCart` — same prompts, same retrieval,
 * same outputs — but the user never sees the intermediate plan. They edit
 * the final cart instead.
 */
export const quickCartOneShot = async (
  input: PlanInput
): Promise<BuildResult> => {
  const { plan } = await planCart(input);
  return buildCart({
    intent: input.intent,
    groupSize: input.groupSize,
    zoneCode: input.zoneCode,
    plan,
  });
};
