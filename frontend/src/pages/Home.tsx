import { ProductRow } from "@/features/products/ProductGrid";
import { DUMMY_CATEGORY_GROUPS } from "@/features/products/dummyProducts";
import { useCart } from "@/features/cart/useCart";
import type { DisplayProduct } from "@/types/product";

export function Home() {
  const { add, openDrawer } = useCart();

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
