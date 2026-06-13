import { DUMMY_PRODUCTS } from "@/features/products/dummyProducts";
import type { DisplayProduct } from "@/types/product";

export type BudgetTier = 0 | 1 | 2;

export const BUDGET_TIERS = [
  { id: 0, label: "Essentials", hint: "Lean & affordable" },
  { id: 1, label: "Standard Mix", hint: "Balanced picks" },
  { id: 2, label: "Premium Picks", hint: "Top shelf" },
] as const;

export type CartOption = {
  id: string;
  title: string;
  tagline: string;
  items: DisplayProduct[];
  total: number;
  totalMrp: number;
};

const TIER_PRICE_MAX = [80, 200, 1_000_000];

const ANGLES: { tag: string; title: string; tagline: string }[] = [
  { tag: "quick",      title: "Quick Pick",       tagline: "Fewest items, fastest checkout" },
  { tag: "crowd",      title: "Crowd Favourite",  tagline: "What people order most" },
  { tag: "complete",   title: "Complete Set",     tagline: "Covers the full occasion" },
  { tag: "fresh",      title: "Fresh Run",        tagline: "Mostly perishables" },
  { tag: "snacks",     title: "Snack Stack",      tagline: "Munchies & treats" },
  { tag: "wellness",   title: "Wellness Kit",     tagline: "Pharmacy & care" },
];

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickN<T>(pool: T[], n: number, rand: () => number): T[] {
  const arr = [...pool];
  const out: T[] = [];
  while (out.length < n && arr.length) {
    const idx = Math.floor(rand() * arr.length);
    out.push(arr.splice(idx, 1)[0]!);
  }
  return out;
}

/** Generate up to 3 dummy curated carts. Deterministic per input combo so the
 *  same inputs produce the same carts; any change re-rolls. */
export function generateQuickCarts(
  intent: string,
  groupSize: number,
  tier: BudgetTier,
): CartOption[] {
  const seed = hashSeed(`${intent.toLowerCase().trim()}|${groupSize}|${tier}`);
  const rand = mulberry32(seed);

  const ceiling = TIER_PRICE_MAX[tier]!;
  const floor = tier === 2 ? 100 : tier === 1 ? 30 : 0;
  const pool = DUMMY_PRODUCTS.filter((p) => p.price >= floor && p.price <= ceiling);

  const angles = pickN(ANGLES, 3, rand);
  const sizeBase = Math.max(4, Math.min(9, 3 + Math.ceil(groupSize / 2)));

  return angles.map((angle, i) => {
    const itemCount = sizeBase + (i - 1);
    const items = pickN(pool, Math.min(itemCount, pool.length), rand);
    const total = items.reduce((n, p) => n + p.price, 0);
    const totalMrp = items.reduce((n, p) => n + p.mrp, 0);
    return {
      id: `${angle.tag}-${seed.toString(36)}-${i}`,
      title: angle.title,
      tagline: angle.tagline,
      items,
      total,
      totalMrp,
    };
  });
}
