import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MinusIcon, PlusIcon } from "@/components/ui/Icons";
import { useCart } from "@/features/cart/useCart";
import { useAiPanel } from "./useAiPanel";
import {
  BUDGET_TIERS,
  generateQuickCarts,
  type BudgetTier,
  type CartOption,
} from "./quickModeUtils";

function formatRupees(n: number) {
  return n.toLocaleString("en-IN");
}

export function QuickMode() {
  const [intent, setIntent] = useState("");
  const [groupSize, setGroupSize] = useState(2);
  const [tier, setTier] = useState<BudgetTier>(1);

  const carts = useMemo(
    () => generateQuickCarts(intent, groupSize, tier),
    [intent, groupSize, tier],
  );

  return (
    <div className="space-y-5">
      <IntentField value={intent} onChange={setIntent} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <GroupSizeStepper value={groupSize} onChange={setGroupSize} />
        <BudgetSlider value={tier} onChange={setTier} />
      </div>

      <ResultsArea carts={carts} intent={intent} groupSize={groupSize} tier={tier} />
    </div>
  );
}

/* ───────── inputs ───────── */

function IntentField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span
        className="mb-1.5 block text-xs font-medium uppercase tracking-[0.16em]"
        style={{ color: "var(--color-vibe-accent-2)" }}
      >
        What&rsquo;s the occasion?
      </span>
      <div
        className="relative rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur transition focus-within:bg-white/[0.06]"
        style={{
          // Border lights up to the vibe accent on focus via inner shadow.
          boxShadow: "inset 0 0 0 0 transparent",
        }}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. camping trip, hosting 8 tonight, kid's fever"
          className="w-full bg-transparent px-4 py-3 text-[15px] text-white placeholder-slate-500 focus:outline-none focus:[box-shadow:inset_0_0_0_1px_var(--color-vibe-accent)]"
        />
      </div>
    </label>
  );
}

function GroupSizeStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur">
      <div className="text-xs font-medium uppercase tracking-[0.16em]" style={{ color: "var(--color-vibe-accent-2)" }}>
        Group size
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-2xl font-semibold tabular-nums text-white">
          {value}
          <span className="ml-1 text-sm font-normal text-slate-400">
            {value === 1 ? "person" : "people"}
          </span>
        </span>
        <div className="inline-flex items-center overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
          <button
            type="button"
            onClick={() => onChange(Math.max(1, value - 1))}
            aria-label="Decrease group size"
            disabled={value <= 1}
            className="flex h-8 w-8 items-center justify-center text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <MinusIcon className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[32px] px-1 text-center text-sm font-semibold text-white tabular-nums">
            {value}
          </span>
          <button
            type="button"
            onClick={() => onChange(Math.min(50, value + 1))}
            aria-label="Increase group size"
            className="flex h-8 w-8 items-center justify-center text-slate-200 transition hover:bg-white/10"
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function BudgetSlider({
  value,
  onChange,
}: {
  value: BudgetTier;
  onChange: (v: BudgetTier) => void;
}) {
  const active = BUDGET_TIERS[value]!;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.16em]" style={{ color: "var(--color-vibe-accent-2)" }}>
          Budget
        </span>
        <span className="text-xs text-slate-400">{active.hint}</span>
      </div>

      <div className="mt-2 text-base font-semibold text-white">{active.label}</div>

      <div className="relative mt-3 px-1">
        {/* Track + filled portion */}
        <div className="relative h-1.5 rounded-full bg-white/10">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              backgroundImage:
                "linear-gradient(90deg, var(--color-vibe-accent), var(--color-vibe-accent-2))",
            }}
            initial={false}
            animate={{ width: `${(value / 2) * 100}%` }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
          />
        </div>

        {/* Stops */}
        <div className="absolute inset-x-1 top-1/2 flex -translate-y-1/2 justify-between">
          {BUDGET_TIERS.map((t) => {
            const isActive = t.id === value;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange(t.id as BudgetTier)}
                aria-label={`Set budget to ${t.label}`}
                aria-pressed={isActive}
                className="group relative -mx-2 flex h-6 w-6 items-center justify-center"
              >
                <span
                  className={
                    "block h-3 w-3 rounded-full ring-2 transition " +
                    (isActive
                      ? "bg-white"
                      : "bg-slate-600 ring-white/20 group-hover:bg-slate-400")
                  }
                  style={
                    isActive
                      ? {
                          // @ts-expect-error -- valid CSS, TS just doesn't know about ring color via var
                          "--tw-ring-color": "var(--color-vibe-accent)",
                          boxShadow: "0 0 12px var(--color-vibe-glow)",
                        }
                      : undefined
                  }
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex justify-between text-[10px] font-medium uppercase tracking-wider text-slate-500">
        {BUDGET_TIERS.map((t) => (
          <span
            key={t.id}
            className={t.id === value ? "text-white" : ""}
          >
            {t.label.split(" ")[0]}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ───────── results ───────── */

function ResultsArea({
  carts,
  intent,
  groupSize,
  tier,
}: {
  carts: CartOption[];
  intent: string;
  groupSize: number;
  tier: BudgetTier;
}) {
  // Re-roll key — any input change animates the whole list out and the new one in.
  const rollKey = `${intent}|${groupSize}|${tier}`;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-white">
          {intent.trim() ? "Suggested carts" : "Starter ideas"}
        </h3>
        <span className="text-xs text-slate-500">
          {carts.length} option{carts.length === 1 ? "" : "s"}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={rollKey}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="grid grid-cols-1 gap-3"
        >
          {carts.map((c, i) => (
            <CartOptionCard key={c.id} option={c} delay={i * 0.05} />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function CartOptionCard({ option, delay }: { option: CartOption; delay: number }) {
  const { add } = useCart();
  const { close } = useAiPanel();
  const [added, setAdded] = useState(false);
  const savings = Math.max(0, option.totalMrp - option.total);

  const handleAdd = () => {
    for (const p of option.items) {
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
    setAdded(true);
    setTimeout(() => close(), 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25, ease: "easeOut" }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4 backdrop-blur-xl"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition group-hover:opacity-100"
        style={{
          backgroundImage:
            "linear-gradient(135deg, var(--color-vibe-accent-soft), transparent 60%)",
        }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-semibold text-white">{option.title}</div>
          <div className="text-xs text-slate-400">{option.tagline}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-white">
            ₹{formatRupees(option.total)}
          </div>
          {savings > 0 && (
            <div className="text-[11px] font-medium text-emerald-400">
              save ₹{formatRupees(savings)}
            </div>
          )}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="relative mt-3 flex items-center gap-1.5">
        {option.items.slice(0, 6).map((p) => (
          <div
            key={p.id}
            title={p.name}
            className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-slate-900"
          >
            <img
              src={p.imageUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        ))}
        {option.items.length > 6 && (
          <div className="flex h-10 min-w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-2 text-xs font-semibold text-slate-300">
            +{option.items.length - 6}
          </div>
        )}
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-slate-400">
          {option.items.length} item{option.items.length === 1 ? "" : "s"} · ~10 min
        </span>
        <button
          type="button"
          onClick={handleAdd}
          disabled={added}
          className={
            "rounded-full px-4 py-1.5 text-sm font-semibold transition " +
            (added ? "bg-emerald-400 text-slate-900" : "text-white hover:brightness-110")
          }
          style={
            added
              ? undefined
              : {
                  backgroundImage:
                    "linear-gradient(90deg, var(--color-vibe-accent), var(--color-vibe-accent-2))",
                  boxShadow: "0 6px 24px -6px var(--color-vibe-glow)",
                }
          }
        >
          {added ? "Added ✓" : "Add to cart"}
        </button>
      </div>
    </motion.div>
  );
}
