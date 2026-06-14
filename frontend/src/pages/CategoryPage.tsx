import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ProductGrid } from "@/features/products/ProductGrid";
import { useDecoratedProducts } from "@/features/products/useDecoratedProducts";
import { useAsync } from "@/hooks/useAsync";
import { useZone } from "@/features/zone/useZone";
import { categoriesApi, productsApi } from "@/api/products.api";
import type { DisplayProduct } from "@/types/product";

type SortKey = "relevance" | "price_low" | "price_high" | "rating" | "discount";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "relevance", label: "Relevance" },
  { key: "price_low", label: "Price: Low to High" },
  { key: "price_high", label: "Price: High to Low" },
  { key: "rating", label: "Avg. customer review" },
  { key: "discount", label: "Biggest discount" },
];

export function CategoryPage() {
  const { slug = "all" } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q")?.trim() ?? "";
  const decorate = useDecoratedProducts();
  const { zone, loading: zoneLoading } = useZone();
  const zoneCode = zone?.code;

  const [sortBy, setSortBy] = useState<SortKey>("relevance");

  const isAll = slug === "all";

  const categoriesAsync = useAsync(() => categoriesApi.list(), { deps: [] });
  const currentCategory = useMemo(
    () =>
      isAll
        ? null
        : (categoriesAsync.data ?? []).find((c) => c.slug === slug) ?? null,
    [categoriesAsync.data, slug, isAll],
  );

  const productsAsync = useAsync(
    () =>
      productsApi.list({
        zoneCode,
        categorySlug: isAll ? undefined : slug,
        search: q || undefined,
        limit: 60,
      }),
    { deps: [zoneCode, slug, q], immediate: Boolean(zoneCode) },
  );

  const products = useMemo(() => {
    const items = (productsAsync.data?.items ?? []) as DisplayProduct[];
    const sorted = [...items];
    switch (sortBy) {
      case "price_low":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price_high":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case "discount":
        sorted.sort((a, b) => {
          const ad = a.mrp > 0 ? 1 - a.price / a.mrp : 0;
          const bd = b.mrp > 0 ? 1 - b.price / b.mrp : 0;
          return bd - ad;
        });
        break;
      default:
        break;
    }
    return sorted;
  }, [productsAsync.data, sortBy]);

  const total = productsAsync.data?.pagination.total ?? products.length;
  const loading = zoneLoading || productsAsync.loading;
  const error = productsAsync.error;

  const titleText = q
    ? `Results for “${q}”`
    : currentCategory?.name ?? "All products";

  const cats = categoriesAsync.data ?? [];

  return (
    <main className="mx-auto max-w-[1500px] px-[18px] pb-10 pt-3.5">
      {/* Breadcrumb */}
      <nav className="mb-3.5 text-[13px] text-[#565959]">
        <Link to="/" className="cursor-pointer text-[#007185] hover:underline">
          Home
        </Link>
        <span className="mx-[7px] text-[#aaa]">/</span>
        <span className="font-semibold text-[#0f1111]">{titleText}</span>
      </nav>

      <div className="grid items-start gap-5 lg:grid-cols-[230px_1fr]">
        {/* FILTER RAIL */}
        <aside className="sticky top-[60px] rounded-xl border border-[#e7e7e7] bg-white p-4 pb-2">
          <div className="mb-2.5 text-[15px] font-extrabold">Department</div>
          <div className="mb-[18px] flex flex-col gap-0.5">
            <Link
              to="/category/all"
              className="rounded-md px-2 py-1.5 text-left text-[14px] transition"
              style={{
                color: isAll ? "#0f1111" : "#007185",
                fontWeight: isAll ? 800 : 400,
                background: isAll ? "#f3f4f4" : "transparent",
              }}
            >
              All products
            </Link>
            {cats.map((c) => {
              const active = !q && c.slug === slug;
              return (
                <Link
                  key={c.id}
                  to={`/category/${c.slug}`}
                  className="rounded-md px-2 py-1.5 text-left text-[14px] transition"
                  style={{
                    color: active ? "#0f1111" : "#007185",
                    fontWeight: active ? 800 : 400,
                    background: active ? "#f3f4f4" : "transparent",
                  }}
                >
                  {c.name}
                </Link>
              );
            })}
          </div>
          <div className="mb-2.5 border-t border-[#eee] pt-3.5 text-[15px] font-extrabold">
            Sort by
          </div>
          <div className="flex flex-col gap-0.5 pb-2">
            {SORT_OPTIONS.map((s) => {
              const active = s.key === sortBy;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSortBy(s.key)}
                  className="cursor-pointer rounded-md border-none px-2 py-1.5 text-left text-[14px] transition"
                  style={{
                    color: active ? "#0f1111" : "#007185",
                    fontWeight: active ? 800 : 400,
                    background: active ? "#f3f4f4" : "transparent",
                    fontFamily: "inherit",
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </aside>

        {/* RESULTS */}
        <section>
          <header className="mb-3.5 flex items-end justify-between">
            <h1 className="m-0 text-[28px] font-extrabold text-[#0f1111]">
              {titleText}
            </h1>
            {!loading && !error && (
              <span className="text-[14px] text-[#565959]">
                {total} item{total === 1 ? "" : "s"}
              </span>
            )}
          </header>

          {loading && <GridSkeleton />}

          {error && !loading && (
            <div className="rounded-xl border border-[#e7e7e7] bg-white p-10 text-center text-[#565959]">
              <div className="mb-2.5 text-[40px]">⚠️</div>
              <div className="mb-1.5 text-[18px] font-bold text-[#0f1111]">
                Couldn&rsquo;t load products
              </div>
              <div className="text-[14px]">{error.message}</div>
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="rounded-xl border border-[#e7e7e7] bg-white p-[60px] text-center text-[#565959]">
              <div className="mb-2.5 text-[40px]">🔍</div>
              <div className="mb-1.5 text-[18px] font-bold text-[#0f1111]">
                No results for “{titleText}”
              </div>
              <div className="text-[14px]">
                Try a different search or browse a category above.
              </div>
            </div>
          )}

          {!loading && !error && products.length > 0 && (
            <ProductGrid cards={decorate(products)} />
          )}
        </section>
      </div>
    </main>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="h-[370px] animate-pulse rounded-md border border-[#e7e7e7] bg-white"
        />
      ))}
    </div>
  );
}
