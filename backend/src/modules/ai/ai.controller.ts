import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { generateJSON, embed } from "../../config/bedrock.js";

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
