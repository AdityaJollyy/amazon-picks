import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAiPanel } from "./useAiPanel";
import { useZone } from "@/features/zone/useZone";
import { useCart } from "@/features/cart/useCart";
import { useToast } from "@/features/toast/useToast";
import {
  aiApi,
  type AiCart,
  type AiDropped,
  type BuildResult,
  type PlannedNeed,
  type ShoppingPlan,
} from "@/api/ai.api";
import { ApiError } from "@/lib/ApiError";
import { getVibeTheme } from "./vibeTheme";

type QuickStep = "input" | "planning" | "plan" | "building" | "results";

const QUICK_CHIPS = [
  { label: "🎬 Movie night for 4", text: "movie night for 4 people, snacks and drinks" },
  { label: "🍳 Breakfast for 2", text: "breakfast essentials for 2" },
  { label: "🎉 Birthday party at home", text: "birthday party for 8 people, cake and snacks" },
  { label: "💧 Fever and headache", text: "i have fever and headache, need medicine" },
];

const PLANNING_STAGES = [
  "Reading your request",
  "Working out what you'll need",
];

const BUILDING_STAGES = [
  "Searching the catalog in your zone",
  "Picking the best products",
  "Assembling your cart",
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

  const [planStage, setPlanStage] = useState(0);
  const [buildStage, setBuildStage] = useState(0);

  const [plan, setPlan] = useState<ShoppingPlan | null>(null);
  const [editedNeeds, setEditedNeeds] = useState<PlannedNeed[]>([]);
  const [result, setResult] = useState<BuildResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep("input");
    setError(null);
    setPlanStage(0);
    setBuildStage(0);
    setPlan(null);
    setEditedNeeds([]);
    setResult(null);
    if (prefill) setIntent(prefill);
  }, [isOpen, prefill]);

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

  const runPlan = async () => {
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
    setStep("planning");
    setPlanStage(0);
    clearStageTimers();
    [700].forEach((ms, i) => {
      const id = setTimeout(() => setPlanStage(i + 1), ms);
      stageTimers.current.push(id);
    });

    const minDelay = new Promise((r) => setTimeout(r, 1400));
    try {
      const [res] = await Promise.all([
        aiApi.plan({ intent: trimmed, groupSize, zoneCode: zone.code }),
        minDelay,
      ]);
      setPlan(res.plan);
      setEditedNeeds(res.plan.needs);
      setPlanStage(2);
      setStep("plan");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong";
      setError(message);
      setStep("input");
    } finally {
      clearStageTimers();
    }
  };

  const runBuild = async () => {
    if (!plan || !zone) return;
    if (editedNeeds.length === 0) {
      flash("Keep at least one item in the plan");
      return;
    }

    setError(null);
    setStep("building");
    setBuildStage(0);
    clearStageTimers();
    [800, 1700].forEach((ms, i) => {
      const id = setTimeout(() => setBuildStage(i + 1), ms);
      stageTimers.current.push(id);
    });

    const minDelay = new Promise((r) => setTimeout(r, 2200));
    try {
      const [res] = await Promise.all([
        aiApi.build({
          intent: intent.trim(),
          groupSize,
          zoneCode: zone.code,
          plan: { ...plan, needs: editedNeeds },
        }),
        minDelay,
      ]);
      setResult(res);
      setBuildStage(3);
      setStep("results");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong";
      setError(message);
      setStep("plan");
    } finally {
      clearStageTimers();
    }
  };

  const removeNeed = (query: string) => {
    setEditedNeeds((curr) => curr.filter((n) => n.query !== query));
  };

  const updateNeedQty = (query: string, qty: number) => {
    setEditedNeeds((curr) =>
      curr.map((n) =>
        n.query === query
          ? { ...n, quantity: Math.max(1, Math.min(12, Math.round(qty))) }
          : n
      )
    );
  };

  const checkout = (cart: AiCart) => {
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
    flash(`Added ${cart.itemCount} items to cart`);
    close();
    navigate("/checkout");
  };

  const planVibe = plan?.vibe_category;
  const resultVibe = result?.vibe_category;
  const theme = useMemo(
    () => getVibeTheme(resultVibe ?? planVibe),
    [planVibe, resultVibe]
  );

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
            className="relative w-full max-w-[760px] overflow-hidden rounded-[18px] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.4)]"
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

            <div
              className="flex items-center gap-3.5 px-[30px] py-6 text-white"
              style={{
                background:
                  "linear-gradient(120deg,#131921 0%,#232f3e 60%,#37475a 100%)",
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
                  Plan first. Confirm. Then we shop.
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
                onSubmit={runPlan}
                zoneLabel={
                  zone
                    ? `${zone.name} · ${zone.pincode}`
                    : "Connaught Place · 110001"
                }
              />
            )}

            {step === "planning" && (
              <ThinkingStep
                title="Planning your cart…"
                subtitle={`Reading "${intent}" and working out what you'll actually need.`}
                stages={PLANNING_STAGES}
                stage={planStage}
              />
            )}

            {step === "plan" && plan && (
              <PlanStep
                plan={plan}
                needs={editedNeeds}
                onRemove={removeNeed}
                onQty={updateNeedQty}
                onBack={() => setStep("input")}
                onConfirm={runBuild}
                themeAccent={theme.accent}
                themeSoft={theme.soft}
                themeGrad={theme.grad}
                themeName={theme.name}
                themeEmoji={theme.emoji}
              />
            )}

            {step === "building" && (
              <ThinkingStep
                title="Shopping for you…"
                subtitle={`Finding the best in-stock match for ${editedNeeds.length} item${editedNeeds.length === 1 ? "" : "s"}.`}
                stages={BUILDING_STAGES}
                stage={buildStage}
              />
            )}

            {step === "results" && result && (
              <ResultsStep
                result={result}
                themeAccent={theme.accent}
                themeSoft={theme.soft}
                themeGrad={theme.grad}
                themeName={theme.name}
                themeEmoji={theme.emoji}
                onBack={() => setStep("plan")}
                onCheckout={() => checkout(result.cart)}
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
  onSubmit,
  zoneLabel,
}: {
  intent: string;
  onIntent: (v: string) => void;
  groupSize: number;
  onGroupSize: (v: number) => void;
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
        placeholder="e.g. movie night for 4 people, snacks and drinks"
        className="block w-full resize-none rounded-xl border-2 border-[#e0e0e0] bg-white px-4 py-3.5 text-[16px] text-[#0f1111] outline-none transition focus:border-[#ff9900]"
        style={{ minHeight: "74px", fontFamily: "inherit" }}
        maxLength={500}
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

      <div className="mb-[22px] grid grid-cols-1 items-center gap-6 border-y border-[#f0f0f0] py-4 sm:grid-cols-[auto_1fr]">
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
        Plan my cart
      </button>

      <div className="mt-[18px] flex justify-center gap-[18px] text-[12px] text-[#8a8f94]">
        <span>① AI plans</span>
        <span>② You confirm</span>
        <span>③ We shop &amp; pick</span>
      </div>
    </div>
  );
}

