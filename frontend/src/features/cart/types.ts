/** A line in the cart — a snapshot of the product at add-time + a qty.
 *  Mirrors the shape of OrderItem in the backend (name + price are frozen). */
export type CartItem = {
  productId: string;
  name: string;
  brand: string;
  unit: string;
  imageUrl: string;
  /** Price in whole rupees, snapshot at add-time. */
  price: number;
  /** MRP in whole rupees, snapshot at add-time. */
  mrp: number;
  /** Snapshot of the zone-specific ETA at add-time. */
  etaMinutes: number;
  qty: number;
};

export type CartState = {
  items: CartItem[];
};

export type CartAction =
  | { type: "ADD"; item: Omit<CartItem, "qty">; qty?: number }
  | { type: "REMOVE"; productId: string }
  | { type: "SET_QTY"; productId: string; qty: number }
  | { type: "CLEAR" };
