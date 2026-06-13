import type { DisplayProduct } from "@/types/product";

export type CategoryGroup = {
  id: string;
  name: string;
  slug: string;
  products: DisplayProduct[];
};

const CATEGORIES = {
  fresh: { id: "cat_fresh", name: "Fresh produce", slug: "fresh" },
  snacks: { id: "cat_snacks", name: "Party snacks", slug: "snacks" },
  pharmacy: { id: "cat_pharmacy", name: "Pharmacy & wellness", slug: "pharmacy" },
  beverages: { id: "cat_beverages", name: "Beverages", slug: "beverages" },
} as const;

export const DUMMY_PRODUCTS: DisplayProduct[] = [
  // Fresh
  {
    id: "p_banana",
    name: "Robusta Bananas",
    description: "Naturally ripened, sweet and creamy.",
    brand: "Fresho",
    price: 49,
    mrp: 65,
    unit: "1 kg",
    imageUrl:
      "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop",
    rating: 4.3,
    reviewCount: 1842,
    popularity: 92,
    tags: ["fruit", "breakfast"],
    vibes: ["casual"],
    categoryId: CATEGORIES.fresh.id,
    etaMinutes: 10,
    stock: 38,
  },
  {
    id: "p_tomato",
    name: "Hybrid Tomatoes",
    description: "Firm, juicy salad tomatoes.",
    brand: "Local Farm",
    price: 32,
    mrp: 45,
    unit: "500 g",
    imageUrl:
      "https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=400&h=400&fit=crop",
    rating: 4.1,
    reviewCount: 624,
    popularity: 78,
    tags: ["vegetable", "staple"],
    vibes: ["casual"],
    categoryId: CATEGORIES.fresh.id,
    etaMinutes: 10,
    stock: 52,
  },
  {
    id: "p_milk",
    name: "Toned Milk",
    description: "Pasteurised, homogenised toned milk.",
    brand: "Amul",
    price: 56,
    mrp: 60,
    unit: "1 L",
    imageUrl:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop",
    rating: 4.6,
    reviewCount: 9120,
    popularity: 99,
    tags: ["dairy", "essential"],
    vibes: ["casual"],
    categoryId: CATEGORIES.fresh.id,
    etaMinutes: 8,
    stock: 124,
  },

  // Snacks
  {
    id: "p_lays",
    name: "Classic Salted Chips",
    description: "Thin, crisp potato chips.",
    brand: "Lay's",
    price: 20,
    mrp: 30,
    unit: "73 g",
    imageUrl:
      "https://images.unsplash.com/photo-1600952841320-db92ec4047ca?w=400&h=400&fit=crop",
    rating: 4.4,
    reviewCount: 3204,
    popularity: 95,
    tags: ["snack", "salty"],
    vibes: ["party", "casual"],
    categoryId: CATEGORIES.snacks.id,
    etaMinutes: 12,
    stock: 84,
  },
  {
    id: "p_nachos",
    name: "Cheese Nachos",
    description: "Crunchy corn nachos with cheese seasoning.",
    brand: "Doritos",
    price: 50,
    mrp: 60,
    unit: "150 g",
    imageUrl:
      "https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400&h=400&fit=crop",
    rating: 4.5,
    reviewCount: 1876,
    popularity: 88,
    tags: ["snack", "cheese"],
    vibes: ["party"],
    categoryId: CATEGORIES.snacks.id,
    etaMinutes: 12,
    stock: 47,
  },
  {
    id: "p_choco",
    name: "Dark Fantasy Choco Fills",
    description: "Soft cookie with molten chocolate centre.",
    brand: "Sunfeast",
    price: 60,
    mrp: 75,
    unit: "75 g",
    imageUrl:
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=400&fit=crop",
    rating: 4.7,
    reviewCount: 5421,
    popularity: 97,
    tags: ["biscuit", "sweet"],
    vibes: ["casual", "party"],
    categoryId: CATEGORIES.snacks.id,
    etaMinutes: 12,
    stock: 60,
  },

  // Pharmacy
  {
    id: "p_paracetamol",
    name: "Paracetamol 500 mg",
    description: "Fever and pain relief tablets.",
    brand: "Crocin",
    price: 30,
    mrp: 35,
    unit: "strip of 15",
    imageUrl:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop",
    rating: 4.7,
    reviewCount: 2410,
    popularity: 96,
    tags: ["medicine", "fever"],
    vibes: ["medical", "emergency"],
    categoryId: CATEGORIES.pharmacy.id,
    etaMinutes: 9,
    stock: 200,
  },
  {
    id: "p_thermometer",
    name: "Digital Thermometer",
    description: "Fast-read digital thermometer with beep alert.",
    brand: "Omron",
    price: 199,
    mrp: 299,
    unit: "1 unit",
    imageUrl:
      "https://images.unsplash.com/photo-1583912267550-d6c2ac3196c0?w=400&h=400&fit=crop",
    rating: 4.5,
    reviewCount: 1140,
    popularity: 84,
    tags: ["device", "diagnostic"],
    vibes: ["medical"],
    categoryId: CATEGORIES.pharmacy.id,
    etaMinutes: 11,
    stock: 18,
  },
  {
    id: "p_ors",
    name: "ORS Electrolyte Powder",
    description: "Oral rehydration salts, orange flavour.",
    brand: "Electral",
    price: 25,
    mrp: 30,
    unit: "pack of 5",
    imageUrl:
      "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400&h=400&fit=crop",
    rating: 4.6,
    reviewCount: 870,
    popularity: 79,
    tags: ["medicine", "hydration"],
    vibes: ["medical", "emergency"],
    categoryId: CATEGORIES.pharmacy.id,
    etaMinutes: 9,
    stock: 64,
  },

  // Beverages
  {
    id: "p_coke",
    name: "Coca-Cola",
    description: "Original taste cola, chilled.",
    brand: "Coca-Cola",
    price: 40,
    mrp: 50,
    unit: "750 ml",
    imageUrl:
      "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop",
    rating: 4.5,
    reviewCount: 6201,
    popularity: 98,
    tags: ["soda", "cold"],
    vibes: ["party", "casual"],
    categoryId: CATEGORIES.beverages.id,
    etaMinutes: 10,
    stock: 130,
  },
  {
    id: "p_redbull",
    name: "Energy Drink",
    description: "Caffeine-taurine energy drink, chilled.",
    brand: "Red Bull",
    price: 125,
    mrp: 135,
    unit: "250 ml",
    imageUrl:
      "https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=400&h=400&fit=crop",
    rating: 4.4,
    reviewCount: 1788,
    popularity: 86,
    tags: ["energy", "cold"],
    vibes: ["party"],
    categoryId: CATEGORIES.beverages.id,
    etaMinutes: 10,
    stock: 42,
  },
  {
    id: "p_water",
    name: "Mineral Water",
    description: "Packaged drinking water, 1 L bottle.",
    brand: "Bisleri",
    price: 18,
    mrp: 20,
    unit: "1 L",
    imageUrl:
      "https://images.unsplash.com/photo-1564419320461-6870880221ad?w=400&h=400&fit=crop",
    rating: 4.6,
    reviewCount: 4012,
    popularity: 94,
    tags: ["water", "essential"],
    vibes: ["casual", "emergency"],
    categoryId: CATEGORIES.beverages.id,
    etaMinutes: 8,
    stock: 220,
  },
];

/** Products grouped by category, in display order. */
export const DUMMY_CATEGORY_GROUPS: CategoryGroup[] = Object.values(CATEGORIES).map(
  (cat) => ({
    ...cat,
    products: DUMMY_PRODUCTS.filter((p) => p.categoryId === cat.id),
  })
);

export function getProductById(id: string): DisplayProduct | undefined {
  return DUMMY_PRODUCTS.find((p) => p.id === id);
}

export function getCategoryGroupBySlug(slug: string): CategoryGroup | undefined {
  return DUMMY_CATEGORY_GROUPS.find((c) => c.slug === slug);
}

/** Other products in the same category, excluding the given product. */
export function getRelatedProducts(product: DisplayProduct, limit = 6): DisplayProduct[] {
  return DUMMY_PRODUCTS.filter(
    (p) => p.categoryId === product.categoryId && p.id !== product.id
  ).slice(0, limit);
}

/** Naive case-insensitive search over name, brand, and tags. */
export function searchProducts(query: string): DisplayProduct[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return DUMMY_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
  );
}
