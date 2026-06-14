import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { embed } from "../../config/bedrock.js";

/**
 * Hybrid retrieval for the AI cart engine.
 *
 * INTERNAL — do NOT wire to the storefront header search. The header search
 * stays a plain ILIKE keyword query in modules/products. This file is the
 * "smart" path the AI uses to assemble carts.
 *
 * Strategy: union keyword matches (ILIKE on name/brand/tags) with the top-K
 * semantic neighbours of the query embedding, dedupe, restrict to in-stock in
 * the requested zone, drop semantic-only matches below a similarity floor (so
 * out-of-catalog queries return zero rows instead of irrelevant noise — a
 * lexical hit on name/brand/tags still surfaces), then order by a blend of
 * semantic similarity and the precomputed rankScore.
 */

const RETRIEVAL_CONFIG = {
  weights: {
    similarity: 0.7,
    rankScore: 0.3,
  },
  semanticPoolSize: 50,
  // Cosine similarity floor for semantic-only matches. Tuned for Titan v2
  // (1024-dim, normalized) on this catalog: anything under ~0.35 is typically
  // off-topic. Pass `minSimilarity: 0` to retrieveCandidates to disable.
  minSimilarity: 0.35,
  defaultLimit: 20,
  maxLimit: 50,
};

export interface RetrievedCandidate {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  mrp: number;
  unit: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  vibes: string[];
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  stock: number;
  etaMinutes: number;
  similarity: number;
  rankScore: number;
  finalScore: number;
}

export interface RetrieveOptions {
  limit?: number;
  /** Override the default similarity floor; pass 0 to disable. */
  minSimilarity?: number;
}

const escapeLike = (s: string): string => s.replace(/[\\%_]/g, (c) => `\\${c}`);

const toVectorLiteral = (vec: number[]): string => `[${vec.join(",")}]`;

export const retrieveCandidates = async (
  query: string,
  zoneCode: string,
  opts: RetrieveOptions = {}
): Promise<RetrievedCandidate[]> => {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const limit = Math.min(
    Math.max(1, opts.limit ?? RETRIEVAL_CONFIG.defaultLimit),
    RETRIEVAL_CONFIG.maxLimit
  );

  const minSim = opts.minSimilarity ?? RETRIEVAL_CONFIG.minSimilarity;

  const queryVector = await embed(trimmed);
  const vectorLiteral = toVectorLiteral(queryVector);
  const ilikePattern = `%${escapeLike(trimmed)}%`;

  const { weights, semanticPoolSize } = RETRIEVAL_CONFIG;

  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      brand: string;
      description: string;
      price: number;
      mrp: number;
      unit: string;
      imageUrl: string;
      rating: number;
      reviewCount: number;
      tags: string[];
      vibes: string[];
      categoryId: string;
      categoryName: string;
      categorySlug: string;
      stock: number;
      etaMinutes: number;
      similarity: number;
      rankScore: number;
      finalScore: number;
    }>
  >(Prisma.sql`
    WITH semantic AS (
      SELECT "id", 1 - ("embedding" <=> ${vectorLiteral}::vector) AS similarity
      FROM "Product"
      WHERE "embedding" IS NOT NULL
        AND 1 - ("embedding" <=> ${vectorLiteral}::vector) >= ${minSim}::float
      ORDER BY "embedding" <=> ${vectorLiteral}::vector
      LIMIT ${semanticPoolSize}
    ),
    keyword AS (
      SELECT
        "id",
        CASE
          WHEN "embedding" IS NOT NULL
            THEN 1 - ("embedding" <=> ${vectorLiteral}::vector)
          ELSE 0
        END AS similarity
      FROM "Product"
      WHERE
        "name"  ILIKE ${ilikePattern} ESCAPE '\\'
        OR "brand" ILIKE ${ilikePattern} ESCAPE '\\'
        OR EXISTS (
          SELECT 1 FROM unnest("tags") t WHERE t ILIKE ${ilikePattern} ESCAPE '\\'
        )
    ),
    combined AS (
      SELECT "id", MAX(similarity) AS similarity
      FROM (SELECT * FROM semantic UNION ALL SELECT * FROM keyword) u
      GROUP BY "id"
    )
    SELECT
      p."id",
      p."name",
      p."brand",
      p."description",
      p."price",
      p."mrp",
      p."unit",
      p."imageUrl"          AS "imageUrl",
      p."rating",
      p."reviewCount"       AS "reviewCount",
      p."tags",
      p."vibes",
      c."id"                AS "categoryId",
      c."name"              AS "categoryName",
      c."slug"              AS "categorySlug",
      zs."stock",
      zs."etaMinutes"       AS "etaMinutes",
      comb.similarity       AS "similarity",
      p."rankScore"         AS "rankScore",
      (${weights.similarity}::float * comb.similarity
        + ${weights.rankScore}::float * p."rankScore") AS "finalScore"
    FROM combined comb
    JOIN "Product"   p  ON p."id"  = comb."id"
    JOIN "Category"  c  ON c."id"  = p."categoryId"
    JOIN "ZoneStock" zs ON zs."productId" = p."id"
    JOIN "Zone"      z  ON z."id"  = zs."zoneId"
    WHERE z."code" = ${zoneCode} AND zs."stock" > 0
    ORDER BY "finalScore" DESC
    LIMIT ${limit}
  `);

  return rows.map((r) => ({
    ...r,
    similarity: Number(r.similarity),
    rankScore: Number(r.rankScore),
    finalScore: Number(r.finalScore),
  }));
};

/**
 * Pick the single best candidate from a retrieval result. The list is already
 * ordered by finalScore DESC, so the head is the model-blended best fit.
 * Used by the conversation surface (chat.service.ts) which needs ONE product
 * per line without invoking the LLM a second time.
 */
export const pickBest = (
  candidates: RetrievedCandidate[]
): RetrievedCandidate | null => {
  return candidates[0] ?? null;
};
