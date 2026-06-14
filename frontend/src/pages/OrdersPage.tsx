import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAsync } from "@/hooks/useAsync";
import { ordersApi, type Order, type OrderStatus } from "@/api/orders.api";

function formatRupees(n: number) {
  return n.toLocaleString("en-IN");
}

const STATUS_META: Record<OrderStatus, { label: string; tone: string }> = {
  PLACED:           { label: "Placed",           tone: "bg-sky-100 text-sky-800" },
  PACKED:           { label: "Packed",           tone: "bg-indigo-100 text-indigo-800" },
  OUT_FOR_DELIVERY: { label: "Out for delivery", tone: "bg-amber-100 text-amber-800" },
  DELIVERED:        { label: "Delivered",        tone: "bg-emerald-100 text-emerald-800" },
  CANCELLED:        { label: "Cancelled",        tone: "bg-rose-100 text-rose-800" },
};

export function OrdersPage() {
  const { data, loading, error } = useAsync<Order[]>(() => ordersApi.list());

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Your orders</h1>
        <Link to="/" className="text-sm font-semibold text-[var(--color-amazon-link)] hover:underline">
          ← Continue shopping
        </Link>
      </div>

      {loading && <SkeletonList />}

      {error && !loading && (
        <div className="rounded-md border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Couldn&rsquo;t load your orders: {error.message}
        </div>
      )}

      {!loading && !error && data && data.length === 0 && (
        <div className="rounded-md border border-slate-200 bg-white px-6 py-10 text-center">
          <div className="text-4xl">📦</div>
          <div className="mt-2 text-base font-semibold text-slate-800">No orders yet</div>
          <p className="mt-1 text-sm text-slate-500">When you place an order it&rsquo;ll show up here.</p>
        </div>
      )}

      {!loading && !error && data && data.length > 0 && (
        <ul className="space-y-3">
          {data.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </ul>
      )}
    </main>
  );
}

function OrderCard({ order }: { order: Order }) {
  const meta = STATUS_META[order.status];
  const created = useMemo(() => new Date(order.createdAt), [order.createdAt]);
  const totalUnits = order.items.reduce((n, it) => n + it.quantity, 0);

  return (
    <li className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {/* Header strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs">
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-slate-500">Placed</div>
            <div className="font-medium text-slate-800">
              {created.toLocaleString(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-slate-500">Total</div>
            <div className="font-semibold text-slate-900 tabular-nums">
              ₹{formatRupees(order.total)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-slate-500">Zone</div>
            <div className="font-medium text-slate-800">
              {order.zone.name} ({order.zone.code})
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={"rounded-full px-2.5 py-0.5 text-[11px] font-semibold " + meta.tone}>
            {meta.label}
          </span>
          <span className="text-[11px] text-slate-500">
            #{order.id.slice(-6).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Items */}
      <ul className="divide-y divide-slate-100">
        {order.items.map((it) => (
          <li key={it.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
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

      <div className="border-t border-slate-100 bg-white px-4 py-2 text-right text-[11px] text-slate-500">
        {order.items.length} line{order.items.length === 1 ? "" : "s"} · {totalUnits} unit
        {totalUnits === 1 ? "" : "s"}
      </div>
    </li>
  );
}

function SkeletonList() {
  return (
    <ul className="space-y-3">
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="overflow-hidden rounded-lg border border-slate-200 bg-white"
        >
          <div className="h-12 animate-pulse bg-slate-100" />
          <div className="space-y-2 px-4 py-3">
            <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
          </div>
        </li>
      ))}
    </ul>
  );
}