/* ───────────── thinking ───────────── */

function ThinkingStep({
  title,
  subtitle,
  stages,
  stage,
}: {
  title: string;
  subtitle: string;
  stages: string[];
  stage: number;
}) {
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
      <div className="mb-1 text-[19px] font-extrabold">{title}</div>
      <div className="mb-[26px] text-[13px] text-[#565959]">{subtitle}</div>
      <div className="mx-auto flex max-w-[340px] flex-col gap-3.5 text-left">
        {stages.map((label, i) => {
          const active = Math.min(stage, stages.length - 1);
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

/* ───────────── plan ───────────── */

function PlanStep({
  plan,
  needs,
  onRemove,
  onQty,
  onBack,
  onConfirm,
  themeAccent,
  themeSoft,
  themeGrad,
  themeName,
  themeEmoji,
}: {
  plan: ShoppingPlan;
  needs: PlannedNeed[];
  onRemove: (query: string) => void;
  onQty: (query: string, qty: number) => void;
  onBack: () => void;
  onConfirm: () => void;
  themeAccent: string;
  themeSoft: string;
  themeGrad: string;
  themeName: string;
  themeEmoji: string;
}) {
  const removed = plan.needs.length - needs.length;
  return (
    <div>
      <div className="px-[30px] py-5 text-white" style={{ background: themeGrad }}>
        <div className="flex items-center gap-3">
          <div className="text-[36px] leading-none">{themeEmoji}</div>
          <div className="flex-1">
            <div className="text-[20px] font-extrabold leading-tight">
              Here's what I think you'll need
            </div>
            {plan.intent_summary && (
              <div className="mt-0.5 text-[13px] opacity-90">
                {plan.intent_summary}
              </div>
            )}
          </div>
          <span
            className="hidden whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.05em] sm:inline-block"
            style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
          >
            {themeName}
          </span>
        </div>
      </div>

      <div className="px-[30px] pb-3 pt-5">
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <span className="text-[15px] font-extrabold">
            Plan ({needs.length} item{needs.length === 1 ? "" : "s"})
          </span>
          <span className="text-[12px] text-[#565959]">
            Edit anything you don't want
          </span>
        </div>

        {needs.length === 0 ? (
          <div className="mt-2.5 rounded-[12px] border border-dashed border-[#d5d9d9] bg-[#fafafa] px-4 py-6 text-center text-[13px] text-[#565959]">
            Plan is empty. Go back and edit your request.
          </div>
        ) : (
          <ul className="mt-2.5 flex flex-col divide-y divide-[#f0f0f0] overflow-hidden rounded-[12px] border border-[#ececec]">
            {needs.map((need) => (
              <PlanLine
                key={need.query}
                need={need}
                accent={themeAccent}
                soft={themeSoft}
                onRemove={() => onRemove(need.query)}
                onQty={(q) => onQty(need.query, q)}
              />
            ))}
          </ul>
        )}

        {removed > 0 && (
          <div className="mt-2.5 text-[12px] text-[#565959]">
            {removed} item{removed === 1 ? "" : "s"} removed.{" "}
            <button
              type="button"
              onClick={onBack}
              className="cursor-pointer border-none bg-transparent p-0 text-[12px] font-bold text-[#007185] underline"
            >
              start over
            </button>
          </div>
        )}
      </div>

      <div className="px-[30px] pb-[22px] pt-4">
        <button
          type="button"
          onClick={onConfirm}
          disabled={needs.length === 0}
          className="flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-[26px] border-none text-[16px] font-extrabold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: themeAccent, fontFamily: "inherit" }}
        >
          Looks good — shop &amp; build my cart
        </button>
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer border-none bg-transparent text-[13px] font-bold text-[#007185]"
          >
            ← Edit request
          </button>
          <span className="text-[11px] text-[#a0a5aa]">
            We'll search your zone and pick the best in-stock items.
          </span>
        </div>
      </div>
    </div>
  );
}

function PlanLine({
  need,
  accent,
  soft,
  onRemove,
  onQty,
}: {
  need: PlannedNeed;
  accent: string;
  soft: string;
  onRemove: () => void;
  onQty: (q: number) => void;
}) {
  return (
    <li className="flex items-center gap-3 bg-white px-3.5 py-3">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[14px]"
        style={{ background: soft, color: accent }}
      >
        ✓
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[14px] font-bold text-[#0f1111]">
            {need.query}
          </span>
          {need.priority === "nice" && (
            <span className="shrink-0 rounded-[5px] bg-[#eef1f3] px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.05em] text-[#565959]">
              nice
            </span>
          )}
        </div>
        {need.note && (
          <div className="mt-0.5 truncate text-[12px] text-[#565959]">
            {need.note}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="inline-flex items-center overflow-hidden rounded-[8px] border border-[#d5d9d9]">
          <button
            type="button"
            onClick={() => onQty(need.quantity - 1)}
            className="h-7 w-7 cursor-pointer border-none bg-[#f7f7f7] text-[14px] font-bold disabled:opacity-40"
            disabled={need.quantity <= 1}
            aria-label={`Decrease quantity of ${need.query}`}
          >
            −
          </button>
          <span className="w-7 text-center text-[13px] font-extrabold tabular-nums">
            {need.quantity}
          </span>
          <button
            type="button"
            onClick={() => onQty(need.quantity + 1)}
            className="h-7 w-7 cursor-pointer border-none bg-[#f7f7f7] text-[14px] font-bold disabled:opacity-40"
            disabled={need.quantity >= 12}
            aria-label={`Increase quantity of ${need.query}`}
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${need.query}`}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-[#e3e3e3] bg-white text-[14px] text-[#8a8f94] transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
        >
          ✕
        </button>
      </div>
    </li>
  );
}

/* ───────────── results ───────────── */

function ResultsStep({
  result,
  themeAccent,
  themeSoft,
  themeGrad,
  themeName,
  themeEmoji,
  onBack,
  onCheckout,
}: {
  result: BuildResult;
  themeAccent: string;
  themeSoft: string;
  themeGrad: string;
  themeName: string;
  themeEmoji: string;
  onBack: () => void;
  onCheckout: () => void;
}) {
  const { cart, dropped, intent_summary } = result;
  const eta = useMemo(() => {
    if (cart.items.length === 0) return 10;
    return Math.max(...cart.items.map((it) => it.product.etaMinutes));
  }, [cart.items]);

  return (
    <div>
      <div
        className="px-[30px] py-5 text-white"
        style={{ background: themeGrad }}
      >
        <div className="flex items-center gap-3">
          <div className="text-[36px] leading-none">{themeEmoji}</div>
          <div className="flex-1">
            <div className="text-[20px] font-extrabold leading-tight">
              {themeName}
            </div>
            {intent_summary && (
              <div className="mt-0.5 text-[13px] opacity-90">
                {intent_summary}
              </div>
            )}
          </div>
          <div className="hidden text-right text-[12px] opacity-90 sm:block">
            <div className="font-bold">~{eta} min</div>
            <div>delivery</div>
          </div>
        </div>
      </div>

      <div className="px-[30px] pb-3 pt-5">
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <span className="text-[15px] font-extrabold">Your cart</span>
          <span className="text-[12px] text-[#565959]">
            {cart.itemCount} items · ~{eta} min
          </span>
        </div>

        <div className="mt-2.5 flex flex-col divide-y divide-[#f0f0f0] overflow-hidden rounded-[12px] border border-[#ececec]">
          {cart.items.map((it) => (
            <CartLine
              key={it.product.id}
              item={it}
              accent={themeAccent}
              soft={themeSoft}
            />
          ))}
        </div>

        {dropped.length > 0 && <DroppedSection dropped={dropped} />}
      </div>

      <div className="px-[30px] pb-[22px] pt-3">
        <div className="mb-3 flex items-baseline justify-between rounded-[12px] bg-[#fafafa] px-4 py-3">
          <span className="text-[13px] text-[#565959]">Total</span>
          <span className="text-[24px] font-extrabold text-[#0f1111]">
            ₹{formatRupees(cart.total)}
          </span>
        </div>
        <button
          type="button"
          onClick={onCheckout}
          className="flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-[26px] border-none text-[16px] font-extrabold text-white transition hover:brightness-110"
          style={{ background: themeAccent, fontFamily: "inherit" }}
        >
          Add all &amp; checkout · ₹{formatRupees(cart.total)}
        </button>
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer border-none bg-transparent text-[13px] font-bold text-[#007185]"
          >
            ← Back to plan
          </button>
          <span className="text-[11px] text-[#a0a5aa]">
            Powered by AI on Amazon Bedrock
          </span>
        </div>
      </div>
    </div>
  );
}

function CartLine({
  item,
  accent,
  soft,
}: {
  item: AiCart["items"][number];
  accent: string;
  soft: string;
}) {
  const p = item.product;
  const lineTotal = p.price * item.quantity;
  const savings = (p.mrp - p.price) * item.quantity;
  return (
    <div className="flex items-start gap-3 bg-white px-3.5 py-3">
      <div
        className="flex h-[58px] w-[58px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#f7f7f7]"
        style={{ border: "1px solid #ececec" }}
      >
        {p.imageUrl ? (
          <img
            src={p.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-[20px]">📦</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span
            className="rounded-[6px] px-1.5 py-0.5 text-[11px] font-extrabold leading-none"
            style={{ background: soft, color: accent }}
          >
            {item.quantity}×
          </span>
          <span className="truncate text-[14px] font-bold text-[#0f1111]">
            {p.name}
          </span>
        </div>
        <div className="mt-0.5 truncate text-[12px] text-[#565959]">
          {p.brand} · {p.unit}
        </div>
        {item.why && (
          <div className="mt-1.5 line-clamp-2 text-[12px] italic text-[#565959]">
            “{item.why}”
          </div>
        )}
      </div>
      <div className="shrink-0 text-right">
        <div className="text-[14px] font-extrabold text-[#0f1111]">
          ₹{formatRupees(lineTotal)}
        </div>
        {savings > 0 && (
          <div className="text-[11px] font-bold text-[#067d62]">
            save ₹{formatRupees(savings)}
          </div>
        )}
      </div>
    </div>
  );
}

function DroppedSection({ dropped }: { dropped: AiDropped[] }) {
  return (
    <div className="mt-4 rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="mb-1.5 text-[13px] font-extrabold text-amber-900">
        Couldn't find a good match for {dropped.length} item
        {dropped.length > 1 ? "s" : ""}
      </div>
      <ul className="flex flex-col gap-1 text-[12.5px] text-amber-900">
        {dropped.map((d, i) => (
          <li key={`${d.query}-${i}`} className="flex gap-1.5">
            <span className="font-bold">{d.query}</span>
            <span className="text-amber-800/80">— {d.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
