import "dotenv/config";
import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";

const start = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");

    app.listen(env.PORT, () => {
      console.log(`🚀 Server running at http://localhost:${env.PORT}`);
      console.log(`   Health check: http://localhost:${env.PORT}/api/v1/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

start();
