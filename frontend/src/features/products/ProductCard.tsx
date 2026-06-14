import { useState } from "react";
import { Link } from "react-router-dom";
import type { DisplayProduct } from "@/types/product";
import { cn } from "@/lib/cn";

type ProductCardProps = {
  product: DisplayProduct;
  qty?: number;
  onAdd?: (product: DisplayProduct) => void;
  onInc?: (product: DisplayProduct) => void;
  onDec?: (product: DisplayProduct) => void;
  className?: string;
};

function StarRating({ rating }: { rating: number }) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  return (
    <span
      className="relative inline-block h-4 text-[13px] leading-none text-[#e3e6e6]"
      style={{ letterSpacing: "1px" }}
      aria-label={`${rating} out of 5`}
    >
      ★★★★★
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 overflow-hidden whitespace-nowrap text-[#ffa41c]"
        style={{ width: `${pct}%` }}
      >
        ★★★★★
      </span>
    </span>
  );
}

function formatRupees(n: number) {
  return n.toLocaleString("en-IN");
}

export function ProductCard({
  product,
  qty = 0,
  onAdd,
  onInc,
  onDec,
  className,
}: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const hasImage = !!product.imageUrl && !imgError;
  const hasDiscount = product.mrp > product.price;
  const discountStr = hasDiscount
    ? `-${Math.round((1 - product.price / product.mrp) * 100)}%`
    : "";
  const inCart = qty > 0;

  return (
    <article
      className={cn(
        "relative flex h-full w-full flex-col rounded-lg border border-[#e7e7e7] bg-white p-2.5 transition-shadow",
        "hover:translate-y-[-2px] hover:shadow-[0_6px_18px_rgba(0,0,0,0.1)]",
        className
      )}
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      {/* Image with badges */}
      <Link
        to={`/product/${product.id}`}
        aria-label={product.name}
        className="relative mb-2 block h-[170px] overflow-hidden rounded-md bg-[#f7f8f8]"
      >
        <div className="ap-stripe-sm absolute inset-0 flex items-center justify-center p-3.5 text-center">
          <span
            className="text-[11px] leading-snug text-[#9aa0a6]"
            style={{ fontFamily: "'Courier New',monospace" }}
          >
            {product.name}
          </span>
        </div>
        {hasImage && (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="absolute inset-0 h-full w-full bg-white object-contain p-2"
          />
        )}
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-[20px] bg-[rgba(19,25,33,0.88)] px-2 py-[3px] text-[11px] font-bold text-white">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#46e07f]" />
          {product.etaMinutes} min
        </span>
        {hasDiscount && (
          <span className="absolute right-2 top-2 rounded-[4px] bg-[#cc0c39] px-[7px] py-[3px] text-[11px] font-extrabold text-white">
            {discountStr}
          </span>
        )}
      </Link>

      {/* Body (title click target) */}
      <Link
        to={`/product/${product.id}`}
        className="flex flex-1 cursor-pointer flex-col"
      >
        <div className="mb-0.5 text-[11px] font-bold uppercase tracking-[0.04em] text-[#8a8f94]">
          {product.brand}
        </div>
        <div
          className="mb-1.5 line-clamp-2 min-h-[38px] text-[14px] font-normal leading-[1.35] text-[#0f1111]"
          title={product.name}
        >
          {product.name}
        </div>
        <div className="mb-1.5 text-[12px] text-[#8a8f94]">{product.unit}</div>
        <div className="mb-2 flex items-center gap-1.5">
          <StarRating rating={product.rating} />
          <span className="text-[12px] text-[#007185]">
            ({formatRupees(product.reviewCount)})
          </span>
        </div>

        <div className="mt-auto flex items-baseline gap-1.5">
          <span className="text-[13px] text-[#0f1111]">₹</span>
          <span className="text-[21px] font-bold leading-none text-[#0f1111]">
            {formatRupees(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-[12px] text-[#8a8f94] line-through">
              ₹{formatRupees(product.mrp)}
            </span>
          )}
        </div>
      </Link>

      {/* Add / stepper */}
      <div className="mt-2.5">
        {inCart ? (
          <div
            className="flex h-9 items-center justify-between overflow-hidden rounded-[20px] border border-[#c89411]"
            style={{ background: "linear-gradient(#f7dfa5,#f0c14b)" }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onDec?.(product);
              }}
              aria-label="Decrease quantity"
              className="h-full w-11 cursor-pointer border-none bg-transparent text-xl font-bold text-[#3b2f00]"
            >
              −
            </button>
            <span className="text-[15px] font-bold text-[#0f1111] tabular-nums">
              {qty}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onInc?.(product);
              }}
              aria-label="Increase quantity"
              className="h-full w-11 cursor-pointer border-none bg-transparent text-xl font-bold text-[#3b2f00]"
            >
              +
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onAdd?.(product);
            }}
            className="h-9 w-full cursor-pointer rounded-[20px] border border-[#c89411] text-[14px] font-semibold text-[#0f1111] transition hover:brightness-95"
            style={{ background: "linear-gradient(#f7dfa5,#f0c14b)" }}
          >
            Add
          </button>
        )}
      </div>
    </article>
  );
}
