import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/features/cart/useCart";
import { useZone } from "@/features/zone/useZone";
import { ordersApi } from "@/api/orders.api";
import { ApiError } from "@/lib/ApiError";

type PayMethod = "upi" | "card" | "cod";

const PAY_METHODS: { key: PayMethod; icon: string; label: string }[] = [
  { key: "upi", icon: "📱", label: "UPI · GPay / PhonePe / Paytm" },
  { key: "card", icon: "💳", label: "Credit / Debit card" },
  { key: "cod", icon: "💵", label: "Cash on delivery" },
];

function formatRupees(n: number) {
  return n.toLocaleString("en-IN");
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, count, subtotal, totalSavings, clear } = useCart();
  const { zone } = useZone();
  const [payMethod, setPayMethod] = useState<PayMethod>("upi");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eta = items.length ? Math.max(...items.map((i) => i.etaMinutes)) : 12;

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-[1180px] px-[18px] py-[18px]">
        <div className="rounded-xl border border-[#e7e7e7] bg-white p-[60px] text-center">
          <div className="mb-2.5 text-[40px]">🛒</div>
          <div className="mb-1.5 text-[20px] font-bold">Your cart is empty</div>
          <div className="mb-4 text-[14px] text-[#565959]">
            Add some items before heading to checkout.
          </div>
          <Link
            to="/"
            className="inline-flex h-11 cursor-pointer items-center rounded-[24px] border border-[#c89411] px-[22px] text-[14px] font-bold"
            style={{ background: "linear-gradient(#f7dfa5,#f0c14b)" }}
          >
            Continue shopping
          </Link>
        </div>
      </main>
    );
  }

  const placeOrder = async () => {
    if (!zone) {
      setError("Pick a delivery zone first.");
      return;
    }
    setPlacing(true);
    setError(null);
    try {
      const order = await ordersApi.create({
        zoneCode: zone.code,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: it.qty,
        })),
      });
      const orderEta = items.length ? Math.max(...items.map((i) => i.etaMinutes)) : 12;
      const orderCount = items.reduce((n, i) => n + i.qty, 0);
      clear();
      navigate("/order-success", {
        replace: true,
        state: {
          orderId: order.id.slice(-8).toUpperCase(),
          eta: orderEta,
          count: orderCount,
          total: order.total,
        },
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Checkout failed");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <main className="mx-auto max-w-[1180px] px-[18px] py-[18px]">
      <h1 className="mb-4 text-[26px] font-extrabold">
        Checkout{" "}
        <span className="text-[14px] font-normal text-[#565959]">
          ({count} items)
        </span>
      </h1>

      {error && (
        <div className="mb-3.5 rounded-md border border-rose-300 bg-rose-50 px-4 py-2.5 text-[13px] text-rose-700">
          {error}
        </div>
      )}

      <div className="grid items-start gap-[18px] lg:grid-cols-[1fr_340px]">
        <section className="flex flex-col gap-3.5">
          {/* 1. Address */}
          <div className="rounded-xl border border-[#e7e7e7] bg-white p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#131921] text-[13px] font-extrabold text-white">
                1
              </span>
              <h2 className="m-0 text-[17px] font-extrabold">Delivery address</h2>
            </div>
            <div className="pl-[34px] text-[14px] leading-[1.6] text-[#0f1111]">
              <span className="font-bold">Aarav Sharma</span>
              <br />
              Flat 402, {zone?.name ?? "Connaught Place"}, New Delhi{" "}
              {zone?.pincode ?? "110001"}
              <br />
              Phone: +91 98xxx xxxxx
            </div>
          </div>

          {/* 2. Delivery speed */}
          <div className="rounded-xl border border-[#e7e7e7] bg-white p-5">
            <div className="mb-3.5 flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#131921] text-[13px] font-extrabold text-white">
                2
              </span>
              <h2 className="m-0 text-[17px] font-extrabold">Delivery speed</h2>
            </div>
            <div className="flex gap-3 pl-[34px]">
              <div
                className="flex-1 rounded-[10px] p-3.5"
                style={{
                  border: "2px solid #ff9900",
                  background: "#fff8ee",
                }}
              >
                <div className="text-[15px] font-extrabold text-[#0f1111]">
                  ⚡ Express · {eta} min
                </div>
                <div className="mt-1 text-[13px] font-bold text-[#007600]">FREE</div>
              </div>
              <div
                className="flex-1 rounded-[10px] border border-[#d5d9d9] p-3.5 opacity-70"
              >
                <div className="text-[15px] font-bold">Standard · 2 hrs</div>
                <div className="mt-1 text-[13px] text-[#565959]">FREE</div>
              </div>
            </div>
          </div>

          {/* 3. Payment */}
          <div className="rounded-xl border border-[#e7e7e7] bg-white p-5">
            <div className="mb-3.5 flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#131921] text-[13px] font-extrabold text-white">
                3
              </span>
              <h2 className="m-0 text-[17px] font-extrabold">Payment method</h2>
            </div>
            <div className="flex flex-col gap-2.5 pl-[34px]">
              {PAY_METHODS.map((pm) => {
                const active = pm.key === payMethod;
                return (
                  <button
                    key={pm.key}
                    type="button"
                    onClick={() => setPayMethod(pm.key)}
                    className="flex cursor-pointer items-center gap-3 rounded-[10px] px-4 py-3 text-left transition"
                    style={{
                      border: `2px solid ${active ? "#ff9900" : "#e0e0e0"}`,
                      background: active ? "#fff8ee" : "#fff",
                      fontFamily: "inherit",
                    }}
                  >
                    <span
                      className="flex h-[18px] w-[18px] items-center justify-center rounded-full"
                      style={{ border: `2px solid ${active ? "#ff9900" : "#999"}` }}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: active ? "#ff9900" : "transparent" }}
                      />
                    </span>
                    <span className="text-[20px]">{pm.icon}</span>
                    <span className="text-[15px] font-bold text-[#0f1111]">
                      {pm.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="sticky top-[60px] rounded-xl border border-[#e7e7e7] bg-white p-5">
          <button
            type="button"
            onClick={placeOrder}
            disabled={placing}
            className="mb-3.5 h-[46px] w-full cursor-pointer rounded-[24px] border border-[#e88a00] text-[15px] font-extrabold text-[#0f1111] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: "linear-gradient(#ffb84d,#ff9900)",
              fontFamily: "inherit",
            }}
          >
            {placing ? "Placing order…" : "Place your order"}
          </button>
          <div className="mb-4 text-center text-[12px] text-[#565959]">
            By placing your order you agree to Amazon Picks' terms.
          </div>
          <h3 className="m-0 mb-3 border-t border-[#eee] pt-3.5 text-[16px] font-extrabold">
            Order summary
          </h3>
          <div className="mb-3 flex max-h-[220px] flex-col gap-2 overflow-auto">
            {items.map((it) => (
              <div
                key={it.productId}
                className="flex justify-between gap-2 text-[13px] text-[#333]"
              >
                <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                  {it.qty} × {it.name}
                </span>
                <span className="whitespace-nowrap font-bold">
                  ₹{formatRupees(it.price * it.qty)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1.5 border-t border-[#eee] pt-3 text-[14px]">
            <div className="flex justify-between text-[#565959]">
              <span>Items</span>
              <span>₹{formatRupees(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#565959]">
              <span>Delivery</span>
              <span className="font-bold text-[#007600]">FREE</span>
            </div>
            {totalSavings > 0 && (
              <div className="flex justify-between font-bold text-[#cc0c39]">
                <span>Savings</span>
                <span>−₹{formatRupees(totalSavings)}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between border-t border-[#eee] pt-2.5 text-[19px] font-extrabold text-[#b12704]">
              <span>Order total</span>
              <span>₹{formatRupees(subtotal)}</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
