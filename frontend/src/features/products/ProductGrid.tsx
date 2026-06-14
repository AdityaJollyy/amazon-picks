import { Link } from "react-router-dom";
import { ProductCard } from "@/features/products/ProductCard";
import type { DisplayProduct } from "@/types/product";

type DecoratedProduct = {
  product: DisplayProduct;
  qty: number;
  onAdd: (product: DisplayProduct) => void;
  onInc: (product: DisplayProduct) => void;
  onDec: (product: DisplayProduct) => void;
};

type ProductRowProps = {
  title: string;
  subtitle?: string;
  /** If provided, renders a "See all →" link in the row header. */
  seeAllHref?: string;
  cards: DecoratedProduct[];
};

/** Amazon Picks row card: white panel, title + subtitle + See all,
 *  then a horizontally-scrolling strip of 212px ProductCard columns. */
export function ProductRow({ title, subtitle, seeAllHref, cards }: ProductRowProps) {
  if (!cards.length) return null;

  return (
    <section className="mb-[18px] rounded-xl border border-[#e7e7e7] bg-white p-[18px_18px_20px]">
      <header className="mb-3.5 flex items-center justify-between">
        <div>
          <h2 className="m-0 text-[21px] font-extrabold text-[#0f1111]">{title}</h2>
          {subtitle && (
            <div className="mt-0.5 text-[13px] text-[#565959]">{subtitle}</div>
          )}
        </div>
        {seeAllHref && (
          <Link
            to={seeAllHref}
            className="text-[14px] font-bold text-[#007185] hover:text-[#c45500]"
          >
            See all →
          </Link>
        )}
      </header>
      <div
        className="grid auto-cols-[212px] grid-flow-col gap-3.5 overflow-x-auto pb-1.5"
      >
        {cards.map((c) => (
          <div key={c.product.id} className="h-[370px]">
            <ProductCard
              product={c.product}
              qty={c.qty}
              onAdd={c.onAdd}
              onInc={c.onInc}
              onDec={c.onDec}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

type ProductGridProps = {
  cards: DecoratedProduct[];
};

/** 5-column grid used on category / search pages. */
export function ProductGrid({ cards }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {cards.map((c) => (
        <div key={c.product.id} className="h-[370px]">
          <ProductCard
            product={c.product}
            qty={c.qty}
            onAdd={c.onAdd}
            onInc={c.onInc}
            onDec={c.onDec}
          />
        </div>
      ))}
    </div>
  );
}

export type { DecoratedProduct };
