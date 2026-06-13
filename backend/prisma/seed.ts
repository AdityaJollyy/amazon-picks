import { prisma } from "../src/config/prisma.js";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const rating = () => Number((4 + Math.random() * 0.9).toFixed(1)); // 4.0 - 4.9

const img = (name: string) =>
  `https://placehold.co/400x400/F3F4F6/111827?text=${encodeURIComponent(name)}`;

type Unit = { unit: string; factor: number };
type Base = { name: string; brand: string; mrp: number; units: [Unit, Unit] };
type Cat = {
  name: string;
  slug: string;
  icon: string;
  tags: string[];
  vibes: string[];
  bases: Base[];
};
type Status =
  | "PLACED"
  | "PACKED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

/* -------------------------------------------------------------------------- */
/*  Static data: 10 categories x 10 base products x 2 sizes = 200 products    */
/* -------------------------------------------------------------------------- */

const CATEGORIES: Cat[] = [
  {
    name: "Fruits & Vegetables",
    slug: "fruits-vegetables",
    icon: "🥦",
    tags: ["fresh", "daily"],
    vibes: ["casual"],
    bases: [
      { name: "Banana (Robusta)", brand: "Fresho", mrp: 50, units: [{ unit: "500 g", factor: 1 }, { unit: "1 kg", factor: 2 }] },
      { name: "Apple Shimla", brand: "Fresho", mrp: 90, units: [{ unit: "500 g", factor: 1 }, { unit: "1 kg", factor: 2 }] },
      { name: "Tomato", brand: "Fresho", mrp: 30, units: [{ unit: "500 g", factor: 1 }, { unit: "1 kg", factor: 2 }] },
      { name: "Onion", brand: "Fresho", mrp: 35, units: [{ unit: "500 g", factor: 1 }, { unit: "1 kg", factor: 2 }] },
      { name: "Potato", brand: "Fresho", mrp: 28, units: [{ unit: "500 g", factor: 1 }, { unit: "1 kg", factor: 2 }] },
      { name: "Spinach (Palak)", brand: "Fresho", mrp: 25, units: [{ unit: "250 g", factor: 1 }, { unit: "500 g", factor: 2 }] },
      { name: "Coriander Bunch", brand: "Fresho", mrp: 15, units: [{ unit: "100 g", factor: 1 }, { unit: "250 g", factor: 2 }] },
      { name: "Lemon", brand: "Fresho", mrp: 20, units: [{ unit: "250 g", factor: 1 }, { unit: "500 g", factor: 2 }] },
      { name: "Cucumber", brand: "Fresho", mrp: 22, units: [{ unit: "500 g", factor: 1 }, { unit: "1 kg", factor: 2 }] },
      { name: "Green Chilli", brand: "Fresho", mrp: 18, units: [{ unit: "100 g", factor: 1 }, { unit: "250 g", factor: 2 }] },
    ],
  },
  {
    name: "Dairy, Bread & Eggs",
    slug: "dairy-bread-eggs",
    icon: "🥛",
    tags: ["daily", "breakfast"],
    vibes: ["casual"],
    bases: [
      { name: "Amul Gold Milk", brand: "Amul", mrp: 36, units: [{ unit: "500 ml", factor: 1 }, { unit: "1 L", factor: 2 }] },
      { name: "Mother Dairy Toned Milk", brand: "Mother Dairy", mrp: 27, units: [{ unit: "500 ml", factor: 1 }, { unit: "1 L", factor: 2 }] },
      { name: "Amul Butter", brand: "Amul", mrp: 56, units: [{ unit: "100 g", factor: 1 }, { unit: "500 g", factor: 4.5 }] },
      { name: "Amul Cheese Slices", brand: "Amul", mrp: 130, units: [{ unit: "pack of 5", factor: 1 }, { unit: "pack of 10", factor: 1.9 }] },
      { name: "Britannia Brown Bread", brand: "Britannia", mrp: 45, units: [{ unit: "400 g", factor: 1 }, { unit: "700 g", factor: 1.7 }] },
      { name: "Harvest Gold White Bread", brand: "Harvest Gold", mrp: 40, units: [{ unit: "400 g", factor: 1 }, { unit: "700 g", factor: 1.7 }] },
      { name: "Farm Eggs", brand: "Eggoz", mrp: 72, units: [{ unit: "pack of 6", factor: 1 }, { unit: "pack of 12", factor: 1.9 }] },
      { name: "Amul Masti Dahi", brand: "Amul", mrp: 30, units: [{ unit: "200 g", factor: 1 }, { unit: "400 g", factor: 1.9 }] },
      { name: "Amul Fresh Paneer", brand: "Amul", mrp: 95, units: [{ unit: "200 g", factor: 1 }, { unit: "500 g", factor: 2.3 }] },
      { name: "Nestle Fresh Cream", brand: "Nestle", mrp: 75, units: [{ unit: "250 ml", factor: 1 }, { unit: "1 L", factor: 3.6 }] },
    ],
  },
  {
    name: "Snacks & Munchies",
    slug: "snacks-munchies",
    icon: "🍿",
    tags: ["snacks", "evening"],
    vibes: ["party", "casual"],
    bases: [
      { name: "Lay's Classic Salted", brand: "Lay's", mrp: 20, units: [{ unit: "52 g", factor: 1 }, { unit: "90 g", factor: 1.6 }] },
      { name: "Kurkure Masala Munch", brand: "Kurkure", mrp: 20, units: [{ unit: "75 g", factor: 1 }, { unit: "180 g", factor: 2.2 }] },
      { name: "Haldiram's Aloo Bhujia", brand: "Haldiram's", mrp: 50, units: [{ unit: "200 g", factor: 1 }, { unit: "400 g", factor: 1.9 }] },
      { name: "Bingo Mad Angles", brand: "Bingo", mrp: 20, units: [{ unit: "66 g", factor: 1 }, { unit: "130 g", factor: 1.8 }] },
      { name: "Doritos Nacho Cheese", brand: "Doritos", mrp: 30, units: [{ unit: "70 g", factor: 1 }, { unit: "150 g", factor: 1.9 }] },
      { name: "Uncle Chipps Spicy", brand: "Uncle Chipps", mrp: 20, units: [{ unit: "55 g", factor: 1 }, { unit: "100 g", factor: 1.6 }] },
      { name: "Too Yumm Multigrain Chips", brand: "Too Yumm", mrp: 30, units: [{ unit: "55 g", factor: 1 }, { unit: "100 g", factor: 1.7 }] },
      { name: "Lay's Magic Masala", brand: "Lay's", mrp: 20, units: [{ unit: "52 g", factor: 1 }, { unit: "90 g", factor: 1.6 }] },
      { name: "Pringles Original", brand: "Pringles", mrp: 110, units: [{ unit: "107 g", factor: 1 }, { unit: "165 g", factor: 1.4 }] },
      { name: "Haldiram's Soan Papdi", brand: "Haldiram's", mrp: 95, units: [{ unit: "250 g", factor: 1 }, { unit: "500 g", factor: 1.9 }] },
    ],
  },
  {
    name: "Cold Drinks & Juices",
    slug: "cold-drinks-juices",
    icon: "🥤",
    tags: ["beverages", "chilled"],
    vibes: ["party", "casual"],
    bases: [
      { name: "Coca-Cola", brand: "Coca-Cola", mrp: 40, units: [{ unit: "750 ml", factor: 1 }, { unit: "1.25 L", factor: 1.5 }] },
      { name: "Pepsi", brand: "Pepsi", mrp: 40, units: [{ unit: "750 ml", factor: 1 }, { unit: "1.25 L", factor: 1.5 }] },
      { name: "Sprite", brand: "Sprite", mrp: 40, units: [{ unit: "750 ml", factor: 1 }, { unit: "1.25 L", factor: 1.5 }] },
      { name: "Thums Up", brand: "Thums Up", mrp: 40, units: [{ unit: "750 ml", factor: 1 }, { unit: "1.25 L", factor: 1.5 }] },
      { name: "Real Mixed Fruit Juice", brand: "Real", mrp: 110, units: [{ unit: "1 L", factor: 1 }, { unit: "1.5 L", factor: 1.4 }] },
      { name: "Tropicana Orange", brand: "Tropicana", mrp: 120, units: [{ unit: "1 L", factor: 1 }, { unit: "1.5 L", factor: 1.4 }] },
      { name: "Maaza Mango", brand: "Maaza", mrp: 45, units: [{ unit: "600 ml", factor: 1 }, { unit: "1.2 L", factor: 1.8 }] },
      { name: "Red Bull Energy Drink", brand: "Red Bull", mrp: 125, units: [{ unit: "250 ml", factor: 1 }, { unit: "pack of 4", factor: 3.8 }] },
      { name: "Bisleri Water", brand: "Bisleri", mrp: 20, units: [{ unit: "1 L", factor: 1 }, { unit: "2 L", factor: 1.5 }] },
      { name: "Paper Boat Aamras", brand: "Paper Boat", mrp: 35, units: [{ unit: "250 ml", factor: 1 }, { unit: "600 ml", factor: 2 }] },
    ],
  },
  {
    name: "Pharmacy & Wellness",
    slug: "pharmacy-wellness",
    icon: "💊",
    tags: ["pharmacy", "health"],
    vibes: ["medical", "emergency"],
    bases: [
      { name: "Dolo 650 Tablets", brand: "Micro Labs", mrp: 32, units: [{ unit: "strip of 15", factor: 1 }, { unit: "pack of 3 strips", factor: 2.8 }] },
      { name: "Crocin Advance", brand: "Crocin", mrp: 30, units: [{ unit: "strip of 15", factor: 1 }, { unit: "pack of 3 strips", factor: 2.8 }] },
      { name: "Vicks VapoRub", brand: "Vicks", mrp: 95, units: [{ unit: "25 ml", factor: 1 }, { unit: "50 ml", factor: 1.8 }] },
      { name: "Dettol Antiseptic Liquid", brand: "Dettol", mrp: 99, units: [{ unit: "250 ml", factor: 1 }, { unit: "500 ml", factor: 1.8 }] },
      { name: "Electral ORS Powder", brand: "Electral", mrp: 22, units: [{ unit: "21.5 g", factor: 1 }, { unit: "pack of 5", factor: 4.5 }] },
      { name: "Band-Aid Strips", brand: "Band-Aid", mrp: 45, units: [{ unit: "pack of 10", factor: 1 }, { unit: "pack of 30", factor: 2.6 }] },
      { name: "Digene Antacid Gel", brand: "Digene", mrp: 120, units: [{ unit: "200 ml", factor: 1 }, { unit: "400 ml", factor: 1.8 }] },
      { name: "Volini Pain Relief Spray", brand: "Volini", mrp: 185, units: [{ unit: "55 g", factor: 1 }, { unit: "100 g", factor: 1.7 }] },
      { name: "Cetirizine Tablets", brand: "Cipla", mrp: 18, units: [{ unit: "strip of 10", factor: 1 }, { unit: "pack of 3 strips", factor: 2.7 }] },
      { name: "Hand Sanitizer", brand: "Lifebuoy", mrp: 55, units: [{ unit: "100 ml", factor: 1 }, { unit: "500 ml", factor: 3.5 }] },
    ],
  },
  {
    name: "Cleaning & Household",
    slug: "cleaning-household",
    icon: "🧽",
    tags: ["household", "cleaning"],
    vibes: ["casual"],
    bases: [
      { name: "Surf Excel Detergent", brand: "Surf Excel", mrp: 130, units: [{ unit: "1 kg", factor: 1 }, { unit: "2 kg", factor: 1.9 }] },
      { name: "Vim Dishwash Gel", brand: "Vim", mrp: 99, units: [{ unit: "500 ml", factor: 1 }, { unit: "750 ml", factor: 1.4 }] },
      { name: "Harpic Toilet Cleaner", brand: "Harpic", mrp: 95, units: [{ unit: "500 ml", factor: 1 }, { unit: "1 L", factor: 1.8 }] },
      { name: "Lizol Floor Cleaner", brand: "Lizol", mrp: 99, units: [{ unit: "500 ml", factor: 1 }, { unit: "975 ml", factor: 1.8 }] },
      { name: "Colin Glass Cleaner", brand: "Colin", mrp: 90, units: [{ unit: "500 ml", factor: 1 }, { unit: "1 L", factor: 1.8 }] },
      { name: "Scotch-Brite Scrub Pad", brand: "Scotch-Brite", mrp: 35, units: [{ unit: "pack of 2", factor: 1 }, { unit: "pack of 5", factor: 2.3 }] },
      { name: "Good Knight Refill", brand: "Good Knight", mrp: 80, units: [{ unit: "45 ml", factor: 1 }, { unit: "pack of 2", factor: 1.9 }] },
      { name: "Odonil Air Freshener", brand: "Odonil", mrp: 75, units: [{ unit: "50 g", factor: 1 }, { unit: "pack of 3", factor: 2.7 }] },
      { name: "Garbage Bags", brand: "Presto!", mrp: 99, units: [{ unit: "30 bags", factor: 1 }, { unit: "60 bags", factor: 1.8 }] },
      { name: "Comfort Fabric Conditioner", brand: "Comfort", mrp: 120, units: [{ unit: "400 ml", factor: 1 }, { unit: "860 ml", factor: 1.9 }] },
    ],
  },
  {
    name: "Personal Care",
    slug: "personal-care",
    icon: "🧴",
    tags: ["personal-care"],
    vibes: ["casual"],
    bases: [
      { name: "Colgate Toothpaste", brand: "Colgate", mrp: 99, units: [{ unit: "100 g", factor: 1 }, { unit: "200 g", factor: 1.8 }] },
      { name: "Dove Beauty Bar", brand: "Dove", mrp: 65, units: [{ unit: "100 g", factor: 1 }, { unit: "pack of 3", factor: 2.7 }] },
      { name: "Head & Shoulders Shampoo", brand: "Head & Shoulders", mrp: 180, units: [{ unit: "180 ml", factor: 1 }, { unit: "340 ml", factor: 1.8 }] },
      { name: "Gillette Razor", brand: "Gillette", mrp: 150, units: [{ unit: "single", factor: 1 }, { unit: "pack of 3", factor: 2.6 }] },
      { name: "Nivea Body Lotion", brand: "Nivea", mrp: 199, units: [{ unit: "200 ml", factor: 1 }, { unit: "400 ml", factor: 1.8 }] },
      { name: "Dettol Handwash", brand: "Dettol", mrp: 99, units: [{ unit: "200 ml", factor: 1 }, { unit: "750 ml refill", factor: 1.9 }] },
      { name: "Vaseline Lip Care", brand: "Vaseline", mrp: 75, units: [{ unit: "10 g", factor: 1 }, { unit: "20 g", factor: 1.7 }] },
      { name: "Pampers Diapers", brand: "Pampers", mrp: 399, units: [{ unit: "pack of 22", factor: 1 }, { unit: "pack of 46", factor: 1.9 }] },
      { name: "Whisper Sanitary Pads", brand: "Whisper", mrp: 175, units: [{ unit: "pack of 15", factor: 1 }, { unit: "pack of 30", factor: 1.9 }] },
      { name: "Park Avenue Deodorant", brand: "Park Avenue", mrp: 199, units: [{ unit: "150 ml", factor: 1 }, { unit: "pack of 2", factor: 1.9 }] },
    ],
  },
  {
    name: "Breakfast & Instant Food",
    slug: "breakfast-instant",
    icon: "🍜",
    tags: ["instant", "breakfast"],
    vibes: ["casual", "emergency"],
    bases: [
      { name: "Maggi 2-Minute Noodles", brand: "Nestle", mrp: 14, units: [{ unit: "single", factor: 1 }, { unit: "pack of 8", factor: 7 }] },
      { name: "Kellogg's Corn Flakes", brand: "Kellogg's", mrp: 175, units: [{ unit: "475 g", factor: 1 }, { unit: "875 g", factor: 1.8 }] },
      { name: "Quaker Oats", brand: "Quaker", mrp: 120, units: [{ unit: "400 g", factor: 1 }, { unit: "1 kg", factor: 2.2 }] },
      { name: "MTR Poha", brand: "MTR", mrp: 60, units: [{ unit: "200 g", factor: 1 }, { unit: "500 g", factor: 2.2 }] },
      { name: "Top Ramen Noodles", brand: "Top Ramen", mrp: 14, units: [{ unit: "single", factor: 1 }, { unit: "pack of 6", factor: 5.5 }] },
      { name: "Knorr Soup", brand: "Knorr", mrp: 55, units: [{ unit: "single", factor: 1 }, { unit: "pack of 3", factor: 2.7 }] },
      { name: "Saffola Masala Oats", brand: "Saffola", mrp: 45, units: [{ unit: "40 g", factor: 1 }, { unit: "pack of 6", factor: 5.2 }] },
      { name: "Nutella Hazelnut Spread", brand: "Nutella", mrp: 175, units: [{ unit: "180 g", factor: 1 }, { unit: "350 g", factor: 1.8 }] },
      { name: "Kissan Mixed Fruit Jam", brand: "Kissan", mrp: 95, units: [{ unit: "200 g", factor: 1 }, { unit: "500 g", factor: 2.2 }] },
      { name: "Aashirvaad Atta", brand: "Aashirvaad", mrp: 60, units: [{ unit: "1 kg", factor: 1 }, { unit: "5 kg", factor: 4.6 }] },
    ],
  },
  {
    name: "Party & Celebrations",
    slug: "party-celebrations",
    icon: "🎉",
    tags: ["party", "celebration"],
    vibes: ["party"],
    bases: [
      { name: "Birthday Candles", brand: "Celebr8", mrp: 49, units: [{ unit: "pack of 10", factor: 1 }, { unit: "pack of 24", factor: 2 }] },
      { name: "Paper Plates", brand: "Hotpack", mrp: 60, units: [{ unit: "pack of 25", factor: 1 }, { unit: "pack of 50", factor: 1.8 }] },
      { name: "Party Balloons", brand: "Celebr8", mrp: 99, units: [{ unit: "pack of 50", factor: 1 }, { unit: "pack of 100", factor: 1.8 }] },
      { name: "Cadbury Celebrations Box", brand: "Cadbury", mrp: 175, units: [{ unit: "small box", factor: 1 }, { unit: "large box", factor: 2.4 }] },
      { name: "Pringles Party Pack", brand: "Pringles", mrp: 299, units: [{ unit: "pack of 3", factor: 1 }, { unit: "pack of 6", factor: 1.9 }] },
      { name: "Coca-Cola Party Pack", brand: "Coca-Cola", mrp: 180, units: [{ unit: "pack of 6", factor: 1 }, { unit: "pack of 12", factor: 1.9 }] },
      { name: "Disposable Cups", brand: "Hotpack", mrp: 45, units: [{ unit: "pack of 50", factor: 1 }, { unit: "pack of 100", factor: 1.8 }] },
      { name: "Party Poppers", brand: "Celebr8", mrp: 99, units: [{ unit: "pack of 6", factor: 1 }, { unit: "pack of 12", factor: 1.8 }] },
      { name: "Lay's Party Pack", brand: "Lay's", mrp: 99, units: [{ unit: "pack of 6", factor: 1 }, { unit: "pack of 12", factor: 1.9 }] },
      { name: "Ferrero Rocher Box", brand: "Ferrero Rocher", mrp: 350, units: [{ unit: "16 pcs", factor: 1 }, { unit: "24 pcs", factor: 1.4 }] },
    ],
  },
  {
    name: "Stationery & Essentials",
    slug: "stationery-essentials",
    icon: "✏️",
    tags: ["stationery"],
    vibes: ["casual"],
    bases: [
      { name: "Classmate Notebook", brand: "Classmate", mrp: 60, units: [{ unit: "single", factor: 1 }, { unit: "pack of 6", factor: 5.5 }] },
      { name: "Reynolds Ball Pens", brand: "Reynolds", mrp: 50, units: [{ unit: "pack of 5", factor: 1 }, { unit: "pack of 10", factor: 1.9 }] },
      { name: "Apsara Pencils", brand: "Apsara", mrp: 40, units: [{ unit: "pack of 10", factor: 1 }, { unit: "pack of 20", factor: 1.9 }] },
      { name: "Fevicol Glue", brand: "Fevicol", mrp: 35, units: [{ unit: "50 g", factor: 1 }, { unit: "200 g", factor: 3 }] },
      { name: "Kangaro Stapler", brand: "Kangaro", mrp: 120, units: [{ unit: "single", factor: 1 }, { unit: "with 1000 pins", factor: 1.4 }] },
      { name: "A4 Paper Ream", brand: "JK Copier", mrp: 320, units: [{ unit: "500 sheets", factor: 1 }, { unit: "pack of 2", factor: 1.9 }] },
      { name: "Sticky Notes", brand: "Oddy", mrp: 75, units: [{ unit: "pack of 3", factor: 1 }, { unit: "pack of 6", factor: 1.9 }] },
      { name: "Highlighter Set", brand: "Faber-Castell", mrp: 99, units: [{ unit: "set of 4", factor: 1 }, { unit: "set of 6", factor: 1.4 }] },
      { name: "Scissors", brand: "Cello", mrp: 60, units: [{ unit: "single", factor: 1 }, { unit: "pack of 2", factor: 1.8 }] },
      { name: "Cello Tape", brand: "Cello", mrp: 30, units: [{ unit: "single", factor: 1 }, { unit: "pack of 4", factor: 3.6 }] },
    ],
  },
];

