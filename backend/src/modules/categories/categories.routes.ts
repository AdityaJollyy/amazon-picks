import { Router } from "express";
import { listCategoriesHandler } from "./categories.controller.js";

const router = Router();

router.get("/", listCategoriesHandler);

export default router;
