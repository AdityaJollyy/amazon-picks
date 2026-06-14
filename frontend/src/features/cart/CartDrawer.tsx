import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useCart } from "./useCart";
import { useZone } from "@/features/zone/useZone";
import { ApiError } from "@/lib/ApiError";
import { ordersApi, type Order } from "@/api/orders.api";
import { CloseIcon, MinusIcon, PlusIcon, TrashIcon } from "@/components/ui/Icons";
import type { CartItem } from "./types";

function formatRupees(n: number) {
  return n.toLocaleString("en-IN");
}

function CartLine({ item }: { item: CartItem }) {
  const { setQty, remove } = useCart();
  const lineTotal = item.price * item.qty;

  return (
    <li className="flex gap-3 border-b border-slate-200 px-4 py-3">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-slate-50">
        <img
          src={item.imageUrl}
          alt={item.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
          {item.brand}
        </div>
        <div className="line-clamp-2 text-sm font-medium leading-tight text-slate-800">
          {item.name}
        </div>
        <div className="text-xs text-slate-500">{item.unit}</div>

        <div className="mt-2 flex items-center justify-between">
          {/* Stepper */}
          <div className="inline-flex items-center overflow-hidden rounded-full border border-slate-300">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQty(item.productId, item.qty - 1)}
              className="flex h-7 w-7 items-center justify-center text-slate-700 hover:bg-slate-100"
            >
              {item.qty === 1 ? (
                <TrashIcon className="h-3.5 w-3.5" />
              ) : (
                <MinusIcon className="h-3.5 w-3.5" />
              )}
            </button>
            <span className="min-w-[28px] px-2 text-center text-sm font-semibold tabular-nums">
              {item.qty}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQty(item.productId, item.qty + 1)}
              className="flex h-7 w-7 items-center justify-center text-slate-700 hover:bg-slate-100"
            >
              <PlusIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Line total */}
          <div className="text-right">
            <div className="text-sm font-bold text-slate-900">
              ₹{formatRupees(lineTotal)}
            </div>
            {item.mrp > item.price && (
              <div className="text-xs text-slate-500 line-through">
                ₹{formatRupees(item.mrp * item.qty)}
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => remove(item.productId)}
        aria-label="Remove from cart"
        className="self-start text-slate-400 hover:text-[var(--color-amazon-price)]"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </li>
  );
}

