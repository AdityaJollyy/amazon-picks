import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ProductGrid } from "@/features/products/ProductGrid";
import { useCart } from "@/features/cart/useCart";
import {
  DUMMY_CATEGORY_GROUPS,
  DUMMY_PRODUCTS,
  getCategoryGroupBySlug,
  searchProducts,
} from "@/features/products/dummyProducts";
import type { DisplayProduct } from "@/types/product";

export function CategoryPage() {
  const { slug = "all" } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q")?.trim() ?? "";
  const { add, openDrawer } = useCart();

  const { title, products } = useMemo(() => {
    const isAll = slug === "all";
    const cat = isAll ? null : getCategoryGroupBySlug(slug);

    let pool: DisplayProduct[] = isAll
      ? DUMMY_PRODUCTS
      : (cat?.products ?? []);

    if (q) {
      const matches = searchProducts(q);
      const matchIds = new Set(matches.map((m) => m.id));
      pool = pool.filter((p) => matchIds.has(p.id));
    }

    const titleText = q
      ? `Results for “${q}”${cat ? ` in ${cat.name}` : ""}`
      : (cat?.name ?? "All products");

    return { title: titleText, products: pool };
  }, [slug, q]);

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

  return (
    <div className="mx-auto max-w-[1500px] px-3 py-3 sm:px-4">
      <nav className="mb-3 text-xs text-slate-600">
        <Link to="/" className="hover:text-[var(--color-amazon-link)] hover:underline">
          Home
        </Link>
        <span className="mx-1.5 text-slate-400">/</span>
        <span className="text-slate-800">{title}</span>
      </nav>

      <header className="mb-3 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <span className="text-sm text-slate-500">
          {products.length} item{products.length === 1 ? "" : "s"}
        </span>
      </header>

      {products.length === 0 ? (
        <div className="rounded-md bg-white p-10 text-center shadow-sm">
          <div className="text-4xl">🔍</div>
          <div className="mt-2 text-base font-semibold text-slate-800">
            Nothing here yet
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Try a different category, or clear your search.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {DUMMY_CATEGORY_GROUPS.map((c) => (
              <Link
                key={c.id}
                to={`/category/${c.slug}`}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:border-[var(--color-amazon-link)] hover:text-[var(--color-amazon-link)]"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-md bg-white p-3 shadow-sm sm:p-4">
          <ProductGrid products={products} onAdd={handleAdd} />
        </div>
      )}
    </div>
  );
}
