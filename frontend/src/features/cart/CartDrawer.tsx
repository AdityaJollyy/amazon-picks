import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useCart } from "./useCart";
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
  const { items, count, subtotal, totalSavings, isDrawerOpen, closeDrawer } = useCart();

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
            onClick={closeDrawer}
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
                Your cart{" "}
                <span className="ml-1 text-sm font-normal text-white/70">
                  ({count} item{count === 1 ? "" : "s"})
                </span>
              </h2>
              <button
                type="button"
                aria-label="Close cart"
                onClick={closeDrawer}
                className="rounded-sm p-1 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </header>

            {/* Body */}
            {items.length === 0 ? (
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
                  <button
                    type="button"
                    onClick={() => {
                      // Wired up later — for now no-op.
                      console.log("checkout", items);
                    }}
                    className="mt-3 w-full rounded-full bg-[var(--color-amazon-yellow)] py-2.5 text-sm font-bold text-slate-900 hover:bg-[var(--color-amazon-yellow-hover)]"
                  >
                    Proceed to checkout
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
