/** A category as returned by GET /api/v1/categories. */
export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

/** A delivery zone as returned by GET /api/v1/zones. */
export type Zone = {
  id: string;
  name: string;
  code: string;
  city: string;
  pincode: string;
};

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
  /** Optional populated category — present on list/detail responses. */
  category?: Category;
};

/** A product as shown to a shopper in a specific zone — joins zone-stock fields.
 *  When the list endpoint is called with `zoneCode`, the backend flattens these
 *  on so cards can render stock + ETA without a second hop. */
export type DisplayProduct = Product & {
  /** Zone-specific delivery ETA from ZoneStock. */
  etaMinutes: number;
  /** Zone-specific stock count. 0 means out of stock in this zone. */
  stock: number;
};

/** Per-zone availability row on the product detail response. */
export type ProductAvailability = {
  zone: Zone;
  stock: number;
  etaMinutes: number;
  inStock: boolean;
};

/** Shape of GET /api/v1/products/:id (post-unwrap). */
export type ProductDetail = Product & {
  availability: ProductAvailability[];
};

/** Shape of GET /api/v1/products (post-unwrap). */
export type ProductListResponse = {
  items: (Product & Partial<Pick<DisplayProduct, "stock" | "etaMinutes">>)[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
