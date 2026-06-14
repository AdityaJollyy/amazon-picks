import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ProductGrid } from "@/features/products/ProductGrid";
import { useCart } from "@/features/cart/useCart";
import { useAsync } from "@/hooks/useAsync";
import { useZone } from "@/features/zone/useZone";
import { categoriesApi, productsApi } from "@/api/products.api";
import type { DisplayProduct } from "@/types/product";

export function CategoryPage() {
  const { slug = "all" } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q")?.trim() ?? "";
  const { add, openDrawer } = useCart();
  const { zone, loading: zoneLoading } = useZone();
  const zoneCode = zone?.code;

  const isAll = slug === "all";

  const categoriesAsync = useAsync(() => categoriesApi.list(), { deps: [] });
  const currentCategory = useMemo(
    () => (isAll ? null : (categoriesAsync.data ?? []).find((c) => c.slug === slug) ?? null),
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

  const handleAdd = (product: DisplayProduct) => {
    add({
      productId: product.id,
      name: product.name,
      brand: product.brand,
      unit: product.unit,
      imageUrl: product.imageUrl,
      price: product.price,
      mrp: product.mrp,
      etaMinutes: product.etaMinutes,
    });
    openDrawer();
  };

  const products = (productsAsync.data?.items ?? []) as DisplayProduct[];
  const total = productsAsync.data?.pagination.total ?? products.length;
  const loading = zoneLoading || productsAsync.loading;
  const error = productsAsync.error;

  const titleText = q
    ? `Results for “${q}”${currentCategory ? ` in ${currentCategory.name}` : ""}`
    : (currentCategory?.name ?? "All products");

  return (
    <div className="mx-auto max-w-[1500px] px-3 py-3 sm:px-4">
      <nav className="mb-3 text-xs text-slate-600">
        <Link to="/" className="hover:text-[var(--color-amazon-link)] hover:underline">
          Home
        </Link>
        <span className="mx-1.5 text-slate-400">/</span>
        <span className="text-slate-800">{titleText}</span>
      </nav>

      <header className="mb-3 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{titleText}</h1>
        {!loading && !error && (
          <span className="text-sm text-slate-500">
            {total} item{total === 1 ? "" : "s"}
          </span>
        )}
      </header>

      {loading && <GridSkeleton />}

      {error && !loading && (
        <div className="rounded-md bg-white p-10 text-center shadow-sm">
          <div className="text-4xl">⚠️</div>
          <div className="mt-2 text-base font-semibold text-slate-800">
            Couldn&rsquo;t load products
          </div>
          <p className="mt-1 text-sm text-slate-500">{error.message}</p>
          <button
            type="button"
            onClick={() => void productsAsync.run()}
            className="mt-4 rounded-full bg-[var(--color-amazon-yellow)] px-4 py-1.5 text-sm font-semibold text-slate-900 hover:bg-[var(--color-amazon-yellow-hover)]"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="rounded-md bg-white p-10 text-center shadow-sm">
          <div className="text-4xl">🔍</div>
          <div className="mt-2 text-base font-semibold text-slate-800">
            Nothing here yet
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {q
              ? "Try a different search term, or clear your search."
              : `Nothing in stock ${zone ? `in ${zone.name}` : "right now"}.`}
          </p>
          {(categoriesAsync.data ?? []).length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {(categoriesAsync.data ?? []).map((c) => (
                <Link
                  key={c.id}
                  to={`/category/${c.slug}`}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:border-[var(--color-amazon-link)] hover:text-[var(--color-amazon-link)]"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="rounded-md bg-white p-3 shadow-sm sm:p-4">
          <ProductGrid products={products} onAdd={handleAdd} />
        </div>
      )}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="rounded-md bg-white p-4 shadow-sm">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="h-[280px] animate-pulse rounded-md border border-slate-200 bg-slate-50"
          />
        ))}
      </div>
    </div>
  );
}
