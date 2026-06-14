import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ProductRow } from "@/features/products/ProductGrid";
import { useCart } from "@/features/cart/useCart";
import { useToast } from "@/features/toast/useToast";
import { useDecoratedProducts } from "@/features/products/useDecoratedProducts";
import { useAsync } from "@/hooks/useAsync";
import { useZone } from "@/features/zone/useZone";
import { productsApi } from "@/api/products.api";
import type { DisplayProduct, ProductDetail } from "@/types/product";

function formatRupees(n: number) {
  return n.toLocaleString("en-IN");
}

function StarRating({ rating, size = 17 }: { rating: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  return (
    <span
      className="relative inline-block leading-none text-[#e3e6e6]"
      style={{ fontSize: size, letterSpacing: "2px" }}
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

export function ProductPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { add } = useCart();
  const { flash } = useToast();
  const { zone } = useZone();
  const decorate = useDecoratedProducts();
  const [qty, setQty] = useState(1);

  const productAsync = useAsync(() => productsApi.get(id), { deps: [id] });
  const product = productAsync.data;

  const relatedAsync = useAsync(
    () =>
      productsApi.list({
        categorySlug: product?.category?.slug,
        zoneCode: zone?.code,
        limit: 12,
      }),
    {
      deps: [product?.category?.slug, zone?.code],
      immediate: Boolean(product?.category?.slug),
    },
  );

  const related = useMemo(() => {
    const all = (relatedAsync.data?.items ?? []) as DisplayProduct[];
    return all.filter((p) => p.id !== product?.id).slice(0, 8);
  }, [relatedAsync.data, product?.id]);

  if (productAsync.loading) {
    return (
      <main className="mx-auto max-w-[1500px] px-[18px] py-3.5">
        <div className="grid gap-6 rounded-[14px] border border-[#e7e7e7] bg-white p-6 lg:grid-cols-[72px_360px_1fr_290px]">
          <div className="hidden h-[480px] animate-pulse rounded-md bg-slate-100 lg:block" />
          <div className="h-[480px] animate-pulse rounded-md bg-slate-100" />
          <div className="space-y-3">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
            <div className="h-6 w-3/4 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
            <div className="h-10 w-1/3 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="h-[300px] animate-pulse rounded bg-slate-100" />
        </div>
      </main>
    );
  }

  if (productAsync.error || !product) {
    return (
      <main className="mx-auto max-w-[1500px] px-[18px] py-12">
        <div className="rounded-xl border border-[#e7e7e7] bg-white p-10 text-center">
          <div className="text-[40px]">🤷</div>
          <div className="mt-2 text-base font-bold text-[#0f1111]">
            {productAsync.error?.statusCode === 404
              ? "Product not found"
              : "Couldn't load this product"}
          </div>
          <p className="mt-1 text-sm text-[#565959]">
            {productAsync.error?.message ?? "It may be out of catalogue."}
          </p>
          <Link
            to="/"
            className="mt-4 inline-block rounded-[24px] border border-[#c89411] px-4 py-1.5 text-sm font-bold text-[#0f1111]"
            style={{ background: "linear-gradient(#f7dfa5,#f0c14b)" }}
          >
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  const cat = product.category ?? { name: "All products", slug: "all" };
  const hasDiscount = product.mrp > product.price;
  const discountStr = hasDiscount
    ? `-${Math.round((1 - product.price / product.mrp) * 100)}%`
    : "";

  const myAvail = product.availability.find((a) => a.zone.code === zone?.code);
  const stock = myAvail?.stock ?? 0;
  const etaMinutes = myAvail?.etaMinutes ?? 12;
  const inStock = stock > 0;

  const buildCartItem = (p: ProductDetail) => ({
    productId: p.id,
    name: p.name,
    brand: p.brand,
    unit: p.unit,
    imageUrl: p.imageUrl,
    price: p.price,
    mrp: p.mrp,
    etaMinutes,
  });

  const handleAdd = () => {
    add(buildCartItem(product), qty);
    flash(`Added ${product.name} to cart`);
  };

  const handleBuyNow = () => {
    add(buildCartItem(product), qty);
    flash(`Added ${product.name} to cart`);
    navigate("/checkout");
  };

  return (
    <main className="mx-auto max-w-[1500px] px-[18px] pb-10 pt-3.5">
      {/* Breadcrumb */}
      <nav className="mb-3.5 text-[13px] text-[#565959]">
        <Link to="/" className="text-[#007185] hover:underline">
          Home
        </Link>
        <span className="mx-[7px] text-[#aaa]">/</span>
        <Link to={`/category/${cat.slug}`} className="text-[#007185] hover:underline">
          {cat.name}
        </Link>
        <span className="mx-[7px] text-[#aaa]">/</span>
        <span className="font-semibold text-[#0f1111]">{product.name}</span>
      </nav>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="grid items-start gap-6 rounded-[14px] border border-[#e7e7e7] bg-white p-6 lg:grid-cols-[72px_360px_1fr_290px]"
      >
        {/* Thumbs */}
        <div className="hidden flex-col gap-2.5 lg:flex">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="ap-stripe-sm flex h-[78px] items-center justify-center rounded-lg p-1 text-center text-[9px] text-[#9aa0a6]"
              style={{
                border: `1.5px solid ${i === 0 ? "#febd69" : "#e0e0e0"}`,
                fontFamily: "'Courier New',monospace",
                background: "#f7f8f8",
              }}
            >
              {product.name}
            </div>
          ))}
        </div>

        {/* Main image */}
        <div className="ap-stripe relative flex h-[480px] items-center justify-center overflow-hidden rounded-[10px]">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="max-h-full max-w-full object-contain p-[30px]"
            />
          ) : (
            <span
              className="text-[14px] text-[#9aa0a6]"
              style={{ fontFamily: "'Courier New',monospace" }}
            >
              [ {product.name} ]
            </span>
          )}
          <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-[20px] bg-[rgba(19,25,33,0.88)] px-3 py-1.5 text-[13px] font-bold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-[#46e07f]" />
            {etaMinutes} min delivery
          </div>
          {hasDiscount && (
            <div className="absolute right-4 top-4 rounded-md bg-[#cc0c39] px-2.5 py-1 text-[14px] font-extrabold text-white">
              {discountStr}
            </div>
          )}
        </div>

        {/* Info column */}
        <div>
          <div className="mb-1 text-[13px] font-bold uppercase tracking-[0.05em] text-[#8a8f94]">
            {product.brand}
          </div>
          <h1 className="m-0 mb-2 text-[26px] font-bold leading-[1.25] text-[#0f1111]">
            {product.name}
          </h1>
          <Link
            to={`/category/${cat.slug}`}
            className="mb-2.5 block text-[13px] text-[#007185] hover:underline"
          >
            Visit the {cat.name} store
          </Link>
          <div className="mb-3.5 flex items-center gap-2 border-b border-[#eee] pb-3.5">
            <StarRating rating={product.rating} />
            <span className="text-[14px] font-semibold text-[#007185]">
              {product.rating.toFixed(1)}
            </span>
            <span className="text-[14px] text-[#007185]">
              {formatRupees(product.reviewCount)} ratings
            </span>
          </div>

          <div className="mb-1.5 flex items-start gap-2.5">
            {hasDiscount && (
              <span className="text-[22px] font-semibold text-[#cc0c39]">
                {discountStr}
              </span>
            )}
            <div>
              <span className="relative top-1 align-top text-[14px]">₹</span>
              <span className="text-[34px] font-bold">
                {formatRupees(product.price)}
              </span>
            </div>
          </div>

          {hasDiscount && (
            <div className="mb-0.5 text-[13px] text-[#565959]">
              M.R.P.:{" "}
              <span className="line-through">₹{formatRupees(product.mrp)}</span>{" "}
              &nbsp;
              <span className="font-semibold text-[#007600]">
                You save ₹{formatRupees(product.mrp - product.price)}
              </span>
            </div>
          )}
          <div className="mb-4 text-[12px] text-[#565959]">
            Inclusive of all taxes
          </div>

          <p className="m-0 mb-[18px] text-[14px] leading-[1.5] text-[#333]">
            {product.description ||
              `${product.brand} ${product.name} (${product.unit}). Delivered in minutes from your nearest store — fresh, sealed and ready to enjoy.`}
          </p>

          <table className="w-full border-collapse text-[14px]">
            <tbody>
              <tr>
                <td className="w-[120px] py-1.5 align-top text-[#565959]">Brand</td>
                <td className="py-1.5 font-bold">{product.brand}</td>
              </tr>
              <tr>
                <td className="py-1.5 align-top text-[#565959]">Unit</td>
                <td className="py-1.5 font-bold">{product.unit}</td>
              </tr>
              <tr>
                <td className="py-1.5 align-top text-[#565959]">Category</td>
                <td className="py-1.5 font-bold">{cat.name}</td>
              </tr>
              {product.tags.length > 0 && (
                <tr>
                  <td className="py-1.5 align-top text-[#565959]">Tags</td>
                  <td className="py-1.5">
                    <span className="inline-flex flex-wrap gap-1.5">
                      {product.tags.slice(0, 5).map((t) => (
                        <span
                          key={t}
                          className="rounded-[12px] bg-[#eef1f3] px-2.5 py-0.5 text-[12px] text-[#37475a]"
                        >
                          {t}
                        </span>
                      ))}
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* BUY BOX */}
        <aside className="sticky top-[60px] rounded-xl border border-[#e0e0e0] bg-white p-[18px]">
          <div className="mb-1.5">
            <span className="relative top-[3px] align-top text-[13px]">₹</span>
            <span className="text-[30px] font-bold">{formatRupees(product.price)}</span>
          </div>
          {inStock ? (
            <div className="mb-0.5 text-[14px] font-bold text-[#007600]">
              FREE delivery in {etaMinutes} min
            </div>
          ) : (
            <div className="mb-0.5 text-[14px] font-bold text-[#cc0c39]">
              Not available in this zone
            </div>
          )}
          <div className="mb-3 text-[13px] text-[#565959]">
            Delivering to{" "}
            <span className="font-bold text-[#0f1111]">
              {zone?.name ?? "Connaught Place"}
            </span>
          </div>
          <div
            className="mb-3.5 text-[18px] font-bold"
            style={{ color: inStock ? "#007600" : "#cc0c39" }}
          >
            {inStock ? "In stock" : "Out of stock"}
          </div>

          <div className="mb-3.5 flex items-center gap-3">
            <span className="text-[14px] text-[#0f1111]">Qty</span>
            <div
              className="flex items-center overflow-hidden rounded-lg border border-[#d5d9d9]"
              style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }}
            >
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="h-9 w-[38px] cursor-pointer border-none bg-[#f0f2f2] text-[18px] font-bold"
              >
                −
              </button>
              <span className="w-[42px] text-center text-[15px] font-bold">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                aria-label="Increase quantity"
                className="h-9 w-[38px] cursor-pointer border-none bg-[#f0f2f2] text-[18px] font-bold"
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!inStock}
            className="mb-2.5 h-11 w-full cursor-pointer rounded-[24px] border border-[#c89411] text-[15px] font-bold text-[#0f1111] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: "linear-gradient(#f7dfa5,#f0c14b)",
              fontFamily: "inherit",
            }}
          >
            Add to cart
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={!inStock}
            className="h-11 w-full cursor-pointer rounded-[24px] border border-[#e88a00] text-[15px] font-bold text-[#0f1111] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: "linear-gradient(#ffb84d,#ff9900)",
              fontFamily: "inherit",
            }}
          >
            Buy now
          </button>
          <div className="mt-3.5 text-[12px] leading-[1.5] text-[#565959]">
            Sold and fulfilled by <span className="font-bold">Amazon Picks</span> ·
            Easy returns within 7 days
          </div>
        </aside>
      </motion.div>

      {related.length > 0 && (
        <div className="mt-[18px]">
          <ProductRow
            title="Frequently bought together"
            cards={decorate(related)}
          />
        </div>
      )}
    </main>
  );
}
