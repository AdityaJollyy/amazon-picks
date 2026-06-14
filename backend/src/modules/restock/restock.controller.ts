import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import {
  listReadyToRestock,
  reorder,
  skip,
  snooze,
} from "./restock.service.js";

const requireProductId = (req: Request): string => {
  const id = req.params.productId;
  if (typeof id !== "string" || id.length === 0) {
    throw new ApiError(400, "Invalid productId");
  }
  return id;
};

/** GET /api/v1/restock */
export const listRestockHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    const items = await listReadyToRestock();
    res
      .status(200)
      .json(new ApiResponse(200, items, "Ready-to-restock items fetched"));
  }
);

/** POST /api/v1/restock/:productId/reorder */
export const reorderHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = requireProductId(req);
    const result = await reorder(productId);
    res
      .status(200)
      .json(new ApiResponse(200, result, "Reorder suggestion ready"));
  }
);

/** POST /api/v1/restock/:productId/skip */
export const skipHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = requireProductId(req);
    const state = await skip(productId);
    res
      .status(200)
      .json(new ApiResponse(200, state, "Restock cycle reset"));
  }
);

/** POST /api/v1/restock/:productId/snooze  body: { days } */
export const snoozeHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = requireProductId(req);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const days = Number(body.days);
    const state = await snooze(productId, days);
    res.status(200).json(new ApiResponse(200, state, "Snoozed"));
  }
);
