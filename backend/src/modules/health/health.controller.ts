import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { prisma } from "../../config/prisma.js";

/**
 * GET /api/v1/health
 * Confirms the server is up AND the database is reachable + seeded.
 */
export const healthCheck = asyncHandler(async (_req: Request, res: Response) => {
  const [products, zones, orders] = await Promise.all([
    prisma.product.count(),
    prisma.zone.count(),
    prisma.order.count(),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        status: "ok",
        db: "connected",
        counts: { products, zones, orders },
      },
      "Service healthy"
    )
  );
});
