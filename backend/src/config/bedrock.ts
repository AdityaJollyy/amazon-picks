import {
  BedrockRuntimeClient,
  ConverseCommand,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { env } from "./env.js";
import { ApiError } from "../utils/ApiError.js";

// Adaptive retry + high attempt count handles Bedrock's strict TPS throttling
// for batch jobs (e.g. embedding all products). Default is 3 attempts which is
// not enough — Titan v2 throttles aggressively under sustained load.
const client = new BedrockRuntimeClient({
  region: env.BEDROCK_REGION,
  maxAttempts: 10,
  retryMode: "adaptive",
});

/**
 * Ask the chat model for a JSON answer.
 * Uses the Converse API; returns the assistant's text parsed as JSON.
 */
export const generateJSON = async <T = unknown>(
  systemPrompt: string,
  userPrompt: string
): Promise<T> => {
  if (!env.BEDROCK_MODEL_ID) {
    throw new ApiError(500, "BEDROCK_MODEL_ID is not configured");
  }

  const command = new ConverseCommand({
    modelId: env.BEDROCK_MODEL_ID,
    system: [{ text: systemPrompt }],
    messages: [{ role: "user", content: [{ text: userPrompt }] }],
    inferenceConfig: { maxTokens: 1024, temperature: 0.2 },
  });

  const response = await client.send(command);
  const text = response.output?.message?.content?.[0]?.text;

  if (!text) {
    throw new ApiError(502, "Bedrock returned an empty response");
  }

  // Models sometimes wrap JSON in ```json ... ``` fences — strip them.
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new ApiError(502, "Bedrock response was not valid JSON", [text]);
  }
};

/**
 * Embed a text into a 1024-dim normalized vector via Titan v2.
 */
export const embed = async (text: string): Promise<number[]> => {
  if (!env.BEDROCK_EMBED_MODEL_ID) {
    throw new ApiError(500, "BEDROCK_EMBED_MODEL_ID is not configured");
  }

  const command = new InvokeModelCommand({
    modelId: env.BEDROCK_EMBED_MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      inputText: text,
      dimensions: 1024,
      normalize: true,
    }),
  });

  const response = await client.send(command);
  const payload = JSON.parse(new TextDecoder().decode(response.body)) as {
    embedding?: number[];
  };

  if (!Array.isArray(payload.embedding) || payload.embedding.length !== 1024) {
    throw new ApiError(502, "Titan returned an invalid embedding");
  }

  return payload.embedding;
};
