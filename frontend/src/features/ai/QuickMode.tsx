import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAiPanel } from "./useAiPanel";
import { useZone } from "@/features/zone/useZone";
import { useCart } from "@/features/cart/useCart";
import { useToast } from "@/features/toast/useToast";
import { aiApi, type AiCart, type BackendBudgetTier, type QuickCartResult } from "@/api/ai.api";
import { ApiError } from "@/lib/ApiError";
import { getVibeTheme } from "./vibeTheme";

type QuickStep = "input" | "thinking" | "results";

const BUDGET_OPTIONS: { label: string; value: BackendBudgetTier }[] = [
  { label: "Essentials", value: "Essentials" },
  { label: "Standard", value: "Standard" },
  { label: "Premium", value: "Premium" },
];

const QUICK_CHIPS = [
  { label: "🎬 Movie night for 4", text: "movie night for 4 people, medium budget" },
  { label: "🍳 Breakfast for 2", text: "breakfast essentials for 2" },
  { label: "🎉 Birthday party at home", text: "birthday party snacks and drinks for 8" },
  { label: "💧 Summer hydration", text: "cold drinks and water for a hot day, 6 people" },
];

const STAGES = [
  "Understanding your intent",
  "Classifying the vibe",
  "Searching the catalog",
  "Assembling 3 carts",
];

function formatRupees(n: number) {
  return n.toLocaleString("en-IN");
}

