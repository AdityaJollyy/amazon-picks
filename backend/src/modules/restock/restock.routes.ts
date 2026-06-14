import { Router } from "express";
import {
  listRestockHandler,
  reorderHandler,
  skipHandler,
  snoozeHandler,
} from "./restock.controller.js";

const router = Router();

router.get("/", listRestockHandler);
router.post("/:productId/reorder", reorderHandler);
router.post("/:productId/skip", skipHandler);
router.post("/:productId/snooze", snoozeHandler);

export default router;
