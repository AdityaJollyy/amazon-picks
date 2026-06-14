import type { RetrievedCandidate } from "./retrieve.service.js";

/**
 * Per-budget-tier candidate selection.
 *
 * Pure functions: given a sorted candidate list (already ordered by
 * finalScore DESC by retrieveCandidates), pick the single best product for
 * each tier. The retrieval service handles relevance + stock; this file only
 * encodes the price-vs-quality tradeoff.
 */

export const BUDGET_TIERS = ["Essentials", "Standard", "Premium"] as const;
export type BudgetTier = (typeof BUDGET_TIERS)[number];

const SELECTION_CONFIG = {
  // Pull from the top-N retrieval results before applying the tier policy.
  // Larger pool = more variety; smaller pool = stays closer to the query.
  poolSize: 8,
  // Essentials must still be reasonably good — drop anything below this rank.
  minRankScoreForEssentials: 0.45,
  // Standard tier blends rankScore against an inverted normalized price.
  standardWeights: { rankScore: 0.6, priceInverse: 0.4 },
};

/**
 * Pick one candidate per the tier policy.
 * Returns null if no acceptable candidate exists (e.g. nothing in stock).
 */
export const selectForTier = (
  candidates: RetrievedCandidate[],
  tier: BudgetTier
): RetrievedCandidate | null => {
  if (candidates.length === 0) return null;

  const pool = candidates.slice(0, SELECTION_CONFIG.poolSize);

  switch (tier) {
    case "Essentials": {
      // Cheapest among the well-ranked. If everything in the pool is poorly
      // ranked, fall back to the cheapest in pool (better than nothing).
      const acceptable = pool.filter(
        (c) => c.rankScore >= SELECTION_CONFIG.minRankScoreForEssentials
      );
      const source = acceptable.length > 0 ? acceptable : pool;
      return source.reduce((best, c) => (c.price < best.price ? c : best));
    }

    case "Standard": {
      // Balance quality and price. Normalize price by the pool's price range
      // so we're comparing 0..1 against rankScore on the same axis.
      const prices = pool.map((c) => c.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const range = maxPrice - minPrice || 1;
      const { rankScore: wRank, priceInverse: wPrice } =
        SELECTION_CONFIG.standardWeights;

      let best = pool[0]!;
      let bestScore = -Infinity;
      for (const c of pool) {
        const priceInverse = 1 - (c.price - minPrice) / range;
        const score = wRank * c.rankScore + wPrice * priceInverse;
        if (score > bestScore) {
          bestScore = score;
          best = c;
        }
      }
      return best;
    }

    case "Premium": {
      // Highest rankScore. Ties broken by similarity (most relevant first).
      return pool.reduce((best, c) => {
        if (c.rankScore > best.rankScore) return c;
        if (c.rankScore === best.rankScore && c.similarity > best.similarity) return c;
        return best;
      });
    }
  }
};
