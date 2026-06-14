import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAiPanel } from "./useAiPanel";
import { useZone } from "@/features/zone/useZone";
import { useCart } from "@/features/cart/useCart";
import { useToast } from "@/features/toast/useToast";
import {
  aiApi,
  type AiCartItem,
  type AiDropped,
  type BuildResult,
} from "@/api/ai.api";
import { ApiError } from "@/lib/ApiError";
import { getVibeTheme } from "./vibeTheme";

type QuickStep = "input" | "building" | "results";

const QUICK_CHIPS = [
  { label: "🎬 Movie night for 4", text: "movie night for 4 people, snacks and drinks" },
  { label: "🍳 Breakfast for 2", text: "breakfast essentials for 2" },
  { label: "🎉 Birthday party at home", text: "birthday party for 8 people, cake and snacks" },
  { label: "💧 Fever and headache", text: "i have fever and headache, need medicine" },
];

// Single combined progress strip — the user only sees one spinner now.
const BUILDING_STAGES = [
  "Reading your request",
  "Searching the catalog in your zone",
  "Picking the best products",
];

const MAX_QTY_PER_LINE = 12;

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

  const [buildStage, setBuildStage] = useState(0);

  const [result, setResult] = useState<BuildResult | null>(null);
  // Editable working copy of cart items — quantity tweaks and removals live
  // here; the original `result.cart` stays as-AI-returned for reference.
  const [editedItems, setEditedItems] = useState<AiCartItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep("input");
    setError(null);
    setBuildStage(0);
    setResult(null);
    setEditedItems([]);
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

  const runBuild = async () => {
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
    setStep("building");
    setBuildStage(0);
    clearStageTimers();
    [900, 2000].forEach((ms, i) => {
      const id = setTimeout(() => setBuildStage(i + 1), ms);
      stageTimers.current.push(id);
    });

    const minDelay = new Promise((r) => setTimeout(r, 2600));
    try {
      const [res] = await Promise.all([
        aiApi.quickCart({ intent: trimmed, groupSize, zoneCode: zone.code }),
        minDelay,
      ]);
      setResult(res);
      setEditedItems(res.cart.items);
      setBuildStage(BUILDING_STAGES.length);
      setStep("results");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong";
      setError(message);
      setStep("input");
    } finally {
      clearStageTimers();
    }
  };

  const updateQty = (productId: string, qty: number) => {
    setEditedItems((curr) =>
      curr.map((it) => {
        if (it.product.id !== productId) return it;
        const cap = Math.min(MAX_QTY_PER_LINE, it.product.stock);
        return { ...it, quantity: Math.max(1, Math.min(cap, Math.round(qty))) };
      })
    );
  };

  const removeItem = (productId: string) => {
    setEditedItems((curr) => curr.filter((it) => it.product.id !== productId));
  };

  const checkout = () => {
    if (editedItems.length === 0) {
      flash("Add at least one item before checkout");
      return;
    }
    editedItems.forEach((item) => {
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
    const totalCount = editedItems.reduce((n, it) => n + it.quantity, 0);
    flash(`Added ${totalCount} items to cart`);
    close();
    navigate("/checkout");
  };

  const resultVibe = result?.vibe_category;
  const theme = useMemo(() => getVibeTheme(resultVibe), [resultVibe]);

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
                  Tell us what you need. We'll have a cart ready in seconds.
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
                onSubmit={runBuild}
                zoneLabel={
                  zone
                    ? `${zone.name} · ${zone.pincode}`
                    : "Connaught Place · 110001"
                }
              />
            )}

            {step === "building" && (
              <ThinkingStep
                title="Building your cart…"
                subtitle={`Reading "${intent}" and shopping your zone for the best matches.`}
                stages={BUILDING_STAGES}
                stage={buildStage}
              />
            )}

            {step === "results" && result && (
              <ResultsStep
                result={result}
                items={editedItems}
                onQty={updateQty}
                onRemove={removeItem}
                themeAccent={theme.accent}
                themeSoft={theme.soft}
                themeGrad={theme.grad}
                themeName={theme.name}
                themeEmoji={theme.emoji}
                onBack={() => setStep("input")}
                onCheckout={checkout}
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
        Build my cart
      </button>

      <div className="mt-[18px] flex justify-center gap-[18px] text-[12px] text-[#8a8f94]">
        <span>① You ask</span>
        <span>② AI shops</span>
        <span>③ Adjust &amp; checkout</span>
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

/* ───────────── results ───────────── */

function ResultsStep({
  result,
  items,
  onQty,
  onRemove,
  themeAccent,
  themeSoft,
  themeGrad,
  themeName,
  themeEmoji,
  onBack,
  onCheckout,
}: {
  result: BuildResult;
  items: AiCartItem[];
  onQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  themeAccent: string;
  themeSoft: string;
  themeGrad: string;
  themeName: string;
  themeEmoji: string;
  onBack: () => void;
  onCheckout: () => void;
}) {
  const { dropped, intent_summary } = result;

  const total = useMemo(
    () => items.reduce((sum, it) => sum + it.product.price * it.quantity, 0),
    [items]
  );
  const itemCount = useMemo(
    () => items.reduce((n, it) => n + it.quantity, 0),
    [items]
  );
  const eta = useMemo(() => {
    if (items.length === 0) return 10;
    return Math.max(...items.map((it) => it.product.etaMinutes));
  }, [items]);

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
            {itemCount} item{itemCount === 1 ? "" : "s"} · ~{eta} min · adjust below
          </span>
        </div>

        {items.length === 0 ? (
          <div className="mt-2.5 rounded-[12px] border border-dashed border-[#d5d9d9] bg-[#fafafa] px-4 py-6 text-center text-[13px] text-[#565959]">
            Cart is empty. Go back and try a different request.
          </div>
        ) : (
          <div className="mt-2.5 flex flex-col divide-y divide-[#f0f0f0] overflow-hidden rounded-[12px] border border-[#ececec]">
            {items.map((it) => (
              <CartLine
                key={it.product.id}
                item={it}
                accent={themeAccent}
                soft={themeSoft}
                onQty={(q) => onQty(it.product.id, q)}
                onRemove={() => onRemove(it.product.id)}
              />
            ))}
          </div>
        )}

        {dropped.length > 0 && <DroppedSection dropped={dropped} />}
      </div>

      <div className="px-[30px] pb-[22px] pt-3">
        <div className="mb-3 flex items-baseline justify-between rounded-[12px] bg-[#fafafa] px-4 py-3">
          <span className="text-[13px] text-[#565959]">Total</span>
          <span className="text-[24px] font-extrabold text-[#0f1111]">
            ₹{formatRupees(total)}
          </span>
        </div>
        <button
          type="button"
          onClick={onCheckout}
          disabled={items.length === 0}
          className="flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-[26px] border-none text-[16px] font-extrabold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: themeAccent, fontFamily: "inherit" }}
        >
          Add all &amp; checkout · ₹{formatRupees(total)}
        </button>
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer border-none bg-transparent text-[13px] font-bold text-[#007185]"
          >
            ← Try a different request
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
  onQty,
  onRemove,
}: {
  item: AiCartItem;
  accent: string;
  soft: string;
  onQty: (q: number) => void;
  onRemove: () => void;
}) {
  const p = item.product;
  const lineTotal = p.price * item.quantity;
  const savings = (p.mrp - p.price) * item.quantity;
  const cap = Math.min(MAX_QTY_PER_LINE, p.stock);

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
        <div className="mt-2 flex items-center gap-2">
          <div className="inline-flex items-center overflow-hidden rounded-[8px] border border-[#d5d9d9]">
            <button
              type="button"
              onClick={() => onQty(item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="h-7 w-7 cursor-pointer border-none bg-[#f7f7f7] text-[14px] font-bold disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={`Decrease quantity of ${p.name}`}
            >
              −
            </button>
            <span className="w-7 text-center text-[13px] font-extrabold tabular-nums">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onQty(item.quantity + 1)}
              disabled={item.quantity >= cap}
              className="h-7 w-7 cursor-pointer border-none bg-[#f7f7f7] text-[14px] font-bold disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={`Increase quantity of ${p.name}`}
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="flex h-7 cursor-pointer items-center gap-1 rounded-full border border-[#e3e3e3] bg-white px-2.5 text-[12px] font-bold text-[#8a8f94] transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
            aria-label={`Remove ${p.name}`}
          >
            ✕ remove
          </button>
        </div>
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
