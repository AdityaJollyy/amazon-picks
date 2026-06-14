import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/features/cart/useCart";
import { ApiError } from "@/lib/ApiError";
import { restockApi, type RestockItem } from "@/api/restock.api";

/**
 * "Ready to restock" panel.
 *
 * Optimistic actions: each button removes the row immediately, then calls the
 * backend. On failure we reinsert the row and surface the error inline.
 */

function formatRupees(n: number) {
  return n.toLocaleString("en-IN");
}

const SNOOZE_OPTIONS = [3, 7, 14];

export function RestockSection() {
  const [items, setItems] = useState<RestockItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await restockApi.list();
      setItems(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Optimistic removal helper. Returns a rollback fn to call on failure.
  const optimisticRemove = (productId: string): (() => void) => {
    setActionError(null);
    let removed: { item: RestockItem; index: number } | null = null;
    setItems((prev) => {
      if (!prev) return prev;
      const idx = prev.findIndex((i) => i.productId === productId);
      if (idx < 0) return prev;
      removed = { item: prev[idx]!, index: idx };
      return prev.filter((_, i) => i !== idx);
    });
    return () => {
      if (!removed) return;
      const { item, index } = removed;
      setItems((prev) => {
        if (!prev) return [item];
        const copy = [...prev];
        copy.splice(Math.min(index, copy.length), 0, item);
        return copy;
      });
    };
  };

  // Don't render anything if there's nothing to restock and no error to show.
  if (!loading && !error && items && items.length === 0) {
    return null;
  }

  return (
    <section className="rounded-md bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Ready to restock?</h2>
          <p className="text-xs text-slate-500">
            Items you usually buy regularly — based on your order history.
          </p>
        </div>
        {items && items.length > 0 && (
          <span className="text-xs text-slate-500">
            {items.length} item{items.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {actionError && (
        <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {actionError}
        </div>
      )}

      {loading && <RestockSkeleton />}

      {error && !loading && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Couldn&rsquo;t load restock suggestions: {error}
        </div>
      )}

      {!loading && !error && items && items.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <RestockCard
                key={item.productId}
                item={item}
                onActionStart={() => optimisticRemove(item.productId)}
                onActionError={(rollback, message) => {
                  rollback();
                  setActionError(message);
                }}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}

function RestockCard({
  item,
  onActionStart,
  onActionError,
}: {
  item: RestockItem;
  onActionStart: () => () => void;
  onActionError: (rollback: () => void, message: string) => void;
}) {
  const { add, openDrawer } = useCart();
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const overdueLabel = formatOverdue(item.daysOverdue);
  const isUrgent = item.daysOverdue >= 3;

  const guard = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    const rollback = onActionStart();
    try {
      await fn();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Action failed";
      onActionError(rollback, message);
    } finally {
      setBusy(false);
    }
  };

  const handleReorder = () =>
    guard(async () => {
      const result = await restockApi.reorder(item.productId);
      const p = result.product;
      // Add the item to the storefront cart using the suggested quantity. The
      // server gave us zone-specific stock + ETA when available; fall back to
      // the list values if not.
      add(
        {
          productId: item.productId,
          name: p?.name ?? item.product.name,
          brand: p?.brand ?? item.product.brand,
          unit: p?.unit ?? item.product.unit,
          imageUrl: p?.imageUrl ?? item.product.imageUrl,
          price: p?.price ?? item.product.price,
          mrp: p?.mrp ?? item.product.mrp,
          etaMinutes: p?.etaMinutes ?? 10,
        },
        result.suggestedQuantity,
      );
      openDrawer();
    });

  const handleSkip = () =>
    guard(async () => {
      await restockApi.skip(item.productId);
    });

  const handleSnooze = (days: number) => {
    setSnoozeOpen(false);
    void guard(async () => {
      await restockApi.snooze(item.productId, days);
    });
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
      transition={{ type: "spring", damping: 26, stiffness: 280 }}
      className="flex flex-col rounded-md border border-slate-200 bg-white p-3"
    >
      <div className="flex gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
          <img
            src={item.product.imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            {item.product.brand}
          </div>
          <div className="line-clamp-2 text-sm font-semibold text-slate-800">
            {item.product.name}
          </div>
          <div className="mt-0.5 text-xs text-slate-500">{item.product.unit}</div>
          <div className="mt-1.5 flex items-center gap-2 text-[11px]">
            <span
              className={
                "rounded-full px-2 py-0.5 font-semibold " +
                (isUrgent
                  ? "bg-amber-100 text-amber-800"
                  : "bg-sky-100 text-sky-800")
              }
            >
              {overdueLabel}
            </span>
            <span className="text-slate-500">
              every ~{Math.round(item.intervalDays)}d
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-slate-900 tabular-nums">
            ₹{formatRupees(item.product.price)}
          </div>
          <div className="text-[10px] text-slate-500">
            ×{item.suggestedQuantity} suggested
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={handleReorder}
          disabled={busy}
          className="flex-1 rounded-full bg-[var(--color-amazon-yellow)] px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-[var(--color-amazon-yellow-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reorder
        </button>
        <button
          type="button"
          onClick={handleSkip}
          disabled={busy}
          className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Skip
        </button>

        {/* Snooze with inline picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setSnoozeOpen((v) => !v)}
            disabled={busy}
            aria-haspopup="menu"
            aria-expanded={snoozeOpen}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Snooze
          </button>
          {snoozeOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-10 mt-1 flex flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg"
            >
              {SNOOZE_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  role="menuitem"
                  onClick={() => handleSnooze(d)}
                  className="whitespace-nowrap px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50"
                >
                  {d} day{d === 1 ? "" : "s"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.li>
  );
}

function RestockSkeleton() {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="flex animate-pulse gap-3 rounded-md border border-slate-200 bg-white p-3"
        >
          <div className="h-16 w-16 shrink-0 rounded-md bg-slate-100" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-1/2 rounded bg-slate-100" />
            <div className="h-3 w-3/4 rounded bg-slate-100" />
            <div className="h-3 w-1/3 rounded bg-slate-100" />
            <div className="mt-3 flex gap-1.5">
              <div className="h-6 flex-1 rounded-full bg-slate-100" />
              <div className="h-6 w-12 rounded-full bg-slate-100" />
              <div className="h-6 w-14 rounded-full bg-slate-100" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function formatOverdue(daysOverdue: number): string {
  if (daysOverdue < 0.5) return "Due today";
  if (daysOverdue < 1.5) return "1 day overdue";
  return `${Math.round(daysOverdue)} days overdue`;
}
