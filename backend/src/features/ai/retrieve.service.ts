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
 * Strategy:
 *   1. Tokenize the query (drop stopwords + tokens shorter than 3 chars).
 *   2. Score each token against name/brand/tags. A row is a STRONG keyword
 *      hit if every token matches somewhere; a WEAK hit if at least one does.
 *   3. Pull the top-K semantic neighbours of the query embedding.
 *   4. Combine: keep any row that is a keyword hit (regardless of similarity
 *      floor) OR clears the semantic floor. This way "cola 2 litre" keeps
 *      "Coca-Cola 2 L Bottle" even though the literal phrase doesn't appear.
 *   5. Boost the effective similarity for keyword hits so a weakly-similar
 *      but lexically-on-target row outranks a vaguely-similar unrelated row.
 *
 * Ordering: similarity (boosted) first, rankScore as a tiebreaker.
 */

const RETRIEVAL_CONFIG = {
  semanticPoolSize: 80,
  // Cosine similarity floor for SEMANTIC-ONLY matches. Keyword hits bypass
  // this. Tuned for Titan v2 (1024-dim, normalized) on this catalog.
  minSimilarity: 0.25,
  // Floor a STRONG keyword hit gets even if its embedding is unrelated. A
  // strong hit means EVERY token in the query matched the row, so we trust
  // the lexical signal completely. (Weak / single-token hits get NO boost —
  // letting them in is enough; common words like "soft", "light" otherwise
  // promote unrelated products like "Nivea Soft Light Moisturizer".)
  strongKeywordBoost: 0.85,
  defaultLimit: 20,
  maxLimit: 50,
};

// Common words that add nothing to lexical match. Anything in here is dropped
// before tokenization. Two groups:
//   - generic filler ("the", "for", "need")
//   - units/sizes ("litre", "kilo", "pack") — the catalog stores these in
//     `unit`, NOT `name`, so matching on them never hits and would only
//     prevent strong-keyword boosting for queries like "cola 2 litre".
const STOPWORDS = new Set([
  "the", "a", "an", "of", "for", "and", "or", "with", "to", "in", "on",
  "by", "at", "from", "is", "are", "be", "some", "any", "my", "our",
  "please", "need", "want", "buy", "get",
  // pack / size words
  "pack", "packs", "piece", "pieces", "pcs", "unit", "units", "bottle",
  "bottles", "can", "cans", "tin", "tins", "box", "boxes", "jar", "jars",
  "tub", "tubs", "tube", "tubes", "sachet", "sachets", "strip", "strips",
  // measurement words
  "litre", "litres", "liter", "liters", "ltr", "ltrs",
  "gram", "grams", "gms", "gm",
  "kilo", "kilos", "kilogram", "kilograms",
  "small", "medium", "large", "big", "extra",
]);

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

const toVectorLiteral = (vec: number[]): string => `[${vec.join(",")}]`;

/**
 * Split a free-form query into useful match tokens. Drops stopwords, very
 * short tokens (1-2 chars usually noise: "2", "kg", "of"), and dedupes.
 * Falls back to the trimmed phrase as a single token if nothing survives.
 */
