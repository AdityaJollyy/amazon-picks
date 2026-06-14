import { Router } from "express";
import { aiPing } from "./ai.controller.js";

const router = Router();

router.get("/ping", aiPing);

export default router;
