import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/features/cart/useCart";
import { useAiPanel } from "@/features/ai/useAiPanel";

function formatRupees(n: number) {
  return n.toLocaleString("en-IN");
}

export function CartPage() {
  const navigate = useNavigate();
  const { items, count, subtotal, totalSavings, setQty, remove } = useCart();
  const { open: openQuick } = useAiPanel();

  const mrpTotal = items.reduce((a, i) => a + i.mrp * i.qty, 0);
  const savingsPct =
    mrpTotal > 0 ? Math.round((totalSavings / mrpTotal) * 100) : 0;
  const eta = items.length
    ? Math.max(...items.map((i) => i.etaMinutes))
    : 15;

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-[1300px] px-[18px] py-[18px]">
        <div className="rounded-xl border border-[#e7e7e7] bg-white p-[60px] text-center">
          <div className="mb-2.5 text-[54px]">🛒</div>
          <div className="mb-1.5 text-[22px] font-extrabold">
            Your Amazon Picks cart is empty
          </div>
          <div className="mb-5 text-[14px] text-[#565959]">
            Browse a category, or let Quick Mode build a cart for you in seconds.
          </div>
          <div className="flex justify-center gap-2.5">
            <Link
              to="/"
              className="inline-flex h-11 cursor-pointer items-center rounded-[24px] border border-[#c89411] px-[22px] text-[14px] font-bold"
              style={{ background: "linear-gradient(#f7dfa5,#f0c14b)" }}
            >
              Shop now
            </Link>
            <button
              type="button"
              onClick={() => openQuick()}
              className="inline-flex h-11 cursor-pointer items-center rounded-[24px] border-none px-[22px] text-[14px] font-extrabold text-[#131921] transition hover:brightness-105"
              style={{
                background: "linear-gradient(95deg,#ff9900,#ff7847)",
                fontFamily: "inherit",
              }}
            >
              ✦ Try Quick Mode
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1300px] px-[18px] py-[18px]">
      <div className="grid items-start gap-[18px] lg:grid-cols-[1fr_320px]">
        <section className="rounded-xl border border-[#e7e7e7] bg-white p-[22px]">
          <div className="mb-1.5 flex items-end justify-between border-b border-[#eee] pb-3.5">
            <h1 className="m-0 text-[26px] font-extrabold">Shopping Cart</h1>
            <span className="text-[13px] text-[#565959]">Price</span>
          </div>
          {items.map((item) => {
            const lineTotal = item.price * item.qty;
            return (
              <div
                key={item.productId}
                className="grid grid-cols-[110px_1fr_auto] items-start gap-4 border-b border-[#f0f0f0] py-[18px]"
              >
                <Link
                  to={`/product/${item.productId}`}
                  className="ap-stripe-sm flex h-[110px] items-center justify-center overflow-hidden rounded-lg bg-[#f7f8f8]"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain p-2"
                    />
                  ) : (
                    <span
                      className="p-1.5 text-center text-[10px] text-[#9aa0a6]"
                      style={{ fontFamily: "'Courier New',monospace" }}
                    >
                      {item.name}
                    </span>
                  )}
                </Link>
                <div>
                  <Link
                    to={`/product/${item.productId}`}
                    className="cursor-pointer text-[17px] font-semibold leading-[1.3] text-[#0f1111] hover:text-[#c45500]"
                  >
                    {item.name}
                  </Link>
                  <div className="mt-0.5 text-[12px] uppercase tracking-[0.04em] text-[#8a8f94]">
                    {item.brand} · {item.unit}
                  </div>
                  <div className="mt-2 text-[13px] font-bold text-[#007600]">
                    In stock · {item.etaMinutes} min delivery
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <div
                      className="flex items-center overflow-hidden rounded-lg border border-[#d5d9d9]"
                      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }}
                    >
                      <button
                        type="button"
                        onClick={() => setQty(item.productId, item.qty - 1)}
                        className="h-8 w-[34px] cursor-pointer border-none bg-[#f0f2f2] text-[17px] font-bold"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-[38px] text-center text-[14px] font-bold">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(item.productId, item.qty + 1)}
                        className="h-8 w-[34px] cursor-pointer border-none bg-[#f0f2f2] text-[17px] font-bold"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(item.productId)}
                      className="cursor-pointer border-none bg-transparent text-[13px] text-[#007185] hover:text-[#c45500] hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="whitespace-nowrap text-[18px] font-bold">
                  ₹{formatRupees(lineTotal)}
                </div>
              </div>
            );
          })}
          <div className="pt-4 text-right text-[18px]">
            Subtotal ({count} items):{" "}
            <span className="font-extrabold">₹{formatRupees(subtotal)}</span>
          </div>
        </section>

        <aside className="sticky top-[60px] rounded-xl border border-[#e7e7e7] bg-white p-5">
          <div className="mb-3 flex items-center gap-2 text-[14px] font-bold text-[#007600]">
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#007600] text-[11px] text-white">
              ✓
            </span>
            Your order qualifies for FREE express delivery
          </div>
          <div className="mb-1 text-[19px]">
            Subtotal ({count} items):{" "}
            <span className="font-extrabold">₹{formatRupees(subtotal)}</span>
          </div>
          {totalSavings > 0 && (
            <div className="mb-3.5 text-[13px] font-bold text-[#cc0c39]">
              You save ₹{formatRupees(totalSavings)} ({savingsPct}%)
            </div>
          )}
          <div className="mb-3 text-[12px] text-[#565959]">
            ETA ~{eta} min
          </div>
          <button
            type="button"
            onClick={() => navigate("/checkout")}
            className="h-11 w-full cursor-pointer rounded-[24px] border border-[#e88a00] text-[15px] font-bold text-[#0f1111] transition hover:brightness-105"
            style={{
              background: "linear-gradient(#ffb84d,#ff9900)",
              fontFamily: "inherit",
            }}
          >
            Proceed to checkout
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-2 h-10 w-full cursor-pointer border-none bg-transparent text-[13px] text-[#007185]"
          >
            Continue shopping
          </button>
        </aside>
      </div>
    </main>
  );
}
