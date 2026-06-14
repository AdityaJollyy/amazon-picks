import * as path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import type * as XLSXTypes from "xlsx";
import { prisma } from "../src/config/prisma.js";

// xlsx is CJS-only and its node-fs `readFile`/`utils.sheet_to_json` are not
// exposed through an ESM `import * as` namespace, so load it via createRequire.
const require = createRequire(import.meta.url);
const XLSX = require("xlsx") as typeof XLSXTypes;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// xlsx is at the repo root (D:/amazon-picks/zepto dataset.xlsx).
const DATASET_PATH = path.resolve(__dirname, "../../zepto dataset.xlsx");

type Status =
  | "PLACED"
  | "PACKED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

type ZeptoRow = {
  Image?: string | null;
  Name?: string | null;
  Price?: number | null;
  "Original Price"?: number | null;
  Ratings?: number | null;
  Review?: number | null;
  Quantity?: string | null;
  Status?: string | null;
  "Sub-Category"?: string | null;
  Category?: string | null;
};

type CategorySpec = {
  name: string;
  slug: string;
  icon: string;
  tags: string[];
  vibes: string[];
};

/* -------------------------------------------------------------------------- */
/*  Category metadata — slug, icon, tags, and vibe mapping                    */
/*  Vibes drive the vibe-reactive UI (medical | party | emergency | casual).  */
/* -------------------------------------------------------------------------- */

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const CATEGORY_META: Record<
  string,
  { icon: string; tags: string[]; vibes: string[] }
> = {
  "Atta, Rice, Oil & Dals": {
    icon: "🌾",
    tags: ["staples", "kitchen", "groceries"],
    vibes: ["casual"],
  },
  "Dairy, Bread & Eggs": {
    icon: "🥛",
    tags: ["dairy", "fresh", "daily"],
    vibes: ["casual", "emergency"],
  },
  "Fruits & Vegetables": {
    icon: "🥦",
    tags: ["fresh", "produce", "daily"],
    vibes: ["casual"],
  },
  "Cold Drinks & Juices": {
    icon: "🥤",
    tags: ["beverages", "chilled"],
    vibes: ["party", "casual"],
  },
  Munchies: {
    icon: "🍿",
    tags: ["snacks", "chips", "munchies"],
    vibes: ["party", "casual"],
  },
  Biscuits: {
    icon: "🍪",
    tags: ["biscuits", "snacks", "tea-time"],
    vibes: ["casual"],
  },
  "Sweet Cravings": {
    icon: "🍫",
    tags: ["chocolates", "sweets", "desserts"],
    vibes: ["party", "casual"],
  },
  "Frozen Food & Ice Creams": {
    icon: "🍦",
    tags: ["frozen", "ice-cream", "desserts"],
    vibes: ["party", "casual"],
  },
  "Health & Baby Care": {
    icon: "💊",
    tags: ["pharmacy", "health", "wellness"],
    vibes: ["medical", "emergency"],
  },
  "Baby Food": {
    icon: "🍼",
    tags: ["baby", "infant", "care"],
    vibes: ["casual", "emergency"],
  },
  "Hygiene & Grooming": {
    icon: "🧴",
    tags: ["hygiene", "grooming", "personal-care"],
    vibes: ["casual", "emergency"],
  },
  "Bath & Body": {
    icon: "🛁",
    tags: ["bath", "body", "personal-care"],
    vibes: ["casual"],
  },
  "Makeup & Beauty": {
    icon: "💄",
    tags: ["makeup", "beauty", "cosmetics"],
    vibes: ["casual"],
  },
  "Cleaning Essentials": {
    icon: "🧹",
    tags: ["cleaning", "household"],
    vibes: ["casual"],
  },
  "Home Needs": {
    icon: "🏠",
    tags: ["home", "kitchen", "household"],
    vibes: ["casual"],
  },
  "Electricals & Accessories": {
    icon: "🔌",
    tags: ["electrical", "accessories"],
    vibes: ["casual"],
  },
  "Tea, Coffee & More": {
    icon: "☕",
    tags: ["tea", "coffee", "beverages"],
    vibes: ["casual", "emergency"],
  },
  "Breakfast & Sauces": {
    icon: "🍳",
    tags: ["breakfast", "spreads", "sauces"],
    vibes: ["casual", "emergency"],
  },
  "Masala & Dry Fruits": {
    icon: "🌶️",
    tags: ["spices", "masala", "dry-fruits"],
    vibes: ["casual"],
  },
  "Paan Corner": {
    icon: "🍃",
    tags: ["paan", "mouth-fresheners"],
    vibes: ["casual", "party"],
  },
  "Meats, Fish & Eggs": {
    icon: "🍗",
    tags: ["meat", "fish", "non-veg"],
    vibes: ["casual"],
  },
  "Homegrown Brands": {
    icon: "🇮🇳",
    tags: ["homegrown", "indian-brands"],
    vibes: ["casual"],
  },
};

