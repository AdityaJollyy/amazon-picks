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
 * the requested zone, then order by a blend of semantic similarity and the
 * precomputed rankScore.
 */

const RETRIEVAL_CONFIG = {
  // Final ranking blend. Tune in one place.
  weights: {
    similarity: 0.7, // relevance to the query
    rankScore: 0.3, // intrinsic quality (rating × reviews × popularity)
  },
  // How many semantic neighbours to pull before the rank blend kicks in.
  semanticPoolSize: 50,
  // Cap on rows returned to the caller.
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
  similarity: number; // 0..1 cosine similarity
  rankScore: number; // 0..1 precomputed
  finalScore: number; // 0..1 blended score used for ordering
}

export interface RetrieveOptions {
  limit?: number;
}

/** Escape ILIKE wildcards (% and _) in user input so a stray % doesn't match everything. */
const escapeLike = (s: string): string => s.replace(/[\\%_]/g, (c) => `\\${c}`);

const toVectorLiteral = (vec: number[]): string => `[${vec.join(",")}]`;

/**
 * Returns up to `limit` candidates that are in-stock in the given zone, ordered
 * by a blend of semantic similarity to `query` and product rankScore.
 */
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

  const queryVector = await embed(trimmed);
  const vectorLiteral = toVectorLiteral(queryVector);
  const ilikePattern = `%${escapeLike(trimmed)}%`;

  const { weights, semanticPoolSize } = RETRIEVAL_CONFIG;

  // Single round-trip. The CTEs do the heavy lifting in Postgres:
  //   semantic — top-K nearest by cosine distance
  //   keyword  — anything matching name/brand/tags (similarity computed too)
  //   combined — UNION + dedupe taking max similarity per product
  // Then JOIN with ZoneStock to enforce in-stock-in-this-zone.
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

  // Postgres returns numeric/float as strings under some drivers; coerce defensively.
  return rows.map((r) => ({
    ...r,
    similarity: Number(r.similarity),
    rankScore: Number(r.rankScore),
    finalScore: Number(r.finalScore),
  }));
};
