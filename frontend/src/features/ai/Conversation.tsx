import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { SparkleIcon } from "@/components/ui/Icons";
import { useZone } from "@/features/zone/useZone";
import { useVibe } from "@/features/vibe/useVibe";
import { ApiError } from "@/lib/ApiError";
import {
  aiApi,
  type ChatMessage as ApiChatMessage,
  type DraftCart,
  type DraftCartItem,
} from "@/api/ai.api";
import { ordersApi, type Order } from "@/api/orders.api";
import { useAiPanel } from "./useAiPanel";

type UiMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

const OPENING_LINE =
  "Hey! Tell me what you need — a meal, a fix, a party — and I'll build a cart for you.";

function formatRupees(n: number) {
  return n.toLocaleString("en-IN");
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

const SUGGESTED_OPENERS = [
  "Breakfast for 2",
  "I have a fever",
  "Birthday party for 6",
  "Restock my groceries",
];

export function Conversation() {
  const [messages, setMessages] = useState<UiMessage[]>(() => [
    { id: uid(), role: "assistant", text: OPENING_LINE },
  ]);
  const [draftCart, setDraftCart] = useState<DraftCart | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { zone } = useZone();
  const { setVibe } = useVibe();

  // Stateless backend — keep the full transcript here and send it every turn.
  // We don't include the local opening line: the backend conversation starts
  // with the user's first message.
  const apiHistoryRef = useRef<ApiChatMessage[]>([]);

  const handleSend = async (raw: string) => {
    const text = raw.trim();
    if (!text || isTyping) return;
    if (!zone) {
      setError("Pick a delivery zone first.");
      return;
    }

    setInput("");
    setError(null);

    const userTurn: ApiChatMessage = { role: "user", content: text };
    apiHistoryRef.current = [...apiHistoryRef.current, userTurn];

    setMessages((m) => [...m, { id: uid(), role: "user", text }]);
    setIsTyping(true);

    try {
      const result = await aiApi.chat({
        messages: apiHistoryRef.current,
        zoneCode: zone.code,
      });

      apiHistoryRef.current = [
        ...apiHistoryRef.current,
        { role: "assistant", content: result.reply },
      ];

      setVibe(result.vibe_category);
      setMessages((m) => [
        ...m,
        { id: uid(), role: "assistant", text: result.reply },
      ]);
      // null draftCart means "still asking" — keep whatever was previously
      // resolved on the screen so an in-progress cart isn't wiped by a follow-up
      // question. Only overwrite when the model returns a new resolved cart.
      if (result.draftCart) setDraftCart(result.draftCart);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong";
      setError(message);
      // Drop the user turn from the API history on failure so the next send
      // doesn't keep replaying it. The UI bubble stays so the user sees what
      // they typed.
      apiHistoryRef.current = apiHistoryRef.current.slice(0, -1);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
      <ChatThread
        messages={messages}
        isTyping={isTyping}
        error={error}
        suggested={messages.length === 1 ? SUGGESTED_OPENERS : []}
        onSend={handleSend}
        input={input}
        setInput={setInput}
      />
      <DraftCartPanel cart={draftCart} />
    </div>
  );
}

/* ───────── chat thread ───────── */

function ChatThread({
  messages,
  isTyping,
  error,
  suggested,
  onSend,
  input,
  setInput,
}: {
  messages: UiMessage[];
  isTyping: boolean;
  error: string | null;
  suggested: string[];
  onSend: (text: string) => void;
  input: string;
  setInput: (v: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isTyping, error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend(input);
  };

  return (
    <div className="flex min-h-[440px] flex-col rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={
                "flex " + (m.role === "user" ? "justify-end" : "justify-start")
              }
            >
              <Bubble role={m.role}>{m.text}</Bubble>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <Bubble role="assistant">
                <TypingDots />
              </Bubble>
            </motion.div>
          )}
          {error && !isTyping && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="max-w-[88%] rounded-2xl border border-rose-400/30 bg-rose-500/10 px-3.5 py-2 text-sm text-rose-100">
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Suggested replies */}
      {suggested.length > 0 && !isTyping && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {suggested.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSend(s)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-200 transition hover:bg-white/[0.08] hover:[border-color:var(--color-vibe-accent)]"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-white/10 px-3 py-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your reply…"
          disabled={isTyping}
          aria-label="Chat with AI"
          className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white placeholder-slate-500 transition focus:outline-none disabled:opacity-50 focus:[box-shadow:inset_0_0_0_1px_var(--color-vibe-accent)]"
        />
        <button
          type="submit"
          disabled={isTyping || !input.trim()}
          aria-label="Send"
          className="rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          style={{
            backgroundImage:
              "linear-gradient(90deg, var(--color-vibe-accent), var(--color-vibe-accent-2))",
            boxShadow: "0 6px 20px -8px var(--color-vibe-glow)",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

function Bubble({
  role,
  children,
}: {
  role: UiMessage["role"];
  children: React.ReactNode;
}) {
  const base = "max-w-[88%] rounded-2xl px-3.5 py-2 text-sm leading-snug";
  if (role === "user") {
    return (
      <div
        className={base + " text-white"}
        style={{
          backgroundImage:
            "linear-gradient(135deg, var(--color-vibe-accent), var(--color-vibe-accent-2))",
        }}
      >
        {children}
      </div>
    );
  }
  return (
    <div className={base + " border border-white/10 bg-white/[0.06] text-slate-100"}>
      {children}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: "var(--color-vibe-accent)" }}
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.15,
          }}
        />
      ))}
    </span>
  );
}

