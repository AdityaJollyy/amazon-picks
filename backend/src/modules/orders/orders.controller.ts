import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import {
  createOrder,
  getOrderById,
  listOrders,
} from "./orders.service.js";

/** POST /api/v1/orders */
export const createOrderHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown> | undefined;
    if (!body || typeof body !== "object") {
      throw new ApiError(400, "Missing JSON body");
    }

    if (!Array.isArray(body.items)) {
      throw new ApiError(400, "'items' must be an array");
    }

    const zoneCode = typeof body.zoneCode === "string" ? body.zoneCode : "";
    if (!zoneCode) throw new ApiError(400, "Missing 'zoneCode'");

    const order = await createOrder({
      items: body.items as Array<{ productId: string; quantity: number }>,
      zoneCode,
    });

    res.status(201).json(new ApiResponse(201, order, "Order placed"));
  }
);

/** GET /api/v1/orders */
export const listOrdersHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    const orders = await listOrders();
    res.status(200).json(new ApiResponse(200, orders, "Orders fetched"));
  }
);

/** GET /api/v1/orders/:id */
export const getOrderHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id;
    if (typeof id !== "string" || id.length === 0) {
      throw new ApiError(400, "Invalid order id");
    }
    const order = await getOrderById(id);
    res.status(200).json(new ApiResponse(200, order, "Order fetched"));
  }
);
