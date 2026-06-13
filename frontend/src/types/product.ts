/** Mirror of the backend Product model (see backend/prisma/schema.prisma). */
export type Product = {
  id: string;
  name: string;
  description: string;
  brand: string;
  /** Selling price in whole rupees. */
  price: number;
  /** Original (struck-through) price in whole rupees. */
  mrp: number;
  /** e.g. "500 g", "1 L", "pack of 6". */
  unit: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  popularity: number;
  tags: string[];
  vibes: string[];
  categoryId: string;
};

/** A product as shown to a shopper in a specific zone — joins zone-stock fields. */
export type DisplayProduct = Product & {
  /** Zone-specific delivery ETA from ZoneStock. */
  etaMinutes: number;
  /** Zone-specific stock count. 0 means out of stock in this zone. */
  stock: number;
};
