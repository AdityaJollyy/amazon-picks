import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { generateJSON, embed } from "../../config/bedrock.js";
import { retrieveCandidates } from "../../features/ai/retrieve.service.js";
import {
  planCart,
  buildCart,
  quickCartOneShot,
  validateClientPlan,
} from "../../features/ai/quickCart.service.js";
import { runChat } from "../../features/ai/chat.service.js";
import { prisma } from "../../config/prisma.js";

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

const requireZone = async (
  zoneCode: string
): Promise<{ name: string; city: string; pincode: string }> => {
  const zone = await prisma.zone.findUnique({
    where: { code: zoneCode },
    select: { name: true, city: true, pincode: true },
  });
  if (!zone) throw new ApiError(404, `Unknown zoneCode: ${zoneCode}`);
  return zone;
};

const parseIntentField = (body: Record<string, unknown>): string => {
  const intent = typeof body.intent === "string" ? body.intent : "";
  if (!intent.trim()) throw new ApiError(400, "Missing 'intent'");
  return intent;
};

const parseGroupSizeField = (body: Record<string, unknown>): number => {
  const raw = Number(body.groupSize);
  if (!Number.isFinite(raw) || raw < 1 || raw > 20) {
    throw new ApiError(400, "Invalid 'groupSize': expected 1..20");
  }
  return Math.round(raw);
};

const parseZoneCodeField = (body: Record<string, unknown>): string => {
  const zoneCode = typeof body.zoneCode === "string" ? body.zoneCode : "";
  if (!zoneCode) throw new ApiError(400, "Missing 'zoneCode'");
  return zoneCode;
};

/**
 * POST /api/v1/ai/quick-cart/plan
 * Body: { intent, groupSize, zoneCode }
 *
 * Step 1 of the Quick Mode flow. The AI reads the customer's intent and
 * returns a plan (vibe + needs list) WITHOUT touching the catalog yet. The
 * frontend shows this plan to the user, who can drop items they don't want
 * before sending it back to /build.
 */
export const aiQuickCartPlan = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown> | undefined;
    if (!body || typeof body !== "object") {
      throw new ApiError(400, "Missing JSON body");
    }

    const intent = parseIntentField(body);
    const groupSize = parseGroupSizeField(body);
    const zoneCode = parseZoneCodeField(body);
    const zone = await requireZone(zoneCode);
    const zoneLabel = `${zone.name}, ${zone.city} ${zone.pincode}`;

    const result = await planCart({ intent, groupSize, zoneCode, zoneLabel });
    res.status(200).json(new ApiResponse(200, result, "Plan generated"));
  }
);

/**
 * POST /api/v1/ai/quick-cart/build
 * Body: { intent, groupSize, zoneCode, plan }
 *
 * Step 2 of the Quick Mode flow. Given a plan (possibly edited by the user),
 * runs hybrid retrieval per need + asks the AI to pick the best in-stock SKU
 * per line. Returns one curated cart plus any dropped lines.
 */
export const aiQuickCartBuild = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown> | undefined;
    if (!body || typeof body !== "object") {
      throw new ApiError(400, "Missing JSON body");
    }

    const intent = parseIntentField(body);
    const groupSize = parseGroupSizeField(body);
    const zoneCode = parseZoneCodeField(body);
    await requireZone(zoneCode);

    const plan = validateClientPlan(body.plan);

    const result = await buildCart({ intent, groupSize, zoneCode, plan });
    res.status(200).json(new ApiResponse(200, result, "Cart built"));
  }
);

/**
 * POST /api/v1/ai/quick-cart
 * Body: { intent, groupSize, zoneCode }
 *
 * One-shot Quick Mode: plan + retrieve + pick in a single call. Returns the
 * built cart directly so the user lands on an editable result without seeing
 * an intermediate plan screen. Use /quick-cart/plan + /quick-cart/build only
 * when the UI needs the two-step flow (legacy / chat surfaces).
 */
export const aiQuickCart = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown> | undefined;
    if (!body || typeof body !== "object") {
      throw new ApiError(400, "Missing JSON body");
    }

    const intent = parseIntentField(body);
    const groupSize = parseGroupSizeField(body);
    const zoneCode = parseZoneCodeField(body);
    const zone = await requireZone(zoneCode);
    const zoneLabel = `${zone.name}, ${zone.city} ${zone.pincode}`;

    const result = await quickCartOneShot({
      intent,
      groupSize,
      zoneCode,
      zoneLabel,
    });
    res.status(200).json(new ApiResponse(200, result, "Cart built"));
  }
);

/**
 * POST /api/v1/ai/chat
 * Body: { messages: [{ role, content }], zoneCode }
 *
 * Stateless: the frontend sends the full message history every turn.
 */
export const aiChat = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown> | undefined;
  if (!body || typeof body !== "object") {
    throw new ApiError(400, "Missing JSON body");
  }

  if (!Array.isArray(body.messages)) {
    throw new ApiError(400, "'messages' must be an array");
  }

  const zoneCode = typeof body.zoneCode === "string" ? body.zoneCode : "";
  if (!zoneCode) throw new ApiError(400, "Missing 'zoneCode'");

  const result = await runChat({
    messages: body.messages as Parameters<typeof runChat>[0]["messages"],
    zoneCode,
  });

  res.status(200).json(new ApiResponse(200, result, "Chat turn"));
});
