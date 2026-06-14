import { prisma } from "../config/prisma.js";

/**
 * Recomputes Product.rankScore from rating, reviewCount, and popularity.
 *
 * Run manually:  npm run rank
 *
 * NOTE: this is intentionally manual for the prototype. In production this
 * would run as a nightly cron (e.g. via a worker) so rankings stay fresh as
 * new reviews/orders land.
 */

// All ranking weights live here. Tune in one place.
const RANK_CONFIG = {
  weights: {
    rating: 0.5, // quality signal — most important
    reviews: 0.3, // confidence signal — log-scaled below
    popularity: 0.2, // demand signal — raw orders/views
  },
  // Rating is on a 0–5 scale; treat anything below this as "no signal".
  ratingFloor: 0,
  ratingCeil: 5,
};

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

/** Log-scale + normalize so 5 reviews and 5,000 reviews don't collapse to ~the same score. */
const logNormalize = (value: number, max: number): number => {
  if (max <= 0) return 0;
  return Math.log1p(Math.max(0, value)) / Math.log1p(max);
};

const main = async () => {
  const products = await prisma.product.findMany({
    select: { id: true, rating: true, reviewCount: true, popularity: true },
  });

  if (products.length === 0) {
    console.log("Nothing to rank.");
    return;
  }

  const maxReviews = products.reduce((m, p) => Math.max(m, p.reviewCount), 0);
  const maxPopularity = products.reduce((m, p) => Math.max(m, p.popularity), 0);

  console.log(
    `📊 Ranking ${products.length} product(s)  (maxReviews=${maxReviews}, maxPopularity=${maxPopularity})`
  );

  const { weights, ratingFloor, ratingCeil } = RANK_CONFIG;
  const ratingRange = ratingCeil - ratingFloor;
  const now = new Date();

  // One UPDATE per product. 200 rows is trivial; if this grows we batch via $transaction.
  let done = 0;
  for (const p of products) {
    const ratingNorm = clamp01((p.rating - ratingFloor) / ratingRange);
    const reviewsNorm = logNormalize(p.reviewCount, maxReviews);
    const popularityNorm = maxPopularity > 0 ? p.popularity / maxPopularity : 0;

    const rankScore = clamp01(
      weights.rating * ratingNorm +
        weights.reviews * reviewsNorm +
        weights.popularity * popularityNorm
    );

    await prisma.product.update({
      where: { id: p.id },
      data: { rankScore, lastRankedAt: now },
    });
    done++;
  }

  console.log(`✅ Updated rankScore on ${done} product(s).`);

  const top = await prisma.product.findMany({
    orderBy: { rankScore: "desc" },
    take: 5,
    select: { name: true, brand: true, rating: true, reviewCount: true, popularity: true, rankScore: true },
  });
  console.log("Top 5 by rankScore:");
  for (const t of top) {
    console.log(
      `  ${t.rankScore.toFixed(4)}  ${t.name}  (${t.brand}, ${t.rating}★ × ${t.reviewCount}, pop ${t.popularity})`
    );
  }
};

main()
  .catch((err) => {
    console.error("❌ Ranking failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
