import { Router } from "express";
import healthRoutes from "../modules/health/health.routes.js";
import productsRoutes from "../modules/products/products.routes.js";
import categoriesRoutes from "../modules/categories/categories.routes.js";
import zonesRoutes from "../modules/zones/zones.routes.js";

const router = Router();

// Mount feature modules here. New modules (cart, ai...) plug in below.
router.use("/health", healthRoutes);
router.use("/products", productsRoutes);
router.use("/categories", categoriesRoutes);
router.use("/zones", zonesRoutes);

export default router;