/* ───────── draft cart ───────── */

type CheckoutPhase =
  | { kind: "idle" }
  | { kind: "placing" }
  | { kind: "error"; message: string }
  | { kind: "success"; order: Order };

function DraftCartPanel({ cart }: { cart: DraftCart | null }) {
  const { close } = useAiPanel();
  const { zone } = useZone();
  const [phase, setPhase] = useState<CheckoutPhase>({ kind: "idle" });

  const items = cart?.items ?? [];
  const total = cart?.total ?? 0;

  const totalMrp = useMemo(
    () => items.reduce((n, it) => n + it.product.mrp * it.quantity, 0),
    [items],
  );
  const savings = Math.max(0, totalMrp - total);
  const itemCount = items.length;
  const totalUnits = items.reduce((n, it) => n + it.quantity, 0);

  // Reset checkout phase whenever the model proposes a new draft.
  useEffect(() => {
    if (phase.kind === "success" || phase.kind === "error") {
      setPhase({ kind: "idle" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);

  const handleCheckout = async () => {
    if (!items.length || !zone) return;
    setPhase({ kind: "placing" });
    try {
      const order = await ordersApi.create({
        zoneCode: zone.code,
        items: items.map((it) => ({
          productId: it.product.id,
          quantity: it.quantity,
        })),
      });
      setPhase({ kind: "success", order });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Checkout failed";
      setPhase({ kind: "error", message });
    }
  };

  if (phase.kind === "success") {
    return <DraftSuccessPanel order={phase.order} onClose={close} />;
  }

  return (
    <aside className="flex flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-xl">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div
          className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em]"
          style={{ color: "var(--color-vibe-accent-2)" }}
        >
          <SparkleIcon className="h-3.5 w-3.5" />
          Draft cart
        </div>
        <span className="text-[11px] text-slate-400 tabular-nums">
          {itemCount} item{itemCount === 1 ? "" : "s"}
          {totalUnits !== itemCount && itemCount > 0 && ` · ${totalUnits} units`}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {items.length === 0 ? (
          <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-1 px-4 text-center">
            <div className="text-3xl opacity-50">🪄</div>
            <div className="text-xs text-slate-400">
              Items will appear here as we chat.
            </div>
          </div>
        ) : (
          <ul className="space-y-1">
            <AnimatePresence initial={false}>
              {items.map((it) => (
                <DraftRow key={it.product.id} item={it} />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <footer className="border-t border-white/10 px-4 py-3">
        <div className="flex items-center justify-between text-sm text-slate-200">
          <span>Total</span>
          <span className="font-bold text-white tabular-nums">
            ₹{formatRupees(total)}
          </span>
        </div>
        {savings > 0 && (
          <div className="mt-0.5 flex items-center justify-between text-[11px] text-emerald-400">
            <span>You save</span>
            <span className="font-semibold tabular-nums">
              ₹{formatRupees(savings)}
            </span>
          </div>
        )}
        {phase.kind === "error" && (
          <div className="mt-2 rounded-md border border-rose-400/30 bg-rose-500/10 px-2.5 py-1.5 text-[11px] text-rose-100">
            {phase.message}
          </div>
        )}
        <button
          type="button"
          onClick={handleCheckout}
          disabled={!items.length || phase.kind === "placing" || !zone}
          className="mt-3 w-full rounded-full py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          style={{
            backgroundImage:
              "linear-gradient(90deg, var(--color-vibe-accent), var(--color-vibe-accent-2))",
            boxShadow: "0 6px 24px -6px var(--color-vibe-glow)",
          }}
        >
          {phase.kind === "placing" ? "Placing order…" : "Checkout draft cart"}
        </button>
        <p className="mt-1.5 text-center text-[10px] text-slate-500">
          Delivery in ~10 min
        </p>
      </footer>
    </aside>
  );
}

function DraftSuccessPanel({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <aside className="flex flex-col rounded-2xl border border-emerald-400/30 bg-gradient-to-b from-emerald-500/10 to-white/[0.02] backdrop-blur-xl">
      <header className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-sm text-white">
          ✓
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">Order placed</div>
          <div className="truncate text-[11px] text-slate-400">
            #{order.id.slice(-6).toUpperCase()} · ETA ~10 min
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-1.5">
          {order.items.map((it) => (
            <li key={it.id} className="flex items-center justify-between text-xs">
              <div className="min-w-0 pr-2">
                <div className="truncate font-medium text-white">{it.name}</div>
                <div className="text-[10px] text-slate-400">
                  {it.quantity} × ₹{formatRupees(it.price)}
                </div>
              </div>
              <div className="font-semibold tabular-nums text-white">
                ₹{formatRupees(it.price * it.quantity)}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <footer className="border-t border-white/10 px-3 py-3">
        <div className="flex items-center justify-between text-xs text-slate-200">
          <span>Total</span>
          <span className="font-bold tabular-nums text-white">
            ₹{formatRupees(order.total)}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            to="/orders"
            onClick={onClose}
            className="rounded-full border border-white/20 bg-white/[0.06] py-1.5 text-center text-xs font-semibold text-white hover:bg-white/[0.1]"
          >
            View orders
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-emerald-400 py-1.5 text-xs font-bold text-slate-900 hover:bg-emerald-300"
          >
            Done
          </button>
        </div>
      </footer>
    </aside>
  );
}

function DraftRow({ item }: { item: DraftCartItem }) {
  const p = item.product;
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: 12, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ type: "spring", damping: 24, stiffness: 280 }}
      className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/[0.04]"
    >
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-white/10 bg-slate-900">
        <img
          src={p.imageUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
        {item.quantity > 1 && (
          <span className="absolute -right-1 -top-1 rounded-full bg-slate-900 px-1 text-[9px] font-bold text-white ring-1 ring-white/30">
            ×{item.quantity}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium text-white">{p.name}</div>
        <div className="text-[10px] text-slate-400">{p.unit}</div>
      </div>
      <div className="text-xs font-semibold tabular-nums text-white">
        ₹{formatRupees(p.price * item.quantity)}
      </div>
    </motion.li>
  );
}
