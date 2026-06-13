import { createContext } from "react";
import type { CartItem } from "./types";

export type CartContextValue = {
  items: CartItem[];
  /** Total quantity across all line items. */
  count: number;
  /** Sum of price * qty in whole rupees. */
  subtotal: number;
  /** Sum of (mrp - price) * qty in whole rupees — total amount saved. */
  totalSavings: number;

  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;

  /** Drawer UI state — kept here so any component can open the cart. */
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

export const CartContext = createContext<CartContextValue | null>(null);
