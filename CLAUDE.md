# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---



# Project: Quick-Commerce (Amazon HackOn 6.0 prototype)

A quick-commerce app that lets shoppers go from intent to a ready cart in seconds.
Small-scale prototype, but every choice should scale to large scale conceptually.

## Monorepo layout

- `backend/` — Express 5 + TypeScript (ESM) + Prisma 7 + Postgres (Neon).
- `frontend/` — Vite + React 19 + React Router 7 + Tailwind v4 + framer-motion.

The backend has: custom classes `ApiError`, `ApiResponse`, `asyncHandler`
(`backend/src/utils/`), a global error middleware, a feature-module pattern under
`backend/src/modules/`, a Prisma client singleton using the pg driver adapter
(`backend/src/config/prisma.ts`). The DB is seeded with 200 products across 10 categories
and 5 Delhi zones, zone-wise stock, and 1 user (Aarav Sharma) with 8 historical orders.
Phases 0–3 are already built: storefront UI, AI UI shells, and real product/category/zone
APIs wired to the frontend.

## Data model (Prisma — see backend/prisma/schema.prisma)

- Zone(id, name, code, city, pincode)
- Category(id, name, slug, icon)
- Product(id, name, description, brand, price, mrp, unit, imageUrl, rating, reviewCount,
  popularity, tags[], vibes[], categoryId) // price/mrp are whole rupees
  (later we add: embedding vector(1024), rankScore Float, lastRankedAt)
- ZoneStock(productId, zoneId, stock, etaMinutes)
- User(id, name, email, phone, defaultZoneId)
- Order(id, userId, zoneId, status, total, createdAt)
- OrderItem(orderId, productId, name, price, quantity) // price/name are snapshots
  `Product.vibes` holds medical|party|emergency|casual and drives the vibe-reactive UI.

## Core features

1. Quick Mode — one-shot cart generation. Inputs: free-text intent, group size, 3-stop budget
   slider (Essentials / Standard Mix / Premium Picks). Output: up to 3 curated carts; 1-click
   "Add to cart". Any input change re-generates.
2. Conversation Mode — a chat assistant that asks clarifying questions and builds a live draft
   cart shown beside the chat; ends in 1-click checkout.
3. Vibe-Reactive UI — the AI returns `vibe_category` (medical|party|emergency|casual) that
   swaps the theme (CSS variables) with an animated transition.
4. Predictive Restock — parses order history to flag recurring items due for reorder.

## SEARCH & RANKING — read carefully

- The STOREFRONT search (header search bar) stays BASIC: plain keyword match via
  GET /products?search= (ILIKE). Do NOT make it semantic/hybrid. Keep it simple.
- The AI CART ENGINE is the smart part. It finds products using an INTERNAL hybrid retrieval
  (keyword + semantic vector over Titan embeddings) and chooses the best ones using a
  precomputed `rankScore` (a composite of rating, reviewCount, popularity). This retrieval is
  AI-only and must NOT be wired to the storefront search bar.
- `rankScore` is computed by a script we run MANUALLY for now (`npm run rank`). It is designed
  to later become a nightly cron job that re-ranks based on reviews/popularity. Embeddings are
  also backfilled by a manual script (`npm run embed`), re-run after reseeding.

## Tech / versions (use the LATEST of each)

- Frontend: React 19, React Router 7, Tailwind CSS v4 (CSS-first, @tailwindcss/vite plugin,
  NO tailwind.config.js, theme via @theme in CSS), framer-motion, Vite, TypeScript.
- Backend: Node 20+, Express 5, TypeScript (ESM), Prisma 7 (prisma-client provider, pg driver
  adapter, URL in prisma.config.ts).
- AI: AWS Bedrock via @aws-sdk/client-bedrock-runtime. Generation = a current Claude model
  (BEDROCK_MODEL_ID from .env). Embeddings = amazon.titan-embed-text-v2:0 (1024 dims,
  normalize:true). Auth via AWS_BEARER_TOKEN_BEDROCK, region BEDROCK_REGION=us-east-1.
- Vector store: Neon Postgres pgvector (CREATE EXTENSION vector). Map the column as
  Unsupported("vector(1024)"); run similarity queries with raw SQL.

## HOUSE RULES (follow on every task)

- Keep code SIMPLE and readable. No premature abstraction, no over-engineering. The ONLY part
  that should be sophisticated is the AI cart retrieval/ranking — keep everything else lean.
- Be MODULAR: feature-based folders on both ends. One responsibility per file.
- DRY: reuse helpers; never copy-paste logic.
- Reuse the custom classes. Backend: ApiError, ApiResponse, asyncHandler for ALL routes.
  Frontend: a typed ApiResponse<T>, an ApiError class, one apiClient fetch wrapper, a useAsync
  hook so components don't repeat try/catch.
- UI: STOREFRONT base looks like Amazon (dark navy header, yellow CTAs, dense grid). AI surfaces
  look MODERN, SLEEK, glassy, animated (framer-motion) and are vibe-reactive.
- TypeScript everywhere, strict. Avoid `any`.
- Secrets only in backend/.env. NEVER put AWS or DB credentials in the frontend. Frontend talks
  only to our backend; the backend talks to Bedrock/DB.
- Match existing conventions in backend/ rather than inventing new ones.

## STOP-AND-TEST RULE (critical)

Work in ONE subtask at a time. After finishing a subtask:

- STOP. Do not start the next subtask.
- End your turn with a short "🧪 Test this now" section: exact command(s) to run, the URL or
  screen to open, and the EXPECTED outcome.
- Wait for me to reply "works" or paste an error before continuing.
