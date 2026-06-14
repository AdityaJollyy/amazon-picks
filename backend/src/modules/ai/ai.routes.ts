import { Router } from "express";
import {
  aiPing,
  aiRetrieve,
  aiQuickCart,
  aiQuickCartPlan,
  aiQuickCartBuild,
  aiChat,
} from "./ai.controller.js";

const router = Router();

router.get("/ping", aiPing);
router.get("/retrieve", aiRetrieve);
router.post("/quick-cart", aiQuickCart);
router.post("/quick-cart/plan", aiQuickCartPlan);
router.post("/quick-cart/build", aiQuickCartBuild);
router.post("/chat", aiChat);

export default router;
