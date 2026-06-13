import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SparkleIcon } from "@/components/ui/Icons";
import { useCart } from "@/features/cart/useCart";
import { useAiPanel } from "./useAiPanel";
import { CONVERSATION_SCRIPT, resolveProducts } from "./conversationScript";
import type { DisplayProduct } from "@/types/product";

type ChatMessage =
  | { id: string; role: "assistant"; text: string }
  | { id: string; role: "user"; text: string };

function formatRupees(n: number) {
  return n.toLocaleString("en-IN");
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function Conversation() {
  // Always render the first assistant message up front.
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: uid(), role: "assistant", text: CONVERSATION_SCRIPT[0]!.assistantText },
  ]);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<DisplayProduct[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const currentReplies = CONVERSATION_SCRIPT[step]?.suggestedReplies ?? [];
  const atEnd = step >= CONVERSATION_SCRIPT.length - 1;

  const handleSend = (raw: string) => {
    const text = raw.trim();
    if (!text || isTyping || atEnd) return;

    setInput("");
    setMessages((m) => [...m, { id: uid(), role: "user", text }]);

    const next = step + 1;
    const nextStep = CONVERSATION_SCRIPT[next];
    if (!nextStep) return;

    setIsTyping(true);
    window.setTimeout(() => {
      setDraft((prev) => {
        const additions = resolveProducts(nextStep.addProductIds).filter(
          (p) => !prev.some((x) => x.id === p.id),
        );
        return additions.length ? [...prev, ...additions] : prev;
      });
      setMessages((m) => [
        ...m,
        { id: uid(), role: "assistant", text: nextStep.assistantText },
      ]);
      setStep(next);
      setIsTyping(false);
    }, 850);
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
      <ChatThread
        messages={messages}
        isTyping={isTyping}
        atEnd={atEnd}
        suggested={currentReplies}
        onSend={handleSend}
        input={input}
        setInput={setInput}
      />
      <DraftCartPanel items={draft} />
    </div>
  );
}

/* ───────── chat thread ───────── */

function ChatThread({
  messages,
  isTyping,
  atEnd,
  suggested,
  onSend,
  input,
  setInput,
}: {
  messages: ChatMessage[];
  isTyping: boolean;
  atEnd: boolean;
  suggested: string[];
  onSend: (text: string) => void;
  input: string;
  setInput: (v: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

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
        </AnimatePresence>
      </div>

      {/* Suggested replies */}
      {suggested.length > 0 && !isTyping && !atEnd && (
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
          placeholder={atEnd ? "Conversation finished — checkout when ready" : "Type your reply…"}
          disabled={atEnd || isTyping}
          aria-label="Chat with AI"
          className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white placeholder-slate-500 transition focus:outline-none disabled:opacity-50 focus:[box-shadow:inset_0_0_0_1px_var(--color-vibe-accent)]"
        />
        <button
          type="submit"
          disabled={atEnd || isTyping || !input.trim()}
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
  role: ChatMessage["role"];
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

function DraftCartPanel({ items }: { items: DisplayProduct[] }) {
  const { add } = useCart();
  const { close } = useAiPanel();
  const [checkedOut, setCheckedOut] = useState(false);

  const totals = useMemo(() => {
    const total = items.reduce((n, p) => n + p.price, 0);
    const totalMrp = items.reduce((n, p) => n + p.mrp, 0);
    return { total, savings: Math.max(0, totalMrp - total) };
  }, [items]);

  const handleCheckout = () => {
    if (!items.length) return;
    for (const p of items) {
      add(
        {
          productId: p.id,
          name: p.name,
          brand: p.brand,
          unit: p.unit,
          imageUrl: p.imageUrl,
          price: p.price,
          mrp: p.mrp,
          etaMinutes: p.etaMinutes,
        },
        1,
      );
    }
    setCheckedOut(true);
    setTimeout(() => close(), 700);
  };

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
          {items.length} item{items.length === 1 ? "" : "s"}
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
              {items.map((p) => (
                <motion.li
                  key={p.id}
                  layout
                  initial={{ opacity: 0, x: 12, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ type: "spring", damping: 24, stiffness: 280 }}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/[0.04]"
                >
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md border border-white/10 bg-slate-900">
                    <img
                      src={p.imageUrl}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-white">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-slate-400">{p.unit}</div>
                  </div>
                  <div className="text-xs font-semibold tabular-nums text-white">
                    ₹{formatRupees(p.price)}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <footer className="border-t border-white/10 px-4 py-3">
        <div className="flex items-center justify-between text-sm text-slate-200">
          <span>Total</span>
          <span className="font-bold text-white tabular-nums">
            ₹{formatRupees(totals.total)}
          </span>
        </div>
        {totals.savings > 0 && (
          <div className="mt-0.5 flex items-center justify-between text-[11px] text-emerald-400">
            <span>You save</span>
            <span className="font-semibold tabular-nums">
              ₹{formatRupees(totals.savings)}
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={handleCheckout}
          disabled={!items.length || checkedOut}
          className={
            "mt-3 w-full rounded-full py-2 text-sm font-semibold transition " +
            (checkedOut
              ? "bg-emerald-400 text-slate-900"
              : "text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none")
          }
          style={
            checkedOut
              ? undefined
              : {
                  backgroundImage:
                    "linear-gradient(90deg, var(--color-vibe-accent), var(--color-vibe-accent-2))",
                  boxShadow: "0 6px 24px -6px var(--color-vibe-glow)",
                }
          }
        >
          {checkedOut ? "Added ✓" : "Checkout draft cart"}
        </button>
        <p className="mt-1.5 text-center text-[10px] text-slate-500">
          Delivery in ~10 min
        </p>
      </footer>
    </aside>
  );
}
