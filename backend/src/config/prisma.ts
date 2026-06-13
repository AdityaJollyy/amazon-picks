import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
// NOTE: this import path only exists after you run `prisma generate`
// (which `prisma migrate dev` does for you). Red squiggles before then are normal.
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and paste your Neon connection string."
  );
}

// Prisma 7 requires a driver adapter; PrismaPg wraps node-postgres.
const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });
