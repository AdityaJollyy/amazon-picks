import { Router } from "express";
import healthRoutes from "../modules/health/health.routes.js";

const router = Router();

// Mount feature modules here. New modules (products, cart, ai...) plug in below.
router.use("/health", healthRoutes);

export default router;