// Anything in the xlsx that doesn't have explicit metadata gets a sensible
// default so we don't crash on a future column rename.
const DEFAULT_META = {
  icon: "🛒",
  tags: ["general"],
  vibes: ["casual"],
};

const ZONES = [
  // CP is first and is the demo zone — the only one stocked with the full
  // catalog. Other zones still exist so the UI's zone picker has options,
  // but they get a smaller subset (or nothing) so the demo stays focused.
  { name: "Connaught Place", code: "CP", city: "New Delhi", pincode: "110001" },
  { name: "Saket", code: "SKT", city: "New Delhi", pincode: "110017" },
  { name: "Hauz Khas", code: "HKS", city: "New Delhi", pincode: "110016" },
  {
    name: "Dwarka Sector 12",
    code: "DWK",
    city: "New Delhi",
    pincode: "110078",
  },
  {
    name: "Rohini Sector 7",
    code: "RHN",
    city: "New Delhi",
    pincode: "110085",
  },
];

const DEFAULT_ZONE_CODE = "CP";

// How many top-rated products to keep per category. The full xlsx has ~12k
// rows after dedupe — capping per category keeps the catalog meaty (~2k
// products) without making `npm run embed` take forever.
const PRODUCTS_PER_CATEGORY = 100;

/* -------------------------------------------------------------------------- */
/*  Dataset loader                                                            */
/* -------------------------------------------------------------------------- */

const inferBrand = (name: string): string => {
  // Zepto names look like "Aashirvaad Atta - Superior MP Whole Wheat..."
  // The first 1-2 words before " - ", " | " or "," are usually the brand.
  const cleaned = name.trim();
  const cutoff = cleaned.search(/\s[-|,]\s/);
  const head = cutoff > 0 ? cleaned.slice(0, cutoff) : cleaned;
  const words = head.split(/\s+/).filter(Boolean);
  const brand = words.slice(0, 2).join(" ");
  return brand || "Generic";
};

const buildDescription = (
  name: string,
  brand: string,
  unit: string,
  category: string,
  subCategory: string
): string => {
  const u = unit ? ` (${unit})` : "";
  return `${name}${u}. ${brand} · ${subCategory} from the ${category} aisle. Delivered in minutes from your nearest Connaught Place store.`;
};

type ParsedProduct = {
  name: string;
  brand: string;
  description: string;
  price: number;
  mrp: number;
  unit: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  popularity: number;
  tags: string[];
  vibes: string[];
  categoryName: string;
};

