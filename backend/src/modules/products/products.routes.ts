import { Router } from "express";
import { listProductsHandler, getProductHandler } from "./products.controller.js";

const router = Router();

router.get("/", listProductsHandler);
router.get("/:id", getProductHandler);

export default router;
