# Quick-Commerce — Amazon HackOn 6.0 Prototype

A quick-commerce app where shoppers go from intent to a ready cart in seconds.

The storefront looks like Amazon (dark navy header, yellow CTAs, dense grid). The AI surfaces — Quick Mode, Conversation Mode, Predictive Restock — sit on top, vibe-react to the customer's need (medical / party / emergency / casual), and use real hybrid retrieval (keyword + semantic) over Bedrock embeddings to pick products.

## Monorepo layout

```
amazon-picks/
├── backend/                 # Express 5 + TypeScript (ESM) + Prisma 7 + Postgres (Neon)
│   ├── prisma/              # schema + migrations + seed (200 products, 5 zones, 1 user + history)
│   └── src/
│       ├── config/          # env, prisma, bedrock client (Converse + Titan embeddings)
│       ├── utils/           # ApiError, ApiResponse, asyncHandler
│       ├── modules/         # health, products, categories, zones, ai, orders, restock
│       ├── features/ai/     # retrieval, quick-cart, chat services + prompt templates
│       ├── scripts/         # embedProducts (manual), rankProducts (manual → nightly cron)
│       ├── middlewares/     # global error + 404 handler
│       └── routes/          # mounts modules under /api/v1
└── frontend/                # Vite + React 19 + React Router 7 + Tailwind v4 + framer-motion
    └── src/
        ├── api/             # typed wrappers around the backend (apiClient + per-feature)
        ├── components/      # layout (Header, RootLayout) + ui (Icons)
        ├── features/        # cart, products, ai (Quick + Conversation), vibe, zone, restock
        ├── hooks/           # useAsync
        ├── lib/             # ApiResponse, ApiError, cn
        ├── pages/           # Home, Category, Product, Orders
        └── router.tsx
```

## Prerequisites

- Node 20+
- A Neon Postgres database with `pgvector` available (Neon supports it out of the box)
- AWS Bedrock access in `us-east-1` with these models enabled:
  - A generation model (set via `BEDROCK_MODEL_ID` — Nova Lite or a Claude model)
  - `amazon.titan-embed-text-v2:0` for 1024-dim embeddings

## Backend setup

```bash
cd backend
npm install

# Copy env template and fill it in
copy .env.example .env
```

Edit `backend/.env`:

```ini
# Use the DIRECT (non-pooled) Neon string — pooled connections break migrations
DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"
PORT=5000
NODE_ENV=development

# Bedrock — the SDK reads this bearer token automatically
AWS_BEARER_TOKEN_BEDROCK=<your-bedrock-bearer-token>
BEDROCK_REGION=us-east-1
BEDROCK_MODEL_ID=us.amazon.nova-lite-v1:0
BEDROCK_EMBED_MODEL_ID=amazon.titan-embed-text-v2:0
```

Then bring the database up and start the dev server:

```bash
npm run migrate     # creates tables + generates the Prisma client
npm run seed        # 200 products, 5 zones, 1 user (Aarav), 8 historical orders
npm run embed       # backfills product embeddings via Titan v2 (Bedrock)
npm run rank        # computes the rankScore the AI cart engine uses
npm run dev         # http://localhost:5000
```

Smoke test:
- `GET http://localhost:5000/api/v1/health` → `counts: { products: 200, zones: 5, orders: 8 }`
- `GET http://localhost:5000/api/v1/ai/ping` → round-trips Bedrock generation + embedding

## Frontend setup

```bash
cd frontend
npm install

copy .env.example .env
# Set: VITE_API_URL=http://localhost:5000/api/v1

npm run dev         # http://localhost:5173
```

## Manual data jobs

Two backend scripts must be run by hand for now. Both are idempotent — re-run them whenever you change the seed or product set.

```bash
npm run embed       # writes Titan embeddings to Product.embedding
npm run rank        # writes Product.rankScore (composite of rating, log-scaled review count, popularity)
```

`npm run rank` is a one-off **for the prototype**. In production this would be a nightly cron so rankings reflect the latest reviews and order patterns. The script and its weights live in `backend/src/scripts/rankProducts.ts` — they're factored cleanly so wiring it to a scheduler is a trivial change.

`npm run embed` only needs to re-run when you reseed or add new products. It skips already-embedded rows unless you pass `--all`.

## Resetting the database

If the schema or seed changes:

```bash
npm run db:reset    # prisma migrate reset --force --skip-seed && npm run seed
```

After it finishes you'll be reminded — re-run `npm run embed && npm run rank` so the AI surfaces work again.

## Search and ranking — important

- **Storefront search** (the header search bar) stays simple: plain ILIKE keyword match via `GET /products?search=`. Do **not** wire it to semantic retrieval.
- **AI cart engine** uses internal hybrid retrieval (keyword + semantic vector via cosine distance over Titan embeddings) and orders by a blend of similarity and `rankScore`. This path is exposed only to the AI services and a debug endpoint (`GET /ai/retrieve`).

The split is intentional: the storefront should feel snappy and predictable; the AI is where retrieval gets clever.

## Running the prototype end-to-end

1. Start backend (`npm run dev` in `backend/`).
2. Start frontend (`npm run dev` in `frontend/`).
3. Open the app, click **Ask AI** in the header.
   - **Quick Mode**: type an intent ("midnight headache and fever"), pick group size + budget, get 3 carts.
   - **Conversation Mode**: chat with the assistant; the draft cart fills as you talk; one click to checkout.
4. The home page shows a **Ready to restock?** section once your seeded order history makes weekly staples (milk, bread, eggs) due. Reorder / Skip / Snooze each call the matching backend endpoint and update optimistically.
5. The header **Hello, Aarav · Orders & Account** link goes to `/orders` and shows real order history.

## Tech versions

- React 19, React Router 7, Tailwind v4 (CSS-first via `@theme`, `@tailwindcss/vite`), framer-motion, Vite, TypeScript strict.
- Node 20+, Express 5, TypeScript ESM, Prisma 7 (`prisma-client` provider, `pg` driver adapter, URL in `prisma.config.ts`).
- Bedrock via `@aws-sdk/client-bedrock-runtime`. Generation = `BEDROCK_MODEL_ID`. Embeddings = Titan v2 (1024 dims, normalized).
- Postgres + pgvector. The `embedding` column is mapped as `Unsupported("vector(1024)")` and queried with raw SQL.

## House rules

- Code is simple and modular — the only sophisticated part is the AI retrieval/ranking path.
- All routes use `asyncHandler` + `ApiError` + `ApiResponse`.
- Frontend uses one `apiClient` and a typed `useAsync` so components don't repeat try/catch.
- Secrets live only in `backend/.env`. The frontend talks only to our backend.