export function QuickMode() {
  const { isOpen, close, prefill } = useAiPanel();
  const { zone } = useZone();
  const { add } = useCart();
  const { flash } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<QuickStep>("input");
  const [intent, setIntent] = useState("");
  const [groupSize, setGroupSize] = useState(4);
  const [budget, setBudget] = useState<BackendBudgetTier>("Standard");

  const [thinkingStage, setThinkingStage] = useState(0);
  const [result, setResult] = useState<QuickCartResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset to input + apply prefill on every open.
  useEffect(() => {
    if (!isOpen) return;
    setStep("input");
    setError(null);
    setThinkingStage(0);
    if (prefill) setIntent(prefill);
  }, [isOpen, prefill]);

  // Body scroll lock + Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, close]);

  const stageTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearStageTimers = () => {
    stageTimers.current.forEach((t) => clearTimeout(t));
    stageTimers.current = [];
  };

  const runQuick = async () => {
    const trimmed = intent.trim();
    if (!trimmed) {
      flash("Tell us what you need first");
      return;
    }
    if (!zone) {
      flash("Pick a delivery zone first");
      return;
    }

    setError(null);
    setStep("thinking");
    setThinkingStage(0);
    clearStageTimers();
    [600, 1150, 1650].forEach((ms, i) => {
      const id = setTimeout(() => setThinkingStage(i + 1), ms);
      stageTimers.current.push(id);
    });

    const minDelay = new Promise((r) => setTimeout(r, 1900));
    try {
      const [res] = await Promise.all([
        aiApi.quickCart({
          intent: trimmed,
          groupSize,
          budgetTier: budget,
          zoneCode: zone.code,
        }),
        minDelay,
      ]);
      setResult(res);
      setThinkingStage(4);
      setStep("results");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong";
      setError(message);
      setStep("input");
    } finally {
      clearStageTimers();
    }
  };

  const chooseCart = (cart: AiCart) => {
    cart.items.forEach((item) => {
      const p = item.product;
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
        item.quantity,
      );
    });
    const totalUnits = cart.items.reduce((n, i) => n + i.quantity, 0);
    flash(`Added your ${cart.tier} cart · ${totalUnits} items`);
    close();
    navigate("/checkout");
  };

  const theme = useMemo(() => getVibeTheme(result?.vibe_category), [result]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="quick-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={close}
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-auto px-5 py-10"
          style={{
            background: "rgba(15,20,28,0.62)",
            backdropFilter: "blur(3px)",
          }}
        >
          <motion.div
            key="quick-modal"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", damping: 26, stiffness: 240 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Quick Mode"
            className="relative w-full max-w-[940px] overflow-hidden rounded-[18px] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.4)]"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close Quick Mode"
              className="absolute right-4 top-4 z-[3] flex h-[34px] w-[34px] items-center justify-center rounded-full border-none text-[18px] text-white"
              style={{ background: "rgba(255,255,255,0.18)" }}
            >
              ✕
            </button>

            {/* Header */}
            <div
              className="flex items-center gap-3.5 px-[30px] py-6 text-white"
              style={{
                background: "linear-gradient(120deg,#131921 0%,#232f3e 60%,#37475a 100%)",
              }}
            >
              <div
                className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: "linear-gradient(135deg,#ff9900,#ff7847)",
                  boxShadow: "0 4px 14px rgba(255,140,40,0.5)",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#131921">
                  <path d="M12 2l1.8 6.4L20 10l-6.2 1.6L12 18l-1.8-6.4L4 10l6.2-1.6z" />
                </svg>
              </div>
              <div>
                <div className="text-[20px] font-extrabold tracking-tight">
                  Quick Mode{" "}
                  <span
                    className="rounded-[5px] px-[7px] py-[2px] align-middle text-[11px] font-bold text-[#ffce8a]"
                    style={{ background: "rgba(255,153,0,0.2)" }}
                  >
                    AI · BEDROCK
                  </span>
                </div>
                <div className="text-[13px] text-[#c8d0d8]">
                  From a single sentence to a ready-to-checkout cart.
                </div>
              </div>
            </div>

            {error && (
              <div className="border-b border-rose-200 bg-rose-50 px-[30px] py-3 text-[13px] text-rose-800">
                {error}
              </div>
            )}

            {step === "input" && (
              <InputStep
                intent={intent}
                onIntent={setIntent}
                groupSize={groupSize}
                onGroupSize={setGroupSize}
                budget={budget}
                onBudget={setBudget}
                onSubmit={runQuick}
                zoneLabel={
                  zone
                    ? `${zone.name} · ${zone.pincode}`
                    : "Connaught Place · 110001"
                }
              />
            )}

            {step === "thinking" && (
              <ThinkingStep intent={intent} stage={thinkingStage} />
            )}

            {step === "results" && result && (
              <ResultsStep
                result={result}
                groupSize={groupSize}
                recommendedTier={budget}
                themeAccent={theme.accent}
                themeSoft={theme.soft}
                themeGrad={theme.grad}
                themeName={theme.name}
                themeEmoji={theme.emoji}
                onBack={() => setStep("input")}
                onChoose={chooseCart}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ───────────── input ───────────── */

function InputStep({
  intent,
  onIntent,
  groupSize,
  onGroupSize,
  budget,
  onBudget,
  onSubmit,
  zoneLabel,
}: {
  intent: string;
  onIntent: (v: string) => void;
  groupSize: number;
  onGroupSize: (v: number) => void;
  budget: BackendBudgetTier;
  onBudget: (v: BackendBudgetTier) => void;
  onSubmit: () => void;
  zoneLabel: string;
}) {
  return (
    <div className="px-[30px] pb-[30px] pt-[26px]">
      <label className="mb-2 block text-[14px] font-bold text-[#0f1111]">
        What do you need?
      </label>
      <textarea
        value={intent}
        onChange={(e) => onIntent(e.target.value)}
        placeholder="e.g. movie night for 4 people, medium budget"
        className="block w-full resize-none rounded-xl border-2 border-[#e0e0e0] bg-white px-4 py-3.5 text-[16px] text-[#0f1111] outline-none transition focus:border-[#ff9900]"
        style={{ minHeight: "74px", fontFamily: "inherit" }}
      />

      <div className="mb-[22px] mt-3 flex flex-wrap gap-2">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip.text}
            type="button"
            onClick={() => onIntent(chip.text)}
            className="rounded-[18px] border border-[#e0e0e0] bg-[#f3f4f4] px-3.5 py-1.5 text-[13px] text-[#37475a] transition hover:border-[#ffb84d] hover:bg-[#fff3e0]"
            style={{ fontFamily: "inherit" }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="mb-[22px] grid grid-cols-1 items-center gap-6 border-y border-[#f0f0f0] py-4 sm:grid-cols-[auto_auto_1fr]">
        <div>
          <div className="mb-[7px] text-[12px] font-bold uppercase tracking-[0.05em] text-[#8a8f94]">
            People
          </div>
          <div className="inline-flex items-center overflow-hidden rounded-[10px] border border-[#d5d9d9]">
            <button
              type="button"
              onClick={() => onGroupSize(Math.max(1, groupSize - 1))}
              className="h-9 w-9 cursor-pointer border-none bg-[#f0f2f2] text-lg font-bold"
            >
              −
            </button>
            <span className="w-[42px] text-center text-[16px] font-extrabold tabular-nums">
              {groupSize}
            </span>
            <button
              type="button"
              onClick={() => onGroupSize(Math.min(20, groupSize + 1))}
              className="h-9 w-9 cursor-pointer border-none bg-[#f0f2f2] text-lg font-bold"
            >
              +
            </button>
          </div>
        </div>

        <div>
          <div className="mb-[7px] text-[12px] font-bold uppercase tracking-[0.05em] text-[#8a8f94]">
            Budget
          </div>
          <div className="inline-flex overflow-hidden rounded-[10px] border border-[#d5d9d9]">
            {BUDGET_OPTIONS.map((opt) => {
              const active = opt.value === budget;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onBudget(opt.value)}
                  className="cursor-pointer border-none px-3.5 py-2.5 text-[13px] font-bold transition"
                  style={{
                    background: active ? "#131921" : "#fff",
                    color: active ? "#fff" : "#37475a",
                    fontFamily: "inherit",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-right">
          <div className="mb-[7px] text-[12px] font-bold uppercase tracking-[0.05em] text-[#8a8f94]">
            Zone
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#eef1f3] px-3 py-2 text-[13px] font-bold text-[#37475a]">
            📍 {zoneLabel}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        className="flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-[26px] border-none text-[16px] font-extrabold text-[#131921] transition hover:brightness-105"
        style={{
          background: "linear-gradient(95deg,#ff9900,#ff7847)",
          fontFamily: "inherit",
          boxShadow: "0 6px 18px rgba(255,140,40,0.4)",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#131921" aria-hidden="true">
          <path d="M12 2l1.8 6.4L20 10l-6.2 1.6L12 18l-1.8-6.4L4 10l6.2-1.6z" />
        </svg>
        Build my carts
      </button>

      <div className="mt-[18px] flex justify-center gap-[18px] text-[12px] text-[#8a8f94]">
        <span>① Decompose intent</span>
        <span>② Hybrid search</span>
        <span>③ 3 budget carts</span>
      </div>
    </div>
  );
}

/* ───────────── thinking ───────────── */

function ThinkingStep({ intent, stage }: { intent: string; stage: number }) {
  return (
    <div className="px-[30px] py-[46px] pb-[50px] text-center">
      <div
        className="mx-auto mb-[22px] h-16 w-16 rounded-full"
        style={{
          border: "4px solid #f0e0c8",
          borderTopColor: "#ff9900",
          animation: "ap-spin 0.9s linear infinite",
        }}
      />
      <div className="mb-1 text-[19px] font-extrabold">Building your carts…</div>
      <div className="mb-[26px] text-[13px] text-[#565959]">
        Claude is turning “{intent}” into a shopping plan.
      </div>
      <div className="mx-auto flex max-w-[340px] flex-col gap-3.5 text-left">
        {STAGES.map((label, i) => {
          const active = Math.min(stage, 3);
          const done = i < active;
          const current = i === active;
          return (
            <div
              key={label}
              className="flex items-center gap-3 transition-opacity"
              style={{ opacity: done || current ? 1 : 0.5 }}
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold"
                style={{
                  background: done ? "#007600" : current ? "#fff" : "#eef1f3",
                  color: done ? "#fff" : current ? "#ff9900" : "#8a8f94",
                  border: current ? "2px solid #ff9900" : "none",
                }}
              >
                {done ? "✓" : current ? "●" : i + 1}
              </span>
              <span
                className="text-[14px]"
                style={{
                  fontWeight: done ? 700 : current ? 800 : 400,
                  color: done || current ? "#0f1111" : "#8a8f94",
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────── results ───────────── */

function ResultsStep({
  result,
  groupSize,
  recommendedTier,
  themeAccent,
  themeSoft,
  themeGrad,
  themeName,
  themeEmoji,
  onBack,
  onChoose,
}: {
  result: QuickCartResult;
  groupSize: number;
  recommendedTier: BackendBudgetTier;
  themeAccent: string;
  themeSoft: string;
  themeGrad: string;
  themeName: string;
  themeEmoji: string;
  onBack: () => void;
  onChoose: (cart: AiCart) => void;
}) {
  // Build a "shopping list" chip set from the cart items so the banner shows
  // what got searched. We don't have the raw queries from the response, so
  // we summarise per cart line in the recommended cart.
  const recommended =
    result.carts.find((c) => c.tier === recommendedTier) ?? result.carts[0];
  const chips =
    recommended?.items.slice(0, 6).map((it) => ({
      label: `${it.product.name} ×${it.quantity}`,
    })) ?? [];

  return (
    <div>
      {/* Vibe banner */}
      <div
        className="flex items-center gap-4 px-[30px] py-5 text-white"
        style={{ background: themeGrad }}
      >
        <div className="text-[40px] leading-none">{themeEmoji}</div>
        <div className="flex-1">
          <div className="text-[22px] font-extrabold">{themeName}</div>
        </div>
        <div className="flex max-w-[420px] flex-wrap justify-end gap-1.5">
          {chips.map((c, i) => (
            <span
              key={`${c.label}-${i}`}
              className="whitespace-nowrap rounded-[14px] border px-2.5 py-1 text-[12px] font-bold"
              style={{
                background: "rgba(255,255,255,0.22)",
                borderColor: "rgba(255,255,255,0.3)",
              }}
            >
              {c.label}
            </span>
          ))}
        </div>
      </div>

      <div className="px-[30px] pb-3.5 pt-6">
        <div className="mb-1 text-[15px] font-extrabold">
          Pick a cart — one tap to checkout
        </div>
        <div className="mb-[18px] text-[13px] text-[#565959]">
          Same plan at three budgets, scaled for {groupSize} people. Prices lock at
          checkout.
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {result.carts.map((cart) => (
            <CartCard
              key={cart.tier}
              cart={cart}
              recommended={cart.tier === recommendedTier}
              accent={themeAccent}
              soft={themeSoft}
              onChoose={() => onChoose(cart)}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-[30px] pb-[22px] pt-1.5">
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer border-none bg-transparent text-[13px] font-bold text-[#007185]"
        >
          ← Edit request
        </button>
        <span className="text-[11px] text-[#a0a5aa]">
          Powered by Claude on Amazon Bedrock · hybrid retrieval on in-stock items in
          your zone
        </span>
      </div>
    </div>
  );
}

function CartCard({
  cart,
  recommended,
  accent,
  soft,
  onChoose,
}: {
  cart: AiCart;
  recommended: boolean;
  accent: string;
  soft: string;
  onChoose: () => void;
}) {
  const totalUnits = cart.items.reduce((n, i) => n + i.quantity, 0);
  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-[14px] bg-white"
      style={{ border: `2px solid ${recommended ? accent : "#e3e3e3"}` }}
    >
      {recommended && (
        <div
          className="absolute right-0 top-0 rounded-bl-[8px] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.05em] text-white"
          style={{ background: accent }}
        >
          Recommended
        </div>
      )}
      <div
        className="px-3.5 pb-2.5 pt-3.5"
        style={{ background: recommended ? soft : "#fafafa" }}
      >
        <div className="text-[16px] font-extrabold text-[#0f1111]">
          {cart.title || cart.tier}
        </div>
        <div className="text-[12px] text-[#565959]">
          {totalUnits} items · ~10 min
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 border-t border-[#f0f0f0] px-3.5 py-2.5">
        {cart.items.slice(0, 5).map((it) => (
          <div
            key={it.product.id}
            className="flex justify-between gap-2 text-[12.5px] text-[#333]"
          >
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">
              <span className="font-extrabold" style={{ color: accent }}>
                {it.quantity}×
              </span>{" "}
              {it.product.name}
            </span>
            <span className="whitespace-nowrap text-[#8a8f94]">
              ₹{formatRupees(it.product.price * it.quantity)}
            </span>
          </div>
        ))}
        {cart.items.length > 5 && (
          <div className="text-[11px] text-[#8a8f94]">
            +{cart.items.length - 5} more
          </div>
        )}
      </div>
      <div className="border-t border-[#f0f0f0] px-3.5 py-3">
        <div className="mb-2.5 flex items-baseline justify-between">
          <span className="text-[12px] text-[#565959]">Total</span>
          <span className="text-[22px] font-extrabold text-[#0f1111]">
            ₹{formatRupees(cart.total)}
          </span>
        </div>
        <button
          type="button"
          onClick={onChoose}
          className="h-10 w-full cursor-pointer rounded-[20px] border-none text-[14px] font-extrabold text-white transition hover:brightness-110"
          style={{
            background: recommended ? accent : "#232f3e",
            fontFamily: "inherit",
          }}
        >
          Choose &amp; checkout
        </button>
      </div>
    </div>
  );
}
