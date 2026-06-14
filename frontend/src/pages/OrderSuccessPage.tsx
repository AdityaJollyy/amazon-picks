import { Link, Navigate, useLocation } from "react-router-dom";

type SuccessState = {
  orderId: string;
  eta: number;
  count: number;
  total: number;
};

function formatRupees(n: number) {
  return n.toLocaleString("en-IN");
}

export function OrderSuccessPage() {
  const location = useLocation();
  const state = location.state as Partial<SuccessState> | null;

  // Direct visit with no prior order — bounce home rather than show empty data.
  if (!state || !state.orderId) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="mx-auto max-w-[760px] px-[18px] py-10">
      <div className="rounded-2xl border border-[#e7e7e7] bg-white p-[44px] text-center">
        <div className="mx-auto mb-[18px] flex h-[78px] w-[78px] items-center justify-center rounded-full bg-[#e7f6ec]">
          <span className="text-[42px] text-[#007600]">✓</span>
        </div>
        <h1 className="m-0 mb-1.5 text-[28px] font-extrabold text-[#007600]">
          Order placed, thank you!
        </h1>
        <p className="m-0 mb-[22px] text-[15px] text-[#565959]">
          Your order is confirmed and on its way. Confirmation sent to your email.
        </p>
        <div className="mb-6 flex flex-wrap justify-center gap-x-[30px] gap-y-3 rounded-xl bg-[#f7f8f8] p-5">
          <SummaryStat label="Order ID" value={`AP${state.orderId}`} />
          <SummaryStat
            label="Arriving in"
            value={`${state.eta ?? 12} min`}
            tone="#007600"
          />
          <SummaryStat label="Items" value={String(state.count ?? 0)} />
          <SummaryStat
            label="Total paid"
            value={`₹${formatRupees(state.total ?? 0)}`}
          />
        </div>
        <Link
          to="/"
          className="inline-flex h-[46px] cursor-pointer items-center rounded-[24px] border border-[#c89411] px-[30px] text-[15px] font-bold"
          style={{ background: "linear-gradient(#f7dfa5,#f0c14b)" }}
        >
          Continue shopping
        </Link>
      </div>
    </main>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div>
      <div className="text-[12px] uppercase tracking-[0.05em] text-[#8a8f94]">
        {label}
      </div>
      <div
        className="text-[17px] font-extrabold"
        style={{ color: tone ?? "#0f1111" }}
      >
        {value}
      </div>
    </div>
  );
}
