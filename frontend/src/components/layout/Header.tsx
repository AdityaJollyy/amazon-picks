import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Wordmark } from "@/components/ui/Wordmark";
import { useCart } from "@/features/cart/useCart";
import { useZone } from "@/features/zone/useZone";
import { useAiPanel } from "@/features/ai/useAiPanel";
import { useAsync } from "@/hooks/useAsync";
import { categoriesApi } from "@/api/products.api";
import type { Category } from "@/types/product";

export function Header({ userName = "Aarav" }: { userName?: string }) {
  const navigate = useNavigate();
  const { count } = useCart();
  const { zone } = useZone();
  const { open: openQuick } = useAiPanel();

  const categoriesAsync = useAsync<Category[]>(() => categoriesApi.list(), {
    deps: [],
  });
  const scopes = [
    { label: "All", value: "all" },
    ...(categoriesAsync.data ?? []).slice(0, 6).map((c) => ({
      label: c.name,
      value: c.slug,
    })),
  ];

  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("all");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    const params = q ? `?q=${encodeURIComponent(q)}` : "";
    navigate(`/category/${scope}${params}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#131921] text-white">
      {/* Top nav */}
      <div className="mx-auto flex max-w-[1680px] items-center gap-3.5 px-[18px] py-2">
        <Wordmark />

        {/* Deliver-to pill */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex shrink-0 items-center gap-1 rounded-[4px] border border-transparent px-1.5 py-1.5 text-left leading-[1.15] hover:border-white"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#cfd6dc"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M12 2C8 2 5 5 5 9c0 5 7 12 7 12s7-7 7-12c0-4-3-7-7-7z" />
            <circle cx="12" cy="9" r="2.4" />
          </svg>
          <span>
            <span className="block text-[11px] text-[#cfd6dc]">Deliver to {userName}</span>
            <span className="block text-[13px] font-bold text-white">
              {zone ? `${zone.name} ${zone.pincode}` : "Connaught Place 110001"}
            </span>
          </span>
        </button>

        {/* Search bar */}
        <form
          role="search"
          onSubmit={handleSubmit}
          className="flex h-[42px] min-w-0 flex-1 items-stretch overflow-hidden rounded-lg bg-white"
        >
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            aria-label="Search category"
            className="h-full w-[109px] cursor-pointer border-none bg-[#eef1f3] px-3 text-[13px] text-[#0f1111] focus:outline-none"
            style={{ fontFamily: "inherit" }}
          >
            {scopes.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Amazon Picks"
            aria-label="Search Amazon Picks"
            className="min-w-0 flex-1 border-none px-3.5 text-[15px] text-[#0f1111] placeholder-[#8a8f94] focus:outline-none"
            style={{ fontFamily: "inherit" }}
          />
          <button
            type="submit"
            aria-label="Search"
            className="flex w-[52px] shrink-0 items-center justify-center"
            style={{ background: "linear-gradient(#ffd97a,#febd69)" }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#131921"
              strokeWidth="2.2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-5-5" strokeLinecap="round" />
            </svg>
          </button>
        </form>

        {/* Quick Mode CTA */}
        <button
          type="button"
          onClick={() => openQuick()}
          className="flex h-[42px] shrink-0 items-center gap-[7px] rounded-[22px] px-4 text-[14px] font-extrabold text-[#131921] transition hover:brightness-105"
          style={{
            background: "linear-gradient(95deg,#ff9900,#ff7847)",
            fontFamily: "inherit",
            boxShadow: "0 2px 10px rgba(255,140,40,0.45)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#131921" aria-hidden="true">
            <path d="M12 2l1.8 6.4L20 10l-6.2 1.6L12 18l-1.8-6.4L4 10l6.2-1.6z" />
          </svg>
          Quick Mode
          <span
            className="rounded-[5px] px-1.5 py-px text-[11px] font-bold"
            style={{ background: "rgba(19,25,33,0.16)" }}
          >
            AI
          </span>
        </button>

        {/* Account */}
        <Link
          to="/orders"
          className="hidden shrink-0 flex-col rounded-[4px] border border-transparent px-1.5 py-1.5 leading-[1.15] hover:border-white md:flex"
        >
          <span className="text-[11px] text-[#cfd6dc]">Hello, {userName}</span>
          <span className="text-[13px] font-bold text-white">Account &amp; Lists ▾</span>
        </Link>

        {/* Cart */}
        <Link
          to="/cart"
          aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
          className="relative flex shrink-0 items-center gap-2 rounded-[4px] border border-transparent px-2 py-1.5 hover:border-white"
        >
          <div className="relative">
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <circle cx="9" cy="20" r="1.3" />
              <circle cx="17" cy="20" r="1.3" />
              <path
                d="M2 3h3l2.3 12h10l2-8H6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className="absolute -right-[7px] -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-[10px] px-1.5 text-[12px] font-extrabold text-[#131921]"
              style={{ background: "#febd69" }}
              aria-hidden="true"
            >
              {count}
            </span>
          </div>
          <span className="hidden text-[14px] font-bold text-white sm:inline">Cart</span>
        </Link>
      </div>
    </header>
  );
}
