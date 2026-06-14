import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { listZones } from "./zones.service.js";

/** GET /api/v1/zones */
export const listZonesHandler = asyncHandler(async (_req: Request, res: Response) => {
  const zones = await listZones();
  res.status(200).json(new ApiResponse(200, zones, "Zones fetched"));
});
