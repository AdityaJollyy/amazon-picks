import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { generateJSON, embed } from "../../config/bedrock.js";
import { retrieveCandidates } from "../../features/ai/retrieve.service.js";
import { generateQuickCart } from "../../features/ai/quickCart.service.js";
import { BUDGET_TIERS, type BudgetTier } from "../../features/ai/quickCart.selector.js";

/**
 * GET /api/v1/ai/ping
 * Smoke test: round-trips a generation + embedding call to Bedrock.
 */
export const aiPing = asyncHandler(async (_req: Request, res: Response) => {
  const generate = await generateJSON<{ ok: boolean }>(
    "You are a JSON-only API. Respond with valid JSON and nothing else.",
    'Reply with exactly this JSON: {"ok": true}'
  );

  const vector = await embed("test");

  res.status(200).json(
    new ApiResponse(
      200,
      { generate, embedLength: vector.length },
      "Bedrock reachable"
    )
  );
});

/**
 * GET /api/v1/ai/retrieve?q=...&zoneCode=...&limit=...
 * Debug-only window into the AI retrieval service. NOT for production use —
 * the storefront search bar must keep using the basic ILIKE path.
 */
export const aiRetrieve = asyncHandler(async (req: Request, res: Response) => {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const zoneCode = typeof req.query.zoneCode === "string" ? req.query.zoneCode : "";
  if (!q.trim()) throw new ApiError(400, "Missing 'q'");
  if (!zoneCode) throw new ApiError(400, "Missing 'zoneCode'");

  let limit: number | undefined;
  if (typeof req.query.limit === "string" && req.query.limit !== "") {
    const n = Number(req.query.limit);
    if (!Number.isInteger(n) || n < 1 || n > 50) {
      throw new ApiError(400, "Invalid 'limit': expected integer 1..50");
    }
    limit = n;
  }

  const candidates = await retrieveCandidates(q, zoneCode, { limit });

  res.status(200).json(
    new ApiResponse(
      200,
      { query: q, zoneCode, count: candidates.length, candidates },
      "Candidates retrieved"
    )
  );
});

const isBudgetTier = (v: unknown): v is BudgetTier =>
  typeof v === "string" && (BUDGET_TIERS as readonly string[]).includes(v);

/**
 * POST /api/v1/ai/quick-cart
 * Body: { intent, groupSize, budgetTier, zoneCode }
 */
export const aiQuickCart = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown> | undefined;
  if (!body || typeof body !== "object") {
    throw new ApiError(400, "Missing JSON body");
  }

  const intent = typeof body.intent === "string" ? body.intent : "";
  if (!intent.trim()) throw new ApiError(400, "Missing 'intent'");

  const groupSizeRaw = Number(body.groupSize);
  if (!Number.isFinite(groupSizeRaw) || groupSizeRaw < 1 || groupSizeRaw > 50) {
    throw new ApiError(400, "Invalid 'groupSize': expected 1..50");
  }
  const groupSize = Math.round(groupSizeRaw);

  if (!isBudgetTier(body.budgetTier)) {
    throw new ApiError(400, `Invalid 'budgetTier': expected one of ${BUDGET_TIERS.join(", ")}`);
  }

  const zoneCode = typeof body.zoneCode === "string" ? body.zoneCode : "";
  if (!zoneCode) throw new ApiError(400, "Missing 'zoneCode'");

  const result = await generateQuickCart({
    intent,
    groupSize,
    budgetTier: body.budgetTier,
    zoneCode,
  });

  res.status(200).json(new ApiResponse(200, result, "Quick cart generated"));
});
