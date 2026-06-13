import { DUMMY_PRODUCTS } from "@/features/products/dummyProducts";
import type { DisplayProduct } from "@/types/product";

export type ScriptStep = {
  /** What the assistant says at this step. */
  assistantText: string;
  /** Product IDs to add to the draft cart when this step plays. */
  addProductIds: string[];
  /** Quick-reply chips shown to the user at this step. */
  suggestedReplies: string[];
};

const byId = (id: string): DisplayProduct | undefined =>
  DUMMY_PRODUCTS.find((p) => p.id === id);

export function resolveProducts(ids: string[]): DisplayProduct[] {
  return ids.map(byId).filter((p): p is DisplayProduct => Boolean(p));
}

/** A scripted house-party flow. Each user message advances to the next step. */
export const CONVERSATION_SCRIPT: ScriptStep[] = [
  {
    assistantText:
      "Hey Aarav 👋 What are we putting together today? Tell me the occasion or vibe and I'll start a draft cart.",
    addProductIds: [],
    suggestedReplies: [
      "Friends coming over tonight",
      "Quick weekly groceries",
      "Kid has a fever",
    ],
  },
  {
    assistantText:
      "Got it — house party for ~6 people. I'll start with the crowd-pleasers: chips, nachos, and a 750 ml Coke. How's that base looking?",
    addProductIds: ["p_lays", "p_nachos", "p_coke"],
    suggestedReplies: [
      "Add something sweet",
      "We need stronger drinks",
      "Looks good, keep going",
    ],
  },
  {
    assistantText:
      "Nice — adding Choco Fills for dessert and Red Bull for the late shift. Want me to throw in mineral water and basics so we're not running out at midnight?",
    addProductIds: ["p_choco", "p_redbull"],
    suggestedReplies: [
      "Yes, add water",
      "Skip basics, we have those",
      "Replace nachos with fruit",
    ],
  },
  {
    assistantText:
      "Done — added 1 L mineral water. The draft is at 6 items, around ₹313, and delivers in ~12 min. Anything to swap, or should we check out?",
    addProductIds: ["p_water"],
    suggestedReplies: ["Looks perfect", "Add bananas too", "Show cheaper picks"],
  },
  {
    assistantText:
      "All set — your draft cart is locked in. Hit Checkout draft cart whenever you're ready, or keep chatting if you want me to tweak.",
    addProductIds: [],
    suggestedReplies: [],
  },
];
