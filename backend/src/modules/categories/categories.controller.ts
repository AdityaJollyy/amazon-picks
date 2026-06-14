import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { listCategories } from "./categories.service.js";

/** GET /api/v1/categories */
export const listCategoriesHandler = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await listCategories();
  res.status(200).json(new ApiResponse(200, categories, "Categories fetched"));
});
