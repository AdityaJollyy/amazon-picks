import "dotenv/config";

export const env = {
  PORT: Number(process.env.PORT) || 5000,
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  NODE_ENV: process.env.NODE_ENV ?? "development",
  BEDROCK_REGION: process.env.BEDROCK_REGION ?? "us-east-1",
  BEDROCK_MODEL_ID: process.env.BEDROCK_MODEL_ID ?? "",
  BEDROCK_EMBED_MODEL_ID: process.env.BEDROCK_EMBED_MODEL_ID ?? "",
};
