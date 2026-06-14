import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MinusIcon, PlusIcon } from "@/components/ui/Icons";
import { useCart } from "@/features/cart/useCart";
import { useZone } from "@/features/zone/useZone";
import { useVibe } from "@/features/vibe/useVibe";
import { useAsync } from "@/hooks/useAsync";
import {
  aiApi,
  type AiCart,
  type AiCartItem,
  type BackendBudgetTier,
  type QuickCartResult,
} from "@/api/ai.api";
import { useAiPanel } from "./useAiPanel";

type BudgetTier = 0 | 1 | 2;

const BUDGET_TIERS = [
  { id: 0, label: "Essentials",      backend: "Essentials" as const, hint: "Lean & affordable" },
  { id: 1, label: "Standard Mix",    backend: "Standard"   as const, hint: "Balanced picks" },
  { id: 2, label: "Premium Picks",   backend: "Premium"    as const, hint: "Top shelf" },
] as const;

const DEBOUNCE_MS = 450;
const TIER_TAGLINE: Record<BackendBudgetTier, string> = {
  Essentials: "Lean cart at the best prices",
  Standard:   "Balanced quality and value",
  Premium:    "Top-rated picks across the board",
};

function formatRupees(n: number) {
  return n.toLocaleString("en-IN");
}

export function QuickMode() {
  const [intent, setIntent] = useState("");
  const [groupSize, setGroupSize] = useState(2);
  const [tier, setTier] = useState<BudgetTier>(1);

  // Debounce intent so every keystroke doesn't fire a Bedrock call.
  const [debouncedIntent, setDebouncedIntent] = useState(intent);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedIntent(intent.trim()), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [intent]);

  const { zone } = useZone();
  const { setVibe } = useVibe();

  const backendTier = BUDGET_TIERS[tier]!.backend;
  const canQuery = debouncedIntent.length > 2 && !!zone;

  const { data, error, loading } = useAsync<QuickCartResult>(
    async () => {
      if (!canQuery) {
        // Throw a sentinel so useAsync clears its data without flagging an error UI.
        throw new SkipQuery();
      }
      return aiApi.quickCart({
        intent: debouncedIntent,
        groupSize,
        budgetTier: backendTier,
        zoneCode: zone!.code,
      });
    },
    {
      deps: [debouncedIntent, groupSize, backendTier, zone?.code],
      immediate: true,
      onSuccess: (res) => setVibe(res.vibe_category),
    },
  );

  const carts = data?.carts ?? [];
  const showSkeleton = canQuery && loading;
  const realError = error && error.message !== SKIP_QUERY_MESSAGE ? error : null;

  return (
    <div className="space-y-5">
      <IntentField value={intent} onChange={setIntent} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <GroupSizeStepper value={groupSize} onChange={setGroupSize} />
        <BudgetSlider value={tier} onChange={setTier} />
      </div>

      <ResultsArea
        carts={carts}
        recommendedTier={backendTier}
        intent={debouncedIntent}
        groupSize={groupSize}
        loading={showSkeleton}
        error={realError ? realError.message : null}
        canQuery={canQuery}
      />
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
  recommendedTier,
  intent,
  groupSize,
  loading,
  error,
  canQuery,
}: {
  carts: AiCart[];
  recommendedTier: BackendBudgetTier;
  intent: string;
  groupSize: number;
  loading: boolean;
  error: string | null;
  canQuery: boolean;
}) {
  // Re-roll key — any input change animates the whole list out and the new one in.
  const rollKey = `${intent}|${groupSize}|${carts.length}|${error ?? ""}|${loading ? "L" : "R"}`;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-white">
          {!canQuery ? "Tell me what you need" : loading ? "Generating carts…" : carts.length ? "Suggested carts" : "No carts to show"}
        </h3>
        <span className="text-xs text-slate-500">
          {carts.length > 0 && `${carts.length} option${carts.length === 1 ? "" : "s"}`}
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
          {!canQuery && <EmptyHint />}
          {canQuery && loading && <SkeletonGrid />}
          {canQuery && !loading && error && <ErrorCard message={error} />}
          {canQuery && !loading && !error && carts.length === 0 && (
            <ErrorCard message="No carts could be generated for that intent in this zone." />
          )}
          {canQuery && !loading && !error &&
            carts.map((c, i) => (
              <CartOptionCard
                key={c.tier}
                cart={c}
                isRecommended={c.tier === recommendedTier}
                delay={i * 0.05}
              />
            ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function EmptyHint() {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-slate-400">
      Type at least 3 characters and we&rsquo;ll build a cart for you.
    </div>
  );
}

function SkeletonGrid() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-48 animate-pulse rounded bg-white/5" />
            </div>
            <div className="h-5 w-16 animate-pulse rounded bg-white/10" />
          </div>
          <div className="mt-3 flex gap-1.5">
            {[0, 1, 2, 3, 4].map((j) => (
              <div key={j} className="h-10 w-10 animate-pulse rounded-lg bg-white/10" />
            ))}
          </div>
          <div className="mt-4 h-8 w-full animate-pulse rounded-full bg-white/10" />
        </div>
      ))}
    </>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">
      {message}
    </div>
  );
}

function CartOptionCard({
  cart,
  isRecommended,
  delay,
}: {
  cart: AiCart;
  isRecommended: boolean;
  delay: number;
}) {
  const { add } = useCart();
  const { close } = useAiPanel();
  const [added, setAdded] = useState(false);

  const totalMrp = useMemo(
    () => cart.items.reduce((n, it) => n + it.product.mrp * it.quantity, 0),
    [cart.items],
  );
  const savings = Math.max(0, totalMrp - cart.total);
  const totalUnits = cart.items.reduce((n, it) => n + it.quantity, 0);
  const tagline = TIER_TAGLINE[cart.tier];

  const handleAdd = () => {
    for (const it of cart.items) {
      const p = it.product;
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
        it.quantity,
      );
    }
    setAdded(true);
    setTimeout(() => close(), 700);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25, ease: "easeOut" }}
      className={
        "group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4 backdrop-blur-xl " +
        (isRecommended ? "border-white/30" : "border-white/10")
      }
      style={
        isRecommended
          ? { boxShadow: "0 12px 40px -12px var(--color-vibe-glow)" }
          : undefined
      }
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
          <div className="flex items-center gap-2">
            <div className="text-base font-semibold text-white">{cart.title}</div>
            {isRecommended && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, var(--color-vibe-accent), var(--color-vibe-accent-2))",
                }}
              >
                Picked
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400">{tagline}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-white">
            ₹{formatRupees(cart.total)}
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
        {cart.items.slice(0, 6).map((it) => (
          <ThumbnailWithQty key={it.product.id} item={it} />
        ))}
        {cart.items.length > 6 && (
          <div className="flex h-10 min-w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-2 text-xs font-semibold text-slate-300">
            +{cart.items.length - 6}
          </div>
        )}
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-slate-400">
          {cart.items.length} item{cart.items.length === 1 ? "" : "s"}
          {totalUnits !== cart.items.length && ` · ${totalUnits} units`}
          {" · ~10 min"}
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

function ThumbnailWithQty({ item }: { item: AiCartItem }) {
  return (
    <div
      title={`${item.product.name} × ${item.quantity}`}
      className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-slate-900"
    >
      <img
        src={item.product.imageUrl}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover"
      />
      {item.quantity > 1 && (
        <span className="absolute -right-1 -top-1 rounded-full bg-slate-900 px-1.5 text-[10px] font-bold text-white ring-1 ring-white/30">
          ×{item.quantity}
        </span>
      )}
    </div>
  );
}

/* ───────── helpers ───────── */

const SKIP_QUERY_MESSAGE = "__skip_query__";
class SkipQuery extends Error {
  constructor() {
    super(SKIP_QUERY_MESSAGE);
  }
}
