import { Link } from "react-router-dom";
import { ProductCard } from "@/features/products/ProductCard";
import type { DisplayProduct } from "@/types/product";

type ProductRowProps = {
  title: string;
  /** If provided, the section header links here (e.g. /category/snacks). */
  seeAllHref?: string;
  products: DisplayProduct[];
  onAdd?: (product: DisplayProduct) => void;
};

/** Amazon-style category row: white card with a heading and a horizontal,
 *  snap-scrolling strip of ProductCards. */
export function ProductRow({ title, seeAllHref, products, onAdd }: ProductRowProps) {
  return (
    <section className="rounded-md bg-white shadow-sm">
      <header className="flex items-end justify-between gap-4 px-4 pt-4">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        {seeAllHref && (
          <Link
            to={seeAllHref}
            className="text-sm font-medium text-[var(--color-amazon-link)] hover:text-[var(--color-amazon-price)] hover:underline"
          >
            See all
          </Link>
        )}
      </header>

      <div
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-4 pt-3"
        // a touch of horizontal padding so first/last cards aren't flush
      >
        {products.map((p) => (
          <div key={p.id} className="snap-start">
            <ProductCard product={p} onAdd={onAdd} />
          </div>
        ))}
      </div>
    </section>
  );
}

type ProductGridProps = {
  products: DisplayProduct[];
  onAdd?: (product: DisplayProduct) => void;
};

/** Plain responsive grid (used on category / search pages later). */
export function ProductGrid({ products, onAdd }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onAdd={onAdd} />
      ))}
    </div>
  );
}
