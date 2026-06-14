import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { listProducts, getProductById } from "./products.service.js";

/** Parse a positive integer query param with a fallback + upper bound. */
const parsePositiveInt = (
  raw: unknown,
  fallback: number,
  { min = 1, max = Number.MAX_SAFE_INTEGER, field }: { min?: number; max?: number; field: string }
): number => {
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new ApiError(400, `Invalid '${field}': expected integer between ${min} and ${max}`);
  }
  return n;
};

/**
 * GET /api/v1/products
 * Query: page, limit, categorySlug, zoneCode, search
 */
export const listProductsHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = parsePositiveInt(req.query.page, 1, { field: "page" });
  const limit = parsePositiveInt(req.query.limit, 20, { max: 100, field: "limit" });

  const categorySlug = typeof req.query.categorySlug === "string" ? req.query.categorySlug : undefined;
  const zoneCode = typeof req.query.zoneCode === "string" ? req.query.zoneCode : undefined;
  const search = typeof req.query.search === "string" ? req.query.search : undefined;

  const result = await listProducts({ page, limit, categorySlug, zoneCode, search });

  res.status(200).json(new ApiResponse(200, result, "Products fetched"));
});

/** GET /api/v1/products/:id */
export const getProductHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;
  if (typeof id !== "string" || id.length === 0) {
    throw new ApiError(400, "Invalid product id");
  }
  const product = await getProductById(id);
  res.status(200).json(new ApiResponse(200, product, "Product fetched"));
});
