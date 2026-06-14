import { useCallback } from "react";
import { useCart } from "@/features/cart/useCart";
import { useToast } from "@/features/toast/useToast";
import type { DisplayProduct } from "@/types/product";
import type { DecoratedProduct } from "@/features/products/ProductGrid";

/** Decorate raw products with cart-aware callbacks (add/inc/dec) and current qty.
 *  Used by every screen that renders ProductCards so the card itself stays dumb. */
export function useDecoratedProducts() {
  const { items, add, setQty } = useCart();
  const { flash } = useToast();

  const decorate = useCallback(
    (products: DisplayProduct[]): DecoratedProduct[] =>
      products.map((p) => {
        const line = items.find((i) => i.productId === p.id);
        const qty = line?.qty ?? 0;
        return {
          product: p,
          qty,
          onAdd: (product) => {
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
            flash(`Added ${product.name} to cart`);
          },
          onInc: (product) => {
            const current = items.find((i) => i.productId === product.id);
            setQty(product.id, (current?.qty ?? 0) + 1);
          },
          onDec: (product) => {
            const current = items.find((i) => i.productId === product.id);
            setQty(product.id, (current?.qty ?? 1) - 1);
          },
        };
      }),
    [items, add, setQty, flash],
  );

  return decorate;
}
