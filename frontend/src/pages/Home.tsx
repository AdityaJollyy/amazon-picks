import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ProductRow } from "@/features/products/ProductGrid";
import { useDecoratedProducts } from "@/features/products/useDecoratedProducts";
import { useAsync } from "@/hooks/useAsync";
import { useZone } from "@/features/zone/useZone";
import { useAiPanel } from "@/features/ai/useAiPanel";
import { categoriesApi, productsApi } from "@/api/products.api";
import { RestockSection } from "@/features/restock/RestockSection";
import type { Category, DisplayProduct } from "@/types/product";

const HERO_CHIPS = [
  { label: "🎬 Movie night for 4", text: "movie night for 4 people, medium budget" },
  { label: "🏠 Weekly home restock", text: "weekly grocery restock for a family of 3" },
  { label: "☀️ Summer hydration kit", text: "cold drinks and water for a hot day, 6 people" },
];

const CATEGORY_ICONS: Record<string, { icon: string; bg: string }> = {
  "cold-drinks-juices": { icon: "🥤", bg: "#fdefe0" },
  "snacks-munchies": { icon: "🍿", bg: "#fdf3df" },
  "party-celebrations": { icon: "🎉", bg: "#fbe6ef" },
  "dairy-bread-eggs": { icon: "🥚", bg: "#eaf4ff" },
  "breakfast-instant-food": { icon: "🥣", bg: "#eefaf0" },
  "fruits-vegetables": { icon: "🥦", bg: "#edf9ee" },
  "personal-care": { icon: "🧴", bg: "#f0eefc" },
  "pharmacy-wellness": { icon: "💊", bg: "#e9f6f6" },
};

function tileMetaFor(slug: string): { icon: string; bg: string } {
  return CATEGORY_ICONS[slug] ?? { icon: "🛒", bg: "#f0f2f2" };
}

