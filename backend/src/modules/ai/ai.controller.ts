import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { generateJSON, embed } from "../../config/bedrock.js";
import { retrieveCandidates } from "../../features/ai/retrieve.service.js";

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
