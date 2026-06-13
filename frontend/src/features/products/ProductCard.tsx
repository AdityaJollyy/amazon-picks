import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { DisplayProduct } from "@/types/product";
import { cn } from "@/lib/cn";

type ProductCardProps = {
  product: DisplayProduct;
  onAdd?: (product: DisplayProduct) => void;
  className?: string;
};

function StarRating({ rating }: { rating: number }) {
  // 5 stars, fill proportional to rating. Uses CSS clip via width %.
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  return (
    <span
      className="relative inline-block text-[14px] leading-none"
      aria-label={`${rating} out of 5`}
    >
      <span className="text-slate-300">★★★★★</span>
      <span
        className="absolute inset-0 overflow-hidden text-[var(--color-amazon-orange)]"
        style={{ width: `${pct}%` }}
        aria-hidden="true"
      >
        ★★★★★
      </span>
    </span>
  );
}

function formatRupees(n: number) {
  return n.toLocaleString("en-IN");
}

export function ProductCard({ product, onAdd, className }: ProductCardProps) {
  const discountPct =
    product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;
  const outOfStock = product.stock === 0;

  return (
    <article
      className={cn(
        "group flex w-[200px] shrink-0 flex-col rounded-md border border-slate-200 bg-white p-3 transition-shadow hover:shadow-md sm:w-[220px]",
        className
      )}
    >
      {/* Image with ETA badge */}
      <Link
        to={`/product/${product.id}`}
        aria-label={product.name}
        className="relative mb-3 block aspect-square overflow-hidden rounded-sm bg-slate-50"
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <span className="absolute left-2 top-2 rounded-full bg-slate-900/85 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur-sm">
          {product.etaMinutes} min
        </span>
        {discountPct > 0 && (
          <span className="absolute right-2 top-2 rounded-sm bg-[var(--color-amazon-price)] px-1.5 py-0.5 text-[11px] font-bold text-white">
            -{discountPct}%
          </span>
        )}
      </Link>

      {/* Brand */}
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {product.brand}
      </div>

      {/* Title — clamp to 2 lines */}
      <Link
        to={`/product/${product.id}`}
        className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-sm leading-tight text-slate-800 hover:text-[var(--color-amazon-link)]"
      >
        {product.name}
      </Link>

      {/* Unit */}
      <div className="mt-0.5 text-xs text-slate-500">{product.unit}</div>

      {/* Rating */}
      <div className="mt-1 flex items-center gap-1">
        <StarRating rating={product.rating} />
        <span className="text-xs text-[var(--color-amazon-link)]">
          ({formatRupees(product.reviewCount)})
        </span>
      </div>

      {/* Price */}
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-[11px] text-slate-700">₹</span>
        <span className="text-lg font-bold leading-none text-slate-900">
          {formatRupees(product.price)}
        </span>
        {product.mrp > product.price && (
          <span className="text-xs text-slate-500 line-through">
            ₹{formatRupees(product.mrp)}
          </span>
        )}
      </div>

      {/* Add button */}
      <motion.button
        type="button"
        disabled={outOfStock}
        onClick={() => onAdd?.(product)}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "mt-3 w-full rounded-full py-1.5 text-sm font-semibold transition-colors",
          outOfStock
            ? "cursor-not-allowed bg-slate-100 text-slate-400"
            : "bg-[var(--color-amazon-yellow)] text-slate-900 hover:bg-[var(--color-amazon-yellow-hover)]"
        )}
      >
        {outOfStock ? "Out of stock" : "Add"}
      </motion.button>
    </article>
  );
}
