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

export type BackendBudgetTier = "Essentials" | "Standard" | "Premium";

export type AiCartItem = {
  product: RetrievedCandidate;
  quantity: number;
};

export type AiCart = {
  tier: BackendBudgetTier;
  title: string;
  items: AiCartItem[];
  total: number;
};

export type QuickCartResult = {
  vibe_category: AiVibe;
  carts: AiCart[];
};

export type QuickCartInput = {
  intent: string;
  groupSize: number;
  budgetTier: BackendBudgetTier;
  zoneCode: string;
};

export const aiApi = {
  quickCart: (input: QuickCartInput) =>
    apiClient.post<QuickCartResult>("/ai/quick-cart", input),
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
