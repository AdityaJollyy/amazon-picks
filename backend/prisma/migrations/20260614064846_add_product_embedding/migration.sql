-- Enable pgvector for AI semantic retrieval (idempotent).
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "embedding" vector(1024);
