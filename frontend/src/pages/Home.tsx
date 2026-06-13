import { ProductRow } from "@/features/products/ProductGrid";
import { DUMMY_CATEGORY_GROUPS } from "@/features/products/dummyProducts";
import type { DisplayProduct } from "@/types/product";

export function Home() {
  const handleAdd = (product: DisplayProduct) => {
    // Wired up later — add to cart store. For now, a console hook.
    console.log("add to cart", product.id);
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-3 px-3 py-3 sm:px-4">
      {DUMMY_CATEGORY_GROUPS.map((cat) => (
        <ProductRow
          key={cat.id}
          title={cat.name}
          seeAllHref={`/category/${cat.slug}`}
          products={cat.products}
          onAdd={handleAdd}
        />
      ))}
    </div>
  );
}
