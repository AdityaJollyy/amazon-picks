# Quick-Commerce Backend — Foundation

Production-grade Express + TypeScript + Prisma 7 (Postgres/Neon) backend.

## Folder structure

```
backend/
├── prisma/
│   ├── schema.prisma      # data models (zones, categories, products, stock, users, orders)
│   └── seed.ts            # 200 products, 5 Delhi zones, 1 user + order history
├── src/
│   ├── config/            # env + prisma client (with pg driver adapter)
│   ├── utils/             # ApiError, ApiResponse, asyncHandler
│   ├── middlewares/       # global error + 404 handler
│   ├── modules/           # feature modules (health for now; products/cart/ai later)
│   ├── routes/            # mounts modules under /api/v1
│   ├── app.ts             # express app assembly
│   └── server.ts          # entry point
├── prisma.config.ts       # Prisma 7 config (DB url for migrations lives here)
├── .env.example
├── package.json
└── tsconfig.json
```

## Setup (run in order, inside the `backend` folder)

```bash
# 1. install dependencies
npm install

# 2. create your env file, then paste your Neon DATABASE_URL into it
#    Windows PowerShell:
copy .env.example .env
#    (then open .env in VS Code and paste your connection string)

# 3. create the tables + generate the Prisma client
npx prisma migrate dev --name init

# 4. fill the database with mock data
npm run seed

# 5. start the dev server
npm run dev
```

Then open: http://localhost:5000/api/v1/health
You should see `counts: { products: 200, zones: 5, orders: 8 }`.

## Notes
- Use the **direct (non-pooled)** Neon connection string in `.env`. Turn OFF
  "Connection pooling" in Neon before copying — pooled connections break migrations.
- Red squiggles on `../generated/prisma/client.js` are normal until step 3 runs
  `prisma generate` (which creates that folder).
- `npm run studio` opens Prisma Studio to browse the seeded data visually.