const loadZeptoProducts = (): {
  products: ParsedProduct[];
  categories: CategorySpec[];
} => {
  const wb = XLSX.readFile(DATASET_PATH);
  const sheets = wb.SheetNames.map((n) => wb.Sheets[n]).filter(
    (s): s is XLSXTypes.WorkSheet => Boolean(s)
  );
  const allRows: ZeptoRow[] = sheets.flatMap((s) =>
    XLSX.utils.sheet_to_json<ZeptoRow>(s, { defval: null })
  );

  // Filter to in-stock rows with the fields we need.
  const usable = allRows.filter((r) => {
    if (r.Status !== "Available") return false;
    if (!r.Name || typeof r.Name !== "string") return false;
    const price = Number(r.Price);
    if (!Number.isFinite(price) || price <= 0) return false;
    if (!r.Category) return false;
    return true;
  });

  // Dedupe by lowercase name; when a name appears in both sheets, keep the
  // cheaper variant.
  const byName = new Map<string, ZeptoRow>();
  for (const r of usable) {
    const key = (r.Name as string).trim().toLowerCase();
    const existing = byName.get(key);
    if (!existing || Number(r.Price) < Number(existing.Price)) {
      byName.set(key, r);
    }
  }

  // Group by category, then keep the top N by review count (with rating as a
  // tiebreaker) so popular items always survive the cap.
  const byCategory = new Map<string, ZeptoRow[]>();
  for (const r of byName.values()) {
    const cat = (r.Category as string).trim();
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(r);
  }

  const products: ParsedProduct[] = [];
  const categories: CategorySpec[] = [];

  for (const [catName, rows] of byCategory) {
    rows.sort((a, b) => {
      const aReview = Number(a.Review ?? 0);
      const bReview = Number(b.Review ?? 0);
      if (bReview !== aReview) return bReview - aReview;
      const aRating = Number(a.Ratings ?? 0);
      const bRating = Number(b.Ratings ?? 0);
      return bRating - aRating;
    });
    const trimmed = rows.slice(0, PRODUCTS_PER_CATEGORY);

    const meta = CATEGORY_META[catName] ?? DEFAULT_META;
    categories.push({
      name: catName,
      slug: slugify(catName),
      icon: meta.icon,
      tags: meta.tags,
      vibes: meta.vibes,
    });

    for (const r of trimmed) {
      const name = (r.Name as string).trim();
      const price = Math.max(1, Math.round(Number(r.Price)));
      const mrpRaw = Number(r["Original Price"] ?? 0);
      const mrp = mrpRaw > price ? Math.round(mrpRaw) : price;
      const unit = (r.Quantity ?? "").toString().trim();
      const subCategory = (r["Sub-Category"] ?? "").toString().trim();
      const ratingRaw = Number(r.Ratings ?? 0);
      const rating = ratingRaw > 0 ? Math.min(5, ratingRaw) : 4.0;
      const reviewCount = Math.max(0, Math.round(Number(r.Review ?? 0)));
      const brand = inferBrand(name);
      const subTag = subCategory ? [slugify(subCategory)] : [];

      products.push({
        name,
        brand,
        description: buildDescription(name, brand, unit, catName, subCategory),
        price,
        mrp,
        unit: unit || "1 unit",
        imageUrl: (r.Image ?? "").toString().trim(),
        rating: Number(rating.toFixed(1)),
        reviewCount,
        // Popularity proxied by review count — caps at 1000 to keep the
        // ranker's normalization stable. Replace with order-derived counts
        // later for real signal.
        popularity: Math.min(1000, Math.round(reviewCount / 10)),
        tags: [...meta.tags, ...subTag],
        vibes: meta.vibes,
        categoryName: catName,
      });
    }
  }

  return { products, categories };
};

/* -------------------------------------------------------------------------- */
/*  Order history — opportunistic so it survives dataset shifts               */
/* -------------------------------------------------------------------------- */

type OrderSpec = {
  daysAgo: number;
  status: Status;
  /** Each line picks the first product whose name OR sub-category matches. */
  picks: { match: RegExp; qty: number }[];
};

