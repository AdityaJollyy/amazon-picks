import { Router } from "express";
import { listZonesHandler } from "./zones.controller.js";

const router = Router();

router.get("/", listZonesHandler);

export default router;