const tokenize = (query: string): string[] => {
  const raw = query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const tokens: string[] = [];
  for (const t of raw) {
    if (t.length < 3) continue;
    if (STOPWORDS.has(t)) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    tokens.push(t);
  }
  if (tokens.length === 0 && query.trim()) {
    tokens.push(query.trim().toLowerCase());
  }
  return tokens;
};

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

  const tokens = tokenize(trimmed);
  // Word-boundary regex pattern per token. \y is Postgres' word boundary
  // anchor — without it, "cola" matches "Chocolate" (because c-h-o-CoLa-t-e
  // contains the substring) and floods the candidates with biscuits. The
  // tokenizer already stripped regex specials, so direct concat is safe.
  const tokenPatterns = tokens.map((t) => `\\y${t}\\y`);
  const tokenCount = tokenPatterns.length;

  const {
    semanticPoolSize,
    strongKeywordBoost,
  } = RETRIEVAL_CONFIG;

  // Per-token CASE expression: 1 if the token matches name/brand/tags, else 0.
  // We sum these to count how many tokens hit per row. Word-boundary regex
  // (~*) prevents "cola" from matching "Chocolate" / "Choco-Pie".
  const tokenHitExprs = tokenPatterns.map(
    (pat) => Prisma.sql`(CASE WHEN
      p."name"  ~* ${pat}
      OR p."brand" ~* ${pat}
      OR EXISTS (SELECT 1 FROM unnest(p."tags") t WHERE t ~* ${pat})
    THEN 1 ELSE 0 END)`
  );

  // OR of per-token matches: row qualifies as a keyword candidate if ANY
  // token matches (we filter strong vs weak in the SELECT).
  const tokenAnyMatchExprs = tokenPatterns.map(
    (pat) => Prisma.sql`(
      p."name"  ~* ${pat}
      OR p."brand" ~* ${pat}
      OR EXISTS (SELECT 1 FROM unnest(p."tags") t WHERE t ~* ${pat})
    )`
  );

  const hitsExpr = tokenCount > 0
    ? Prisma.sql`(${Prisma.join(tokenHitExprs, " + ")})`
    : Prisma.sql`0`;
  const anyHitExpr = tokenCount > 0
    ? Prisma.sql`(${Prisma.join(tokenAnyMatchExprs, " OR ")})`
    : Prisma.sql`FALSE`;

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
      SELECT
        p."id",
        1 - (p."embedding" <=> ${vectorLiteral}::vector) AS similarity
      FROM "Product" p
      WHERE p."embedding" IS NOT NULL
      ORDER BY p."embedding" <=> ${vectorLiteral}::vector
      LIMIT ${semanticPoolSize}
    ),
    keyword AS (
      SELECT
        p."id",
        CASE
          WHEN p."embedding" IS NOT NULL
            THEN 1 - (p."embedding" <=> ${vectorLiteral}::vector)
          ELSE 0
        END AS similarity,
        ${hitsExpr} AS hits
      FROM "Product" p
      WHERE ${anyHitExpr}
    ),
    combined AS (
      SELECT
        p."id",
        COALESCE(s.similarity, 0)                AS sem_sim,
        COALESCE(k.hits, 0)                      AS hits,
        (s."id" IS NOT NULL)                     AS has_semantic,
        (k."id" IS NOT NULL)                     AS has_keyword
      FROM "Product" p
      LEFT JOIN semantic s ON s."id" = p."id"
      LEFT JOIN keyword  k ON k."id" = p."id"
      WHERE s."id" IS NOT NULL OR k."id" IS NOT NULL
    ),
    scored AS (
      SELECT
        c."id",
        c.sem_sim,
        c.hits,
        c.has_keyword,
        -- Only STRONG keyword hits (every token matched) get a similarity
        -- floor. Weak hits get nothing — they ride on real semantic score so
        -- common-word matches ("soft" → Nivea, "light" → bulbs) can't crowd
        -- out genuine semantic neighbours.
        GREATEST(
          c.sem_sim,
          CASE
            WHEN ${tokenCount}::int > 0 AND c.hits = ${tokenCount}::int THEN ${strongKeywordBoost}::float
            ELSE 0
          END
        ) AS similarity
      FROM combined c
      -- Drop semantic-only candidates that fall below the floor. Keyword hits
      -- always survive so an off-vector match like "cola" → "Coca-Cola" stays.
      WHERE c.has_keyword OR c.sem_sim >= ${minSim}::float
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
      sc.similarity         AS "similarity",
      p."rankScore"         AS "rankScore",
      sc.similarity         AS "finalScore"
    FROM scored sc
    JOIN "Product"   p  ON p."id"  = sc."id"
    JOIN "Category"  c  ON c."id"  = p."categoryId"
    JOIN "ZoneStock" zs ON zs."productId" = p."id"
    JOIN "Zone"      z  ON z."id"  = zs."zoneId"
    WHERE z."code" = ${zoneCode} AND zs."stock" > 0
    ORDER BY ROUND(sc.similarity::numeric, 2) DESC, p."rankScore" DESC
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
 * ordered by similarity (rankScore as tiebreaker), so the head is the most
 * relevant in-stock SKU. Used by the conversation surface (chat.service.ts)
 * which needs ONE product per line without invoking the LLM a second time.
 */
export const pickBest = (
  candidates: RetrievedCandidate[]
): RetrievedCandidate | null => {
  return candidates[0] ?? null;
};
