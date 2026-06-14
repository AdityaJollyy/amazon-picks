import { Router } from "express";
import {
  createOrderHandler,
  getOrderHandler,
  listOrdersHandler,
} from "./orders.controller.js";

const router = Router();

router.post("/", createOrderHandler);
router.get("/", listOrdersHandler);
router.get("/:id", getOrderHandler);

export default router;
