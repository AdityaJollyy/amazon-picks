import { Router } from "express";
import { aiPing, aiRetrieve } from "./ai.controller.js";

const router = Router();

router.get("/ping", aiPing);
router.get("/retrieve", aiRetrieve);

export default router;