const ORDER_HISTORY: OrderSpec[] = [
  {
    daysAgo: 56,
    status: "DELIVERED",
    picks: [
      { match: /\bmilk\b/i, qty: 2 },
      { match: /\bbread\b/i, qty: 1 },
      { match: /\beggs?\b/i, qty: 1 },
      { match: /\b(banana|apple)\b/i, qty: 1 },
      { match: /\b(noodles|maggi)\b/i, qty: 2 },
    ],
  },
  {
    daysAgo: 49,
    status: "DELIVERED",
    picks: [
      { match: /\bmilk\b/i, qty: 2 },
      { match: /\bbread\b/i, qty: 1 },
      { match: /\b(tomato|onion|potato)\b/i, qty: 2 },
    ],
  },
  {
    daysAgo: 42,
    status: "DELIVERED",
    picks: [
      { match: /\bmilk\b/i, qty: 2 },
      { match: /\beggs?\b/i, qty: 1 },
      { match: /\b(chips|lay'?s|kurkure|bingo|munchies)\b/i, qty: 2 },
      { match: /\b(coca[- ]?cola|pepsi|sprite|thums)\b/i, qty: 1 },
    ],
  },
  {
    daysAgo: 35,
    status: "DELIVERED",
    picks: [
      { match: /\bmilk\b/i, qty: 2 },
      { match: /\bbread\b/i, qty: 1 },
      { match: /\b(detergent|surf|ariel)\b/i, qty: 1 },
      { match: /\b(toothpaste|colgate|sensodyne)\b/i, qty: 1 },
    ],
  },
  {
    daysAgo: 28,
    status: "DELIVERED",
    picks: [
      { match: /\bmilk\b/i, qty: 2 },
      { match: /\b(banana|apple)\b/i, qty: 1 },
      { match: /\b(handwash|dettol|lifebuoy)\b/i, qty: 1 },
      { match: /\b(shampoo|body[ -]?wash)\b/i, qty: 1 },
    ],
  },
  {
    daysAgo: 21,
    status: "DELIVERED",
    picks: [
      { match: /\bmilk\b/i, qty: 2 },
      { match: /\bbread\b/i, qty: 1 },
      { match: /\beggs?\b/i, qty: 1 },
      { match: /\b(biscuit|cookie|parle|britannia good day)\b/i, qty: 2 },
      { match: /\b(coca[- ]?cola|pepsi|sprite)\b/i, qty: 1 },
    ],
  },
  {
    daysAgo: 10,
    status: "DELIVERED",
    picks: [
      { match: /\bmilk\b/i, qty: 2 },
      { match: /\b(noodles|maggi)\b/i, qty: 2 },
      { match: /\b(paracetamol|crocin|dolo)\b/i, qty: 1 },
      { match: /\b(vicks|cough|throat)\b/i, qty: 1 },
    ],
  },
  {
    daysAgo: 2,
    status: "OUT_FOR_DELIVERY",
    picks: [
      { match: /\bmilk\b/i, qty: 2 },
      { match: /\bbread\b/i, qty: 1 },
      { match: /\beggs?\b/i, qty: 1 },
      { match: /\b(coriander|spinach|palak|methi)\b/i, qty: 1 },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Seed                                                                      */
/* -------------------------------------------------------------------------- */

async function main() {
  console.log("🌱 Seeding database from Zepto dataset...\n");
  console.log(`📂 Dataset: ${DATASET_PATH}\n`);

  // 1. Clean slate (order matters because of foreign keys)
  await prisma.restockState.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.zoneStock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.zone.deleteMany();
  console.log("🧹 Cleared existing data");

  // 2. Zones
  const zones = await prisma.zone.createManyAndReturn({ data: ZONES });
  const defaultZone = zones.find((z) => z.code === DEFAULT_ZONE_CODE);
  if (!defaultZone) throw new Error(`Default zone ${DEFAULT_ZONE_CODE} missing`);
  console.log(`📍 Created ${zones.length} zones (default: ${defaultZone.code})`);

  // 3. Load Zepto rows -> categories + products
  const { products: parsedProducts, categories: parsedCategories } =
    loadZeptoProducts();
  console.log(
    `📊 Loaded ${parsedProducts.length} products across ${parsedCategories.length} categories from xlsx`
  );

  // 4. Categories
  const categories = await prisma.category.createManyAndReturn({
    data: parsedCategories.map((c) => ({
      name: c.name,
      slug: c.slug,
      icon: c.icon,
    })),
  });
  const categoryIdByName = Object.fromEntries(
    categories.map((c) => [c.name, c.id])
  );
  console.log(`🗂️  Created ${categories.length} categories`);

  // 5. Products
  const productData = parsedProducts.map((p) => ({
    name: p.name,
    description: p.description,
    brand: p.brand,
    price: p.price,
    mrp: p.mrp,
    unit: p.unit,
    imageUrl: p.imageUrl,
    rating: p.rating,
    reviewCount: p.reviewCount,
    popularity: p.popularity,
    tags: p.tags,
    vibes: p.vibes,
    categoryId: categoryIdByName[p.categoryName]!,
  }));

  // createMany returns a count, not rows — use createManyAndReturn for ids.
  // For very large inserts (thousands of rows), batch to avoid Postgres'
  // parameter-limit error.
  const PRODUCT_BATCH = 500;
  const products: { id: string; name: string }[] = [];
  for (let i = 0; i < productData.length; i += PRODUCT_BATCH) {
    const batch = productData.slice(i, i + PRODUCT_BATCH);
    const inserted = await prisma.product.createManyAndReturn({
      data: batch,
      select: { id: true, name: true },
    });
    products.push(...inserted);
  }
  console.log(`🛒 Created ${products.length} products`);

  // 6. Zone stock — MVP demo: every product lives only in CP. Other zones
  //    exist so the picker still has options, but they have no stock. This
  //    keeps the AI cart engine deterministic during the hackathon demo.
  const stockData = products.map((p) => ({
    productId: p.id,
    zoneId: defaultZone.id,
    stock: randInt(20, 80),
    etaMinutes: randInt(8, 16),
  }));

  // Batched insert again — this can be tens of thousands of rows.
  const STOCK_BATCH = 1000;
  for (let i = 0; i < stockData.length; i += STOCK_BATCH) {
    await prisma.zoneStock.createMany({
      data: stockData.slice(i, i + STOCK_BATCH),
    });
  }
  console.log(`📦 Created ${stockData.length} zone-stock entries`);

  // 7. The demo user
  const user = await prisma.user.create({
    data: {
      name: "Aarav Sharma",
      email: "aarav@example.com",
      phone: "+91 98100 12345",
      defaultZoneId: defaultZone.id,
    },
  });
  console.log(`👤 Created user: ${user.name}`);

  // 8. Order history — opportunistic regex-based picks. If a regex matches no
  //    product (because the dataset doesn't have that SKU), we silently skip
  //    that line. Orders with zero matches are skipped entirely.
  const findByRegex = (rx: RegExp): { id: string; name: string } | null =>
    products.find((p) => rx.test(p.name)) ?? null;

  let createdOrders = 0;
  for (const spec of ORDER_HISTORY) {
    const items: {
      productId: string;
      name: string;
      price: number;
      quantity: number;
    }[] = [];
    const seen = new Set<string>();
    for (const pick of spec.picks) {
      const p = findByRegex(pick.match);
      if (!p || seen.has(p.id)) continue;
      seen.add(p.id);
      const productData = parsedProducts.find((pp) => pp.name === p.name);
      if (!productData) continue;
      items.push({
        productId: p.id,
        name: p.name,
        price: productData.price,
        quantity: pick.qty,
      });
    }
    if (items.length === 0) continue;

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const createdAt = new Date(Date.now() - spec.daysAgo * 24 * 60 * 60 * 1000);
    await prisma.order.create({
      data: {
        userId: user.id,
        zoneId: defaultZone.id,
        status: spec.status,
        total,
        createdAt,
        items: { create: items },
      },
    });
    createdOrders++;
  }
  console.log(
    `🧾 Created ${createdOrders} historical orders (skipped ${
      ORDER_HISTORY.length - createdOrders
    } that had no matches)`
  );

  console.log("\n✅ Seed complete!");
  console.log(
    `   Demo zone: ${defaultZone.name} (${defaultZone.code} · ${defaultZone.pincode}) — fully stocked.`
  );
  console.log(
    `   Next: run \`npm run embed -- --all\` then \`npm run rank\` so the AI cart engine works.`
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