export function Home() {
  const { zone, loading: zoneLoading } = useZone();
  const { open: openQuick } = useAiPanel();
  const decorate = useDecoratedProducts();
  const [heroValue, setHeroValue] = useState("");

  const zoneCode = zone?.code;

  const categoriesAsync = useAsync<Category[]>(() => categoriesApi.list(), { deps: [] });
  const productsAsync = useAsync(
    () => productsApi.list({ zoneCode, limit: 100 }),
    { deps: [zoneCode], immediate: Boolean(zoneCode) },
  );

  const { deals, byCategory } = useMemo(() => {
    const items = (productsAsync.data?.items ?? []) as DisplayProduct[];
    const sortedDeals = [...items].sort((a, b) => {
      const ad = a.mrp > 0 ? 1 - a.price / a.mrp : 0;
      const bd = b.mrp > 0 ? 1 - b.price / b.mrp : 0;
      return bd - ad;
    });
    const grouped = new Map<string, DisplayProduct[]>();
    for (const p of items) {
      const arr = grouped.get(p.categoryId) ?? [];
      arr.push(p);
      grouped.set(p.categoryId, arr);
    }
    return { deals: sortedDeals.slice(0, 12), byCategory: grouped };
  }, [productsAsync.data]);

  const cats = categoriesAsync.data ?? [];
  const tiles = cats.slice(0, 5);

  const submitHero = () => {
    openQuick(heroValue);
  };

  const loading = zoneLoading || categoriesAsync.loading || productsAsync.loading;
  const error = categoriesAsync.error ?? productsAsync.error;

  return (
    <div className="mx-auto max-w-[1500px] px-[18px] py-[18px]">
      {/* HERO / QUICK MODE PROMO */}
      <section
        className="relative mb-[22px] overflow-hidden rounded-[14px] px-[38px] py-[34px] text-white"
        style={{
          background:
            "linear-gradient(120deg,#131921 0%,#232f3e 52%,#37475a 100%)",
        }}
      >
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-10 h-[260px] w-[260px] rounded-full"
          style={{
            background:
              "radial-gradient(circle,rgba(255,153,0,0.35),transparent 70%)",
          }}
        />
        <div className="relative max-w-[760px]">
          <div
            className="mb-3.5 inline-flex items-center gap-1.5 rounded-[20px] px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-[0.06em] text-[#ffce8a]"
            style={{ background: "rgba(255,153,0,0.16)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffce8a" aria-hidden="true">
              <path d="M12 2l1.8 6.4L20 10l-6.2 1.6L12 18l-1.8-6.4L4 10l6.2-1.6z" />
            </svg>
            New · Powered by AI
          </div>
          <h1
            className="mb-2 text-[38px] font-extrabold leading-[1.1] tracking-[-0.5px]"
            style={{ margin: 0 }}
          >
            Tell us the plan.
            <br />
            Get the cart in seconds.
          </h1>
          <p className="mb-5 max-w-[560px] text-[16px] text-[#c8d0d8]">
            Skip the search and scroll. Describe what you need — “movie night for
            4, medium budget” — and Quick Mode builds a ready-to-checkout cart
            for you.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitHero();
            }}
            className="flex max-w-[620px] gap-2.5"
          >
            <input
              value={heroValue}
              onChange={(e) => setHeroValue(e.target.value)}
              placeholder="e.g. movie night for 4 people, medium budget"
              className="h-[52px] flex-1 rounded-[10px] border-none bg-white px-[18px] text-[16px] text-[#0f1111] outline-none placeholder-[#8a8f94]"
              style={{ fontFamily: "inherit" }}
            />
            <button
              type="submit"
              className="flex h-[52px] cursor-pointer items-center gap-2 rounded-[10px] border-none px-[26px] text-[16px] font-extrabold text-[#131921] transition hover:brightness-105"
              style={{
                background: "linear-gradient(#ffd97a,#ff9900)",
                fontFamily: "inherit",
              }}
            >
              Build my cart →
            </button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {HERO_CHIPS.map((chip) => (
              <button
                key={chip.text}
                type="button"
                onClick={() => setHeroValue(chip.text)}
                className="cursor-pointer rounded-[18px] border px-3.5 py-1.5 text-[13px] text-[#e7eaed] transition hover:bg-[rgba(255,255,255,0.2)]"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  borderColor: "rgba(255,255,255,0.18)",
                  fontFamily: "inherit",
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && !loading && (
        <ErrorCard
          message={error.message}
          onRetry={() => {
            void categoriesAsync.run();
            void productsAsync.run();
          }}
        />
      )}

      {/* CATEGORY TILES */}
      {tiles.length > 0 && (
        <section className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-5">
          {tiles.map((cat) => {
            const meta = tileMetaFor(cat.slug);
            return (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="block cursor-pointer rounded-[10px] border border-[#e7e7e7] bg-white p-4 transition hover:translate-y-[-2px] hover:shadow-[0_6px_18px_rgba(0,0,0,0.1)]"
              >
                <div
                  className="mb-2.5 flex h-16 items-center justify-center rounded-lg text-[28px]"
                  style={{ background: meta.bg }}
                >
                  {meta.icon}
                </div>
                <div className="text-[13.5px] font-bold leading-[1.25] text-[#0f1111]">
                  {cat.name}
                </div>
                <div className="mt-1 text-[12px] text-[#007185]">Shop now →</div>
              </Link>
            );
          })}
        </section>
      )}

      <RestockSection />

      {/* PRODUCT ROWS — top deals + first two stocked categories */}
      {deals.length > 0 && (
        <ProductRow
          title="Today's top deals"
          subtitle="Lowest prices, delivered in minutes"
          seeAllHref={cats[0] ? `/category/${cats[0].slug}` : undefined}
          cards={decorate(deals)}
        />
      )}
      {cats.slice(0, 4).map((cat) => {
        const products = byCategory.get(cat.id) ?? [];
        if (!products.length) return null;
        return (
          <ProductRow
            key={cat.id}
            title={cat.name}
            seeAllHref={`/category/${cat.slug}`}
            cards={decorate(products.slice(0, 12))}
          />
        );
      })}

      {loading && deals.length === 0 && <HomeSkeleton />}
    </div>
  );
}

function HomeSkeleton() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <section
          key={i}
          className="mb-[18px] rounded-xl border border-[#e7e7e7] bg-white p-[18px]"
        >
          <div className="mb-3 h-5 w-48 animate-pulse rounded bg-slate-200" />
          <div className="flex gap-3.5 overflow-hidden">
            {[0, 1, 2, 3, 4, 5].map((j) => (
              <div
                key={j}
                className="h-[370px] w-[212px] shrink-0 animate-pulse rounded-md border border-slate-200 bg-slate-50"
              />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="mb-4 rounded-xl border border-[#e7e7e7] bg-white p-10 text-center">
      <div className="text-4xl">⚠️</div>
      <div className="mt-2 text-base font-bold text-[#0f1111]">
        Couldn&rsquo;t load products
      </div>
      <p className="mt-1 text-sm text-[#565959]">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 cursor-pointer rounded-[24px] border border-[#c89411] px-4 py-1.5 text-sm font-bold text-[#0f1111]"
        style={{ background: "linear-gradient(#f7dfa5,#f0c14b)" }}
      >
        Retry
      </button>
    </div>
  );
}
