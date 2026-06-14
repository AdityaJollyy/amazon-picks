import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";
import { embed } from "../config/bedrock.js";

/**
 * Backfills Product.embedding with Titan v2 vectors.
 *
 * Run manually:  npm run embed
 * Re-run after reseeding the DB. Idempotent — already-embedded rows are skipped
 * unless --all is passed.
 */

type ProductRow = {
  id: string;
  name: string;
  brand: string;
  description: string;
  tags: string[];
  category: string;
};

const BATCH_SIZE = 4; // Titan v2 throttles aggressively; keep concurrency low
const BATCH_PAUSE_MS = 250; // gentle pacing between batches as a backstop

const buildText = (p: ProductRow): string => {
  const tagPart = p.tags.length ? ` ${p.tags.join(" ")}` : "";
  // Description gives the embedder real vocabulary to match niche queries
  // ("paracetamol", "fever", "lactose-free") that aren't in the name/brand/tags.
  return `${p.name} ${p.brand} ${p.category}${tagPart}. ${p.description}`;
};

const toVectorLiteral = (vec: number[]): string => `[${vec.join(",")}]`;

const fetchPending = async (force: boolean): Promise<ProductRow[]> => {
  if (force) {
    const rows = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        brand: true,
        description: true,
        tags: true,
        category: { select: { name: true } },
      },
    });
    return rows.map((r) => ({ ...r, category: r.category.name }));
  }

  // Prisma can't filter on Unsupported columns, so use raw SQL for the WHERE.
  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      brand: string;
      description: string;
      tags: string[];
      category: string;
    }>
  >(Prisma.sql`
    SELECT p."id", p."name", p."brand", p."description", p."tags", c."name" AS category
    FROM "Product" p
    JOIN "Category" c ON c."id" = p."categoryId"
    WHERE p."embedding" IS NULL
  `);
  return rows;
};

const embedOne = async (p: ProductRow): Promise<void> => {
  const vector = await embed(buildText(p));
  await prisma.$executeRaw`
    UPDATE "Product"
    SET "embedding" = ${toVectorLiteral(vector)}::vector
    WHERE "id" = ${p.id}
  `;
};

const main = async () => {
  const force = process.argv.includes("--all");
  const products = await fetchPending(force);

  if (products.length === 0) {
    console.log("✅ Nothing to embed — all products already have embeddings.");
    return;
  }

  console.log(
    `🔄 Embedding ${products.length} product(s) in batches of ${BATCH_SIZE}${force ? " (forced)" : ""}…`
  );

  let done = 0;
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(embedOne));
    done += batch.length;
    console.log(`  ${done}/${products.length}`);
    if (i + BATCH_SIZE < products.length) {
      await new Promise((r) => setTimeout(r, BATCH_PAUSE_MS));
    }
  }

  console.log("✅ Embeddings written.");
};

main()
  .catch((err) => {
    console.error("❌ Embedding failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
