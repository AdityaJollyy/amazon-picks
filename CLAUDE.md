# Project: Quick-Commerce (Amazon HackOn 6.0 prototype)

A quick-commerce app that lets shoppers go from intent to a ready cart in seconds.
Small-scale prototype, but every choice should scale to large scale conceptually.

## Monorepo layout
- `backend/`  — ALREADY BUILT. Express 5 + TypeScript (ESM) + Prisma 7 + Postgres (Neon).
- `frontend/` — to be built. Vite + React 19 + React Router 7 + Tailwind v4 + framer-motion.

The backend already has: custom classes `ApiError`, `ApiResponse`, `asyncHandler`
(in `backend/src/utils/`), a global error middleware, a feature-module pattern under
`backend/src/modules/`, a Prisma client singleton using the pg driver adapter
(`backend/src/config/prisma.ts`), and a working `/api/v1/health` endpoint.
The database is already seeded with 200 products across 10 categories and 5 Delhi zones,
zone-wise stock, and 1 user (Aarav Sharma) with 8 historical orders.

## Data model (Prisma — see backend/prisma/schema.prisma)
- Zone(id, name, code, city, pincode)
- Category(id, name, slug, icon)
- Product(id, name, description, brand, price, mrp, unit, imageUrl, rating, reviewCount,
  popularity, tags[], vibes[], categoryId)   // price/mrp are whole rupees
- ZoneStock(productId, zoneId, stock, etaMinutes)  // per-zone availability
- User(id, name, email, phone, defaultZoneId)
- Order(id, userId, zoneId, status, total, createdAt)  status: PLACED|PACKED|OUT_FOR_DELIVERY|DELIVERED|CANCELLED
- OrderItem(orderId, productId, name, price, quantity)  // price/name are snapshots
The `Product.vibes` field holds values like medical|party|emergency|casual and drives the
vibe-reactive UI.

## Core features
1. Quick Mode — one-shot cart generation. Inputs: free-text intent, group size, and a
   3-stop budget slider (Essentials / Standard Mix / Premium Picks). Output: up to 3
   curated carts; 1-click "Add to cart". Any input change re-generates.
2. Conversation Mode — a chat assistant that asks clarifying questions and builds a live
   draft cart shown beside the chat; ends in 1-click checkout.
3. Vibe-Reactive UI — the AI returns a `vibe_category` (medical|party|emergency|casual)
   that swaps the theme (CSS variables) with an animated transition.
4. Predictive Restock — parses order history to flag recurring items due for reorder,
   shown in a "Ready to Restock?" dashboard with Reorder / Skip / Snooze.
5. Hybrid Search — keyword + semantic vector search, ranked by a composite score.

## Tech / versions (use the LATEST of each)
- Frontend: React 19, React Router 7, Tailwind CSS v4 (CSS-first, @tailwindcss/vite
  plugin — NO tailwind.config.js, theme via @theme in CSS), framer-motion, Vite, TypeScript.
- Backend: Node 20+, Express 5, TypeScript (ESM, "type":"module"), Prisma 7
  (prisma-client provider, pg driver adapter, URL lives in prisma.config.ts).
- AI: AWS Bedrock via @aws-sdk/client-bedrock-runtime. Generation = a current Claude model
  (model id from .env). Embeddings = amazon.titan-embed-text-v2:0 (1024 dims, normalize:true).
- Vector store: Neon Postgres pgvector (CREATE EXTENSION vector). Prisma maps the column as
  Unsupported("vector(1024)"); run similarity queries with raw SQL.

## HOUSE RULES (follow on every task)
- Keep code SIMPLE and readable. No premature abstraction, no over-engineering.
- Be MODULAR: feature-based folders on both ends. One responsibility per file.
- DRY: reuse helpers; never copy-paste logic.
- Reuse the custom classes. Backend: ApiError, ApiResponse, asyncHandler for ALL routes.
  Frontend: mirror them — a typed `ApiResponse<T>` type, an `ApiError` class, and a single
  `apiClient` fetch wrapper that unwraps `ApiResponse` and throws `ApiError` on failure.
  Use a `useAsync`/React Query-style pattern so components don't repeat try/catch.
- UI: the STOREFRONT base must look like Amazon (familiar layout, dark navy header, yellow
  CTAs, dense product grid). The AI surfaces must look MODERN and SLEEK (clean, glassy,
  motion via framer-motion) and be vibe-reactive — clearly a step above the base store.
- TypeScript everywhere. Strict. No `any` unless unavoidable (then comment why).
- Secrets only in `backend/.env`. NEVER put AWS or DB credentials in the frontend.
  The frontend talks only to our backend; the backend talks to Bedrock/DB.
- Match existing conventions in `backend/` rather than inventing new ones.

## STOP-AND-TEST RULE (critical)
Work in ONE subtask at a time. After finishing a subtask:
- STOP. Do not start the next subtask.
- End your turn with a short "🧪 Test this now" section: the exact command(s) to run,
  the URL or screen to open, and the EXPECTED outcome.
- Then wait for me to reply "works" or paste an error. Do not continue until I confirm.