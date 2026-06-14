import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ProductRow } from "@/features/products/ProductGrid";
import { useCart } from "@/features/cart/useCart";
import { useAsync } from "@/hooks/useAsync";
import { useZone } from "@/features/zone/useZone";
import { productsApi } from "@/api/products.api";
import type { DisplayProduct, ProductDetail } from "@/types/product";

function formatRupees(n: number) {
  return n.toLocaleString("en-IN");
}

function StarRating({ rating }: { rating: number }) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  return (
    <span
      className="relative inline-block text-base leading-none"
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

export function ProductPage() {
  const { id = "" } = useParams<{ id: string }>();
  const { add, openDrawer } = useCart();
  const { zone } = useZone();
  const [qty, setQty] = useState(1);

  const productAsync = useAsync(() => productsApi.get(id), { deps: [id] });
  const product = productAsync.data;

  // Pull fresh "related" via the products list filtered to the same category.
  const relatedAsync = useAsync(
    () =>
      productsApi.list({
        categorySlug: product?.category?.slug,
        zoneCode: zone?.code,
        limit: 10,
      }),
    {
      deps: [product?.category?.slug, zone?.code],
      immediate: Boolean(product?.category?.slug),
    },
  );

  if (productAsync.loading) {
    return (
      <div className="mx-auto max-w-[1500px] px-3 py-3 sm:px-4">
        <div className="grid gap-6 rounded-md bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-[minmax(320px,520px)_1fr_280px]">
          <div className="aspect-square w-full animate-pulse rounded-md bg-slate-100" />
          <div className="space-y-3">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
            <div className="h-6 w-3/4 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
            <div className="h-10 w-1/3 animate-pulse rounded bg-slate-100" />
            <div className="h-20 w-full animate-pulse rounded bg-slate-100" />
          </div>
          <div className="h-64 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  if (productAsync.error || !product) {
    return (
      <div className="mx-auto max-w-[1500px] px-3 py-12 sm:px-4">
        <div className="rounded-md bg-white p-10 text-center shadow-sm">
          <div className="text-4xl">🤷</div>
          <div className="mt-2 text-base font-semibold text-slate-800">
            {productAsync.error?.statusCode === 404
              ? "Product not found"
              : "Couldn't load this product"}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {productAsync.error?.message ?? "It may be out of catalogue."}
          </p>
          <Link
            to="/"
            className="mt-4 inline-block rounded-full bg-[var(--color-amazon-yellow)] px-4 py-1.5 text-sm font-semibold text-slate-900 hover:bg-[var(--color-amazon-yellow-hover)]"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return <ProductDetailView product={product} qty={qty} setQty={setQty} onAdd={add} onOpenCart={openDrawer} relatedItems={(relatedAsync.data?.items ?? []) as DisplayProduct[]} zoneName={zone?.name} zoneCode={zone?.code} />;
}

type DetailViewProps = {
  product: ProductDetail;
  qty: number;
  setQty: (v: number | ((q: number) => number)) => void;
  onAdd: ReturnType<typeof useCart>["add"];
  onOpenCart: () => void;
  relatedItems: DisplayProduct[];
  zoneName?: string;
  zoneCode?: string;
};

function ProductDetailView({
  product,
  qty,
  setQty,
  onAdd,
  onOpenCart,
  relatedItems,
  zoneName,
  zoneCode,
}: DetailViewProps) {
  const cat = product.category ?? { name: "All products", slug: "all" };
  const discountPct =
    product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;
  const savings = product.mrp - product.price;

  // Resolve the current zone's stock + ETA from the availability list.
  const myAvail = product.availability.find((a) => a.zone.code === zoneCode);
  const stock = myAvail?.stock ?? 0;
  const etaMinutes = myAvail?.etaMinutes ?? 12;
  const inStock = stock > 0;

  // Other zones with stock — small "also available in" hint.
  const otherStockedZones = product.availability.filter(
    (a) => a.inStock && a.zone.code !== zoneCode,
  );

  const buildCartItem = (p: ProductDetail | DisplayProduct, eta: number) => ({
    productId: p.id,
    name: p.name,
    brand: p.brand,
    unit: p.unit,
    imageUrl: p.imageUrl,
    price: p.price,
    mrp: p.mrp,
    etaMinutes: eta,
  });

  const handleAddThis = () => {
    onAdd(buildCartItem(product, etaMinutes), qty);
    onOpenCart();
  };

  const handleAddRelated = (p: DisplayProduct) => {
    onAdd(buildCartItem(p, p.etaMinutes ?? etaMinutes));
    onOpenCart();
  };

  const related = relatedItems.filter((p) => p.id !== product.id).slice(0, 8);

  return (
    <div className="mx-auto max-w-[1500px] px-3 py-3 sm:px-4">
      {/* Breadcrumb */}
      <nav className="mb-3 text-xs text-slate-600">
        <Link to="/" className="hover:text-[var(--color-amazon-link)] hover:underline">
          Home
        </Link>
        <span className="mx-1.5 text-slate-400">/</span>
        <Link
          to={`/category/${cat.slug}`}
          className="hover:text-[var(--color-amazon-link)] hover:underline"
        >
          {cat.name}
        </Link>
        <span className="mx-1.5 text-slate-400">/</span>
        <span className="line-clamp-1 inline text-slate-800">{product.name}</span>
      </nav>

      {/* Main detail card */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="grid gap-6 rounded-md bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-[minmax(320px,520px)_1fr_280px]"
      >
        {/* Gallery */}
        <div className="flex gap-3">
          <div className="hidden flex-col gap-2 sm:flex">
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                type="button"
                aria-label={`Image ${i + 1}`}
                className={`h-12 w-12 overflow-hidden rounded-sm border ${
                  i === 0
                    ? "border-[var(--color-amazon-link)] ring-1 ring-[var(--color-amazon-link)]"
                    : "border-slate-200 hover:border-[var(--color-amazon-link)]"
                }`}
              >
                <img
                  src={product.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>

          <div className="relative flex-1 overflow-hidden rounded-md bg-slate-50">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="aspect-square w-full object-cover"
            />
            {inStock && (
              <span className="absolute left-3 top-3 rounded-full bg-slate-900/85 px-2.5 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
                {etaMinutes} min delivery
              </span>
            )}
            {discountPct > 0 && (
              <span className="absolute right-3 top-3 rounded-sm bg-[var(--color-amazon-price)] px-2 py-1 text-xs font-bold text-white">
                -{discountPct}%
              </span>
            )}
          </div>
        </div>

        {/* Description column */}
        <div className="flex min-w-0 flex-col">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {product.brand}
          </div>
          <h1 className="mt-1 text-xl font-semibold leading-snug text-slate-900 sm:text-2xl">
            {product.name}
          </h1>

          <Link
            to={`/category/${cat.slug}`}
            className="mt-1 self-start text-xs text-[var(--color-amazon-link)] hover:text-[var(--color-amazon-price)] hover:underline"
          >
            Visit {cat.name}
          </Link>

          <div className="mt-2 flex items-center gap-2">
            <StarRating rating={product.rating} />
            <span className="text-xs text-slate-700">{product.rating.toFixed(1)}</span>
            <span className="text-xs text-[var(--color-amazon-link)]">
              {formatRupees(product.reviewCount)} ratings
            </span>
          </div>

          <hr className="my-3 border-slate-200" />

          <div className="flex items-baseline gap-2">
            {discountPct > 0 && (
              <span className="text-sm font-semibold text-[var(--color-amazon-price)]">
                -{discountPct}%
              </span>
            )}
            <span className="text-sm text-slate-700">₹</span>
            <span className="text-3xl font-bold leading-none text-slate-900">
              {formatRupees(product.price)}
            </span>
          </div>
          {product.mrp > product.price && (
            <div className="mt-1 text-xs text-slate-500">
              M.R.P.: <span className="line-through">₹{formatRupees(product.mrp)}</span>{" "}
              <span className="ml-1 text-emerald-700">
                You save ₹{formatRupees(savings)}
              </span>
            </div>
          )}
          <div className="mt-1 text-xs text-slate-500">Inclusive of all taxes</div>

          <div className="mt-4 text-sm text-slate-700">{product.description}</div>

          <dl className="mt-4 grid grid-cols-[120px_1fr] gap-y-1.5 text-sm">
            <dt className="text-slate-500">Brand</dt>
            <dd className="font-medium text-slate-800">{product.brand}</dd>
            <dt className="text-slate-500">Unit</dt>
            <dd className="font-medium text-slate-800">{product.unit}</dd>
            <dt className="text-slate-500">Category</dt>
            <dd className="font-medium text-slate-800">{cat.name}</dd>
            {product.tags.length > 0 && (
              <>
                <dt className="text-slate-500">Tags</dt>
                <dd className="flex flex-wrap gap-1">
                  {product.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                    >
                      {t}
                    </span>
                  ))}
                </dd>
              </>
            )}
          </dl>
        </div>

        {/* Buy box */}
        <aside className="rounded-md border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-baseline gap-1">
            <span className="text-sm text-slate-700">₹</span>
            <span className="text-2xl font-bold leading-none text-slate-900">
              {formatRupees(product.price)}
            </span>
          </div>
          {inStock ? (
            <div className="mt-1 text-xs text-emerald-700">
              FREE delivery in {etaMinutes} min
            </div>
          ) : (
            <div className="mt-1 text-xs text-[var(--color-amazon-price)]">
              Not available in this zone
            </div>
          )}
          <div className="mt-1 text-xs text-slate-600">
            Delivering to <span className="font-semibold">{zoneName ?? "—"}</span>
          </div>

          <div
            className={`mt-3 text-sm font-bold ${
              inStock ? "text-emerald-700" : "text-[var(--color-amazon-price)]"
            }`}
          >
            {inStock ? "In stock" : "Out of stock"}
          </div>

          {!inStock && otherStockedZones.length > 0 && (
            <div className="mt-2 text-[11px] text-slate-500">
              Available in: {otherStockedZones.map((a) => a.zone.name).join(", ")}
            </div>
          )}

          {/* Qty stepper */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-slate-700">Qty</span>
            <div className="inline-flex items-center overflow-hidden rounded-md border border-slate-300 bg-white">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="h-8 w-8 text-slate-700 hover:bg-slate-100"
              >
                −
              </button>
              <span className="min-w-[32px] px-2 text-center text-sm font-semibold tabular-nums">
                {qty}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQty((q) => q + 1)}
                className="h-8 w-8 text-slate-700 hover:bg-slate-100"
              >
                +
              </button>
            </div>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={handleAddThis}
            disabled={!inStock}
            className="mt-3 w-full rounded-full bg-[var(--color-amazon-yellow)] py-2 text-sm font-bold text-slate-900 hover:bg-[var(--color-amazon-yellow-hover)] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            Add to cart
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={handleAddThis}
            disabled={!inStock}
            className="mt-2 w-full rounded-full bg-[var(--color-amazon-orange)] py-2 text-sm font-bold text-slate-900 hover:brightness-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            Buy now
          </motion.button>

          <p className="mt-3 text-[11px] text-slate-500">
            Sold and fulfilled by Zip · Easy returns within 7 days
          </p>
        </aside>
      </motion.section>

      {/* Related row */}
      {related.length > 0 && (
        <div className="mt-3">
          <ProductRow
            title="Frequently bought together"
            products={related}
            onAdd={handleAddRelated}
          />
        </div>
      )}
    </div>
  );
}
