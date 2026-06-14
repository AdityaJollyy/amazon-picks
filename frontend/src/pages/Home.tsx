import { useMemo } from "react";
import { ProductRow } from "@/features/products/ProductGrid";
import { useCart } from "@/features/cart/useCart";
import { useAsync } from "@/hooks/useAsync";
import { useZone } from "@/features/zone/useZone";
import { categoriesApi, productsApi } from "@/api/products.api";
import { RestockSection } from "@/features/restock/RestockSection";
import type { DisplayProduct } from "@/types/product";

export function Home() {
  const { add, openDrawer } = useCart();
  const { zone, loading: zoneLoading } = useZone();
  const zoneCode = zone?.code;

  const categoriesAsync = useAsync(() => categoriesApi.list(), { deps: [] });

  const productsAsync = useAsync(
    () =>
      productsApi.list({
        zoneCode,
        limit: 100,
      }),
    { deps: [zoneCode], immediate: Boolean(zoneCode) },
  );

  const groups = useMemo(() => {
    const cats = categoriesAsync.data ?? [];
    const items = (productsAsync.data?.items ?? []) as DisplayProduct[];
    if (!cats.length || !items.length) return [];

    const byCat = new Map<string, DisplayProduct[]>();
    for (const p of items) {
      const arr = byCat.get(p.categoryId) ?? [];
      arr.push(p);
      byCat.set(p.categoryId, arr);
    }
    return cats
      .map((c) => ({ category: c, products: (byCat.get(c.id) ?? []).slice(0, 12) }))
      .filter((g) => g.products.length > 0);
  }, [categoriesAsync.data, productsAsync.data]);

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

  const loading = zoneLoading || categoriesAsync.loading || productsAsync.loading;
  const error = categoriesAsync.error ?? productsAsync.error;

  return (
    <div className="mx-auto max-w-[1500px] space-y-3 px-3 py-3 sm:px-4">
      {loading && groups.length === 0 && <HomeSkeleton />}
      {error && !loading && (
        <ErrorCard
          message={error.message}
          onRetry={() => {
            void categoriesAsync.run();
            void productsAsync.run();
          }}
        />
      )}
      {!loading && !error && groups.length === 0 && (
        <EmptyZoneCard zoneName={zone?.name} />
      )}
      <RestockSection />
      {groups.map(({ category, products }) => (
        <ProductRow
          key={category.id}
          title={category.name}
          seeAllHref={`/category/${category.slug}`}
          products={products}
          onAdd={handleAdd}
        />
      ))}
    </div>
  );
}

function HomeSkeleton() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <section key={i} className="rounded-md bg-white p-4 shadow-sm">
          <div className="mb-3 h-5 w-48 animate-pulse rounded bg-slate-200" />
          <div className="flex gap-3 overflow-hidden">
            {[0, 1, 2, 3, 4, 5].map((j) => (
              <div
                key={j}
                className="h-[280px] w-[200px] shrink-0 animate-pulse rounded-md border border-slate-200 bg-slate-50"
              />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-md bg-white p-10 text-center shadow-sm">
      <div className="text-4xl">⚠️</div>
      <div className="mt-2 text-base font-semibold text-slate-800">
        Couldn&rsquo;t load products
      </div>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-full bg-[var(--color-amazon-yellow)] px-4 py-1.5 text-sm font-semibold text-slate-900 hover:bg-[var(--color-amazon-yellow-hover)]"
      >
        Retry
      </button>
    </div>
  );
}

function EmptyZoneCard({ zoneName }: { zoneName?: string }) {
  return (
    <div className="rounded-md bg-white p-10 text-center shadow-sm">
      <div className="text-4xl">📦</div>
      <div className="mt-2 text-base font-semibold text-slate-800">
        Nothing in stock {zoneName ? `in ${zoneName}` : "in this zone"}
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Try a different delivery zone from the header.
      </p>
    </div>
  );
}