const ZONES = [
  { name: "Saket", code: "SKT", city: "New Delhi", pincode: "110017" },
  { name: "Hauz Khas", code: "HKS", city: "New Delhi", pincode: "110016" },
  { name: "Connaught Place", code: "CP", city: "New Delhi", pincode: "110001" },
  { name: "Dwarka Sector 12", code: "DWK", city: "New Delhi", pincode: "110078" },
  { name: "Rohini Sector 7", code: "RHN", city: "New Delhi", pincode: "110085" },
];

const DEFAULT_ZONE_CODE = "SKT";

/* -------------------------------------------------------------------------- */
/*  Seed                                                                      */
/* -------------------------------------------------------------------------- */

async function main() {
  console.log("🌱 Seeding database...\n");

  // 1. Clean slate (order matters because of foreign keys)
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
  const defaultZone = zones.find((z) => z.code === DEFAULT_ZONE_CODE)!;
  console.log(`📍 Created ${zones.length} zones`);

  // 3. Categories
  const categories = await prisma.category.createManyAndReturn({
    data: CATEGORIES.map((c) => ({
      name: c.name,
      slug: c.slug,
      icon: c.icon,
    })),
  });
  const categoryIdBySlug = Object.fromEntries(
    categories.map((c) => [c.slug, c.id])
  );
  console.log(`🗂️  Created ${categories.length} categories`);

  // 4. Products (10 categories x 10 bases x 2 units = 200)
  const productData = CATEGORIES.flatMap((cat) =>
    cat.bases.flatMap((base) =>
      base.units.map((u) => {
        const mrp = Math.round(base.mrp * u.factor);
        const price = Math.max(5, Math.round(mrp * (0.82 + Math.random() * 0.1)));
        return {
          name: base.name,
          description: `${base.brand} ${base.name} (${u.unit}). Delivered in minutes from your nearest store.`,
          brand: base.brand,
          price,
          mrp,
          unit: u.unit,
          imageUrl: img(base.name),
          rating: rating(),
          reviewCount: randInt(20, 2400),
          popularity: randInt(0, 1000),
          tags: cat.tags,
          vibes: cat.vibes,
          categoryId: categoryIdBySlug[cat.slug],
        };
      })
    )
  );

  const products = await prisma.product.createManyAndReturn({
    data: productData,
  });
  console.log(`🛒 Created ${products.length} products`);

  // 5. Zone stock — every product is in the default zone, plus a random subset
  const otherZones = zones.filter((z) => z.code !== DEFAULT_ZONE_CODE);
  const stockData = products.flatMap((p) => {
    const shuffled = [...otherZones].sort(() => Math.random() - 0.5);
    const extra = shuffled.slice(0, randInt(2, otherZones.length));
    const inZones = [defaultZone, ...extra];
    return inZones.map((z) => ({
      productId: p.id,
      zoneId: z.id,
      // ~10% of entries are out of stock for realism
      stock: Math.random() < 0.1 ? 0 : randInt(5, 60),
      etaMinutes: randInt(8, 20),
    }));
  });
  await prisma.zoneStock.createMany({ data: stockData });
  console.log(`📦 Created ${stockData.length} zone-stock entries`);

  // 6. The demo user
  const user = await prisma.user.create({
    data: {
      name: "Aarav Sharma",
      email: "aarav@example.com",
      phone: "+91 98100 12345",
      defaultZoneId: defaultZone.id,
    },
  });
  console.log(`👤 Created user: ${user.name}`);

  // 7. Order history — weekly cadence so the restock engine sees clear cycles
  const findProduct = (namePart: string) => {
    const p = products.find((x) => x.name.includes(namePart));
    if (!p) throw new Error(`Seed error: no product matches "${namePart}"`);
    return p;
  };

  const orderSpecs: {
    daysAgo: number;
    status: Status;
    items: { part: string; qty: number }[];
  }[] = [
    { daysAgo: 56, status: "DELIVERED", items: [{ part: "Amul Gold Milk", qty: 2 }, { part: "Britannia Brown Bread", qty: 1 }, { part: "Farm Eggs", qty: 1 }, { part: "Banana", qty: 1 }, { part: "Maggi", qty: 1 }] },
    { daysAgo: 49, status: "DELIVERED", items: [{ part: "Amul Gold Milk", qty: 2 }, { part: "Britannia Brown Bread", qty: 1 }, { part: "Tomato", qty: 1 }, { part: "Onion", qty: 1 }] },
    { daysAgo: 42, status: "DELIVERED", items: [{ part: "Amul Gold Milk", qty: 2 }, { part: "Farm Eggs", qty: 1 }, { part: "Lay's Classic Salted", qty: 2 }, { part: "Coca-Cola", qty: 1 }] },
    { daysAgo: 35, status: "DELIVERED", items: [{ part: "Amul Gold Milk", qty: 2 }, { part: "Britannia Brown Bread", qty: 1 }, { part: "Farm Eggs", qty: 1 }, { part: "Surf Excel Detergent", qty: 1 }] },
    { daysAgo: 28, status: "DELIVERED", items: [{ part: "Amul Gold Milk", qty: 2 }, { part: "Banana", qty: 1 }, { part: "Colgate Toothpaste", qty: 1 }, { part: "Dettol Handwash", qty: 1 }] },
    { daysAgo: 21, status: "DELIVERED", items: [{ part: "Amul Gold Milk", qty: 2 }, { part: "Britannia Brown Bread", qty: 1 }, { part: "Farm Eggs", qty: 1 }, { part: "Kurkure", qty: 2 }, { part: "Pepsi", qty: 1 }] },
    { daysAgo: 10, status: "DELIVERED", items: [{ part: "Amul Gold Milk", qty: 2 }, { part: "Maggi", qty: 1 }, { part: "Dolo 650", qty: 1 }, { part: "Vicks VapoRub", qty: 1 }] },
    { daysAgo: 2, status: "OUT_FOR_DELIVERY", items: [{ part: "Amul Gold Milk", qty: 2 }, { part: "Britannia Brown Bread", qty: 1 }, { part: "Farm Eggs", qty: 1 }, { part: "Coriander", qty: 1 }] },
  ];

  for (const spec of orderSpecs) {
    const items = spec.items.map((it) => {
      const p = findProduct(it.part);
      return {
        productId: p.id,
        name: p.name,
        price: p.price,
        quantity: it.qty,
      };
    });
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
  }
  console.log(`🧾 Created ${orderSpecs.length} historical orders`);

  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
