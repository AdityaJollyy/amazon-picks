import { Router } from "express";
import { aiPing, aiRetrieve, aiQuickCart, aiChat } from "./ai.controller.js";

const router = Router();

router.get("/ping", aiPing);
router.get("/retrieve", aiRetrieve);
router.post("/quick-cart", aiQuickCart);
router.post("/chat", aiChat);

export default router;
