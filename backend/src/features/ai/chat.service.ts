import { generateJSONFromMessages, type ChatMessage } from "../../config/bedrock.js";
import { ApiError } from "../../utils/ApiError.js";
import { retrieveCandidates, type RetrievedCandidate } from "./retrieve.service.js";
import { selectForTier } from "./quickCart.selector.js";
import { CHAT_SYSTEM_PROMPT, type ChatTurn } from "./chat.prompt.js";
import { VIBE_CATEGORIES, type VibeCategory } from "./quickCart.prompt.js";

/**
 * Conversation Mode service.
 *
 * Stateless: the frontend sends the full message history every turn. The model
 * either asks a clarifying question (shopping_list = null) or proposes a draft
 * cart (shopping_list = items). When a draft is proposed, we resolve it into
 * real products via the same hybrid retrieval used by Quick Mode.
 */

export interface ChatInput {
  messages: ChatMessage[];
  zoneCode: string;
}

export interface DraftCartItem {
  product: RetrievedCandidate;
  quantity: number;
}

export interface DraftCart {
  items: DraftCartItem[];
  total: number;
}

export interface ChatResult {
  reply: string;
  vibe_category: VibeCategory;
  draftCart: DraftCart | null;
}

const MAX_HISTORY = 30;
const RETRIEVAL_LIMIT = 12;
const MAX_SHOPPING_LIST = 10;

const isVibe = (v: unknown): v is VibeCategory =>
  typeof v === "string" && (VIBE_CATEGORIES as readonly string[]).includes(v);

const validateChatTurn = (raw: unknown): ChatTurn => {
  if (!raw || typeof raw !== "object") {
    throw new ApiError(502, "AI did not return an object");
  }
  const r = raw as Record<string, unknown>;

  const reply = typeof r.reply === "string" ? r.reply.trim() : "";
  if (!reply) throw new ApiError(502, "AI returned empty 'reply'");

  if (!isVibe(r.vibe_category)) {
    throw new ApiError(502, `AI returned invalid vibe_category: ${String(r.vibe_category)}`);
  }

  let shopping_list: ChatTurn["shopping_list"] = null;
  if (Array.isArray(r.shopping_list)) {
    const list = r.shopping_list.slice(0, MAX_SHOPPING_LIST).flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const i = item as Record<string, unknown>;
      const query = typeof i.query === "string" ? i.query.trim() : "";
      const qty = Number(i.quantity);
      if (!query || !Number.isFinite(qty) || qty <= 0) return [];
      return [{ query, quantity: Math.max(1, Math.round(qty)) }];
    });
    if (list.length > 0) shopping_list = list;
  }

  return { reply, vibe_category: r.vibe_category, shopping_list };
};

const validateMessages = (messages: ChatMessage[]): ChatMessage[] => {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new ApiError(400, "messages must be a non-empty array");
  }

  const cleaned = messages.flatMap((m): ChatMessage[] => {
    if (!m || typeof m !== "object") return [];
    const role = m.role;
    const content = typeof m.content === "string" ? m.content.trim() : "";
    if ((role !== "user" && role !== "assistant") || !content) return [];
    return [{ role, content }];
  });

  if (cleaned.length === 0 || cleaned[0]!.role !== "user") {
    throw new ApiError(400, "Conversation must start with a user message");
  }

  // Cap history so we don't blow the context window on long sessions.
  return cleaned.slice(-MAX_HISTORY);
};

/**
 * Resolve a model-proposed shopping list into a concrete draft cart by running
 * each item through hybrid retrieval and picking the Standard-tier candidate.
 * The conversation surface uses a single tier (Standard) for simplicity —
 * Quick Mode is the surface that exposes Essentials/Premium alternatives.
 */
const resolveDraftCart = async (
  shoppingList: NonNullable<ChatTurn["shopping_list"]>,
  zoneCode: string
): Promise<DraftCart | null> => {
  const retrievals = await Promise.all(
    shoppingList.map(async (item) => ({
      quantity: item.quantity,
      candidates: await retrieveCandidates(item.query, zoneCode, {
        limit: RETRIEVAL_LIMIT,
      }),
    }))
  );

  const items: DraftCartItem[] = [];
  const seen = new Set<string>();
  for (const r of retrievals) {
    const product = selectForTier(r.candidates, "Standard");
    if (!product) continue;
    if (seen.has(product.id)) {
      const existing = items.find((it) => it.product.id === product.id)!;
      existing.quantity += r.quantity;
      continue;
    }
    seen.add(product.id);
    items.push({ product, quantity: r.quantity });
  }

  if (items.length === 0) return null;

  const total = items.reduce((sum, it) => sum + it.product.price * it.quantity, 0);
  return { items, total };
};

export const runChat = async (input: ChatInput): Promise<ChatResult> => {
  if (!input.zoneCode) throw new ApiError(400, "Missing zoneCode");

  const messages = validateMessages(input.messages);

  const turn = validateChatTurn(
    await generateJSONFromMessages(CHAT_SYSTEM_PROMPT, messages)
  );

  const draftCart = turn.shopping_list
    ? await resolveDraftCart(turn.shopping_list, input.zoneCode)
    : null;

  return {
    reply: turn.reply,
    vibe_category: turn.vibe_category,
    draftCart,
  };
};
