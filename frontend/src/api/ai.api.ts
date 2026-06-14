import { apiClient } from "./apiClient";

/** Mirror of backend src/features/ai/retrieve.service.ts:RetrievedCandidate. */
export type RetrievedCandidate = {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  mrp: number;
  unit: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  vibes: string[];
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  stock: number;
  etaMinutes: number;
  similarity: number;
  rankScore: number;
  finalScore: number;
};

export type AiVibe = "medical" | "party" | "emergency" | "casual";

export type AiPriority = "must" | "nice";

export type PlannedNeed = {
  query: string;
  quantity: number;
  priority: AiPriority;
  note?: string;
};

export type ShoppingPlan = {
  vibe_category: AiVibe;
  intent_summary: string;
  needs: PlannedNeed[];
};

export type AiCartItem = {
  product: RetrievedCandidate;
  quantity: number;
  why: string;
  priority: AiPriority;
};

export type AiCart = {
  items: AiCartItem[];
  total: number;
  itemCount: number;
};

export type AiDropped = {
  query: string;
  reason: string;
  priority: AiPriority;
};

export type PlanResult = {
  plan: ShoppingPlan;
};

export type BuildResult = {
  vibe_category: AiVibe;
  intent_summary: string;
  cart: AiCart;
  dropped: AiDropped[];
};

export type PlanInput = {
  intent: string;
  groupSize: number;
  zoneCode: string;
};

export type BuildInput = {
  intent: string;
  groupSize: number;
  zoneCode: string;
  plan: ShoppingPlan;
};

export const aiApi = {
  plan: (input: PlanInput) =>
    apiClient.post<PlanResult>("/ai/quick-cart/plan", input),
  build: (input: BuildInput) =>
    apiClient.post<BuildResult>("/ai/quick-cart/build", input),
  chat: (input: ChatInput) => apiClient.post<ChatResult>("/ai/chat", input),
};

/* ───────── chat ───────── */

export type ChatRole = "user" | "assistant";
export type ChatMessage = { role: ChatRole; content: string };

export type ChatInput = {
  messages: ChatMessage[];
  zoneCode: string;
};

export type DraftCartItem = {
  product: RetrievedCandidate;
  quantity: number;
};

export type DraftCart = {
  items: DraftCartItem[];
  total: number;
};

export type ChatResult = {
  reply: string;
  vibe_category: AiVibe;
  draftCart: DraftCart | null;
};