export function CartDrawer() {
  const { items, count, subtotal, totalSavings, isDrawerOpen, closeDrawer, clear } = useCart();
  const { zone } = useZone();

  type Phase =
    | { kind: "cart" }
    | { kind: "placing" }
    | { kind: "error"; message: string }
    | { kind: "success"; order: Order };

  const [phase, setPhase] = useState<Phase>({ kind: "cart" });

  // Reset to the cart view whenever the drawer is reopened.
  useEffect(() => {
    if (isDrawerOpen) setPhase({ kind: "cart" });
  }, [isDrawerOpen]);

  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    if (!isDrawerOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isDrawerOpen, closeDrawer]);

  const handleCheckout = async () => {
    if (!items.length || !zone) return;
    setPhase({ kind: "placing" });
    try {
      const order = await ordersApi.create({
        zoneCode: zone.code,
        items: items.map((it) => ({ productId: it.productId, quantity: it.qty })),
      });
      // Cart cleared AFTER the request succeeds — failed orders don't lose state.
      clear();
      setPhase({ kind: "success", order });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Checkout failed";
      setPhase({ kind: "error", message });
    }
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={phase.kind === "placing" ? undefined : closeDrawer}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px]"
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.aside
            key="cart-panel"
            role="dialog"
            aria-label="Shopping cart"
            aria-modal="true"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl"
          >
            {/* Header */}
            <header className="flex items-center justify-between border-b border-slate-200 bg-[var(--color-amazon-navy)] px-4 py-3 text-white">
              <h2 className="text-lg font-bold">
                {phase.kind === "success" ? (
                  "Order placed"
                ) : (
                  <>
                    Your cart{" "}
                    <span className="ml-1 text-sm font-normal text-white/70">
                      ({count} item{count === 1 ? "" : "s"})
                    </span>
                  </>
                )}
              </h2>
              <button
                type="button"
                aria-label="Close cart"
                onClick={closeDrawer}
                disabled={phase.kind === "placing"}
                className="rounded-sm p-1 text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-40"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </header>

            {/* Body */}
            {phase.kind === "success" ? (
              <SuccessView order={phase.order} onClose={closeDrawer} />
            ) : items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
                <div className="text-5xl">🛒</div>
                <div className="text-base font-semibold text-slate-800">
                  Your cart is empty
                </div>
                <p className="max-w-[260px] text-sm text-slate-500">
                  Add a few items from the storefront, or describe what you need on
                  Quick Mode.
                </p>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="mt-3 rounded-full bg-[var(--color-amazon-yellow)] px-4 py-1.5 text-sm font-semibold text-slate-900 hover:bg-[var(--color-amazon-yellow-hover)]"
                >
                  Continue shopping
                </button>
              </div>
            ) : (
              <>
                <ul className="flex-1 overflow-y-auto">
                  {items.map((item) => (
                    <CartLine key={item.productId} item={item} />
                  ))}
                </ul>

                {/* Footer */}
                <footer className="border-t border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-900">
                      ₹{formatRupees(subtotal)}
                    </span>
                  </div>
                  {totalSavings > 0 && (
                    <div className="mt-0.5 flex items-center justify-between text-xs text-emerald-700">
                      <span>You save</span>
                      <span className="font-semibold">₹{formatRupees(totalSavings)}</span>
                    </div>
                  )}
                  {phase.kind === "error" && (
                    <div className="mt-2 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                      {phase.message}
                    </div>
                  )}
                  {!zone && (
                    <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      Pick a delivery zone to checkout.
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={phase.kind === "placing" || !zone}
                    className="mt-3 w-full rounded-full bg-[var(--color-amazon-yellow)] py-2.5 text-sm font-bold text-slate-900 hover:bg-[var(--color-amazon-yellow-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {phase.kind === "placing" ? "Placing order…" : "Proceed to checkout"}
                  </button>
                  <p className="mt-2 text-center text-[11px] text-slate-500">
                    Delivery in ~10 min · Free over ₹199
                  </p>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function SuccessView({ order, onClose }: { order: Order; onClose: () => void }) {
  const totalUnits = order.items.reduce((n, it) => n + it.quantity, 0);
  const created = new Date(order.createdAt);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xl text-white">
            ✓
          </div>
          <div>
            <div className="text-base font-semibold text-slate-900">
              Thanks — your order is on the way
            </div>
            <div className="text-xs text-slate-500">
              Order #{order.id.slice(-6).toUpperCase()} · {created.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          Delivering to <span className="font-semibold">{order.zone.name}</span> ({order.zone.code}) · ETA ~10 min
        </div>

        <ul className="space-y-2">
          {order.items.map((it) => (
            <li key={it.id} className="flex items-center justify-between text-sm">
              <div className="min-w-0 pr-3">
                <div className="truncate font-medium text-slate-800">{it.name}</div>
                <div className="text-[11px] text-slate-500">
                  {it.quantity} × ₹{formatRupees(it.price)}
                </div>
              </div>
              <div className="font-semibold tabular-nums text-slate-900">
                ₹{formatRupees(it.price * it.quantity)}
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-auto rounded-lg bg-slate-100 px-3 py-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">
              Total · {totalUnits} unit{totalUnits === 1 ? "" : "s"}
            </span>
            <span className="text-base font-bold text-slate-900 tabular-nums">
              ₹{formatRupees(order.total)}
            </span>
          </div>
        </div>
      </div>

      <footer className="grid grid-cols-2 gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
        <a
          href="/orders"
          className="rounded-full border border-slate-300 bg-white py-2 text-center text-sm font-semibold text-slate-800 hover:bg-slate-100"
        >
          View all orders
        </a>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-[var(--color-amazon-yellow)] py-2 text-sm font-bold text-slate-900 hover:bg-[var(--color-amazon-yellow-hover)]"
        >
          Continue shopping
        </button>
      </footer>
    </div>
  );
}
