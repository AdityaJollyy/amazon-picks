/**
 * Strict-JSON prompts for the Quick Cart parser.
 *
 * The model never sees product data — its only job is to translate the
 * customer's free-text intent into:
 *   - a vibe label (drives the vibe-reactive UI), and
 *   - a normalized shopping list (each line scoped to a single product type).
 *
 * Quantities are PER-PERSON baselines; the service multiplies by groupSize
 * before retrieval. Keeping the math out of the LLM makes scaling deterministic
 * across re-runs.
 */

export const VIBE_CATEGORIES = ["medical", "party", "emergency", "casual"] as const;
export type VibeCategory = (typeof VIBE_CATEGORIES)[number];

export interface ParsedIntent {
  vibe_category: VibeCategory;
  shopping_list: Array<{ query: string; quantity: number }>;
}

export const QUICK_CART_SYSTEM_PROMPT = `You are a quick-commerce shopping assistant for a Delhi grocery + pharmacy app.

Given a customer's free-text intent, output ONLY a single valid JSON object — no prose, no markdown, no code fences. The object must have exactly two top-level keys:

1. "vibe_category" — one of: "medical", "party", "emergency", "casual"
   - "medical": fever, headache, cough, injury, period pain, ORS, first aid
   - "emergency": urgent late-night needs (forgot something critical, ran out of essentials)
   - "party": birthday, celebration, get-together, friends coming over
   - "casual": everyday groceries, breakfast, snack, dinner ingredients

2. "shopping_list" — array of 4 to 10 items. Each item is:
   { "query": <short generic search phrase>, "quantity": <positive integer> }

Rules for shopping_list:
- "query" should be GENERIC enough to match real products via search (e.g. "milk", "paracetamol tablets", "birthday candles", NOT specific brands or sizes)
- "quantity" is the BASELINE for ONE person — the system multiplies by group size later
- Cover the actual need: e.g. a fever needs paracetamol + ORS + tissues + a soft drink; a birthday party needs cake + candles + plates + balloons + snacks + drinks
- Avoid duplicates and overly niche items
- Round quantities to whole integers (1, 2, 3...)

Output JSON only.`;

export const buildQuickCartUserPrompt = (
  intent: string,
  groupSize: number
): string =>
  `Customer intent: ${intent.trim()}
Group size: ${groupSize} ${groupSize === 1 ? "person" : "people"}

Return the JSON now.`;
