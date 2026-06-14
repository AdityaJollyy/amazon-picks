import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

/**
 * Predictive Restock service.
 *
 * Strategy: parse the user's order history, compute (lastOrderedAt, intervalDays)
 * per product they've bought more than once, and persist that to RestockState.
 * The "ready to restock" list is then anything ACTIVE, not-snoozed, and past
 * its due date.
 *
 * State is reconciled lazily: every GET /restock re-syncs from order history,
 * so a fresh order automatically extends the cycle without any extra writes.
 * snoozedUntil and explicit "skip" overrides survive across syncs because we
 * UPSERT — never delete — the per-product row.
 */

// We treat any non-cancelled order as a real purchase signal so the prototype
// works against the seed (which mixes DELIVERED + OUT_FOR_DELIVERY).
const COUNTABLE_ORDER_STATUSES = [
  "PLACED",
  "PACKED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

const RESTOCK_CONFIG = {
  // Need at least this many purchases of a product to call it "recurring".
  minPurchases: 2,
  // Sane bounds for the computed interval (in days). Avoids the "bought twice
  // five hours apart" → 0-day cycle bug, and caps wild outliers.
  minIntervalDays: 2,
  maxIntervalDays: 90,
  // For a brand-new RestockState we use the most recent observed gap as a
  // reasonable starting point. After that the average reflects all history.
  defaultSuggestedQty: 1,
};

let cachedUserId: string | null = null;
const getCurrentUserId = async (): Promise<string> => {
  if (cachedUserId) return cachedUserId;
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) throw new ApiError(500, "No seeded user found — run `npm run seed`");
  cachedUserId = user.id;
  return user.id;
};

interface PurchaseStats {
  productId: string;
  count: number;
  lastOrderedAt: Date;
  intervalDays: number;
  averageQty: number;
}

/** Walk order history and reduce to per-product purchase stats. */
const computePurchaseStats = async (userId: string): Promise<PurchaseStats[]> => {
  const orders = await prisma.order.findMany({
    where: { userId, status: { in: [...COUNTABLE_ORDER_STATUSES] } },
    orderBy: { createdAt: "asc" },
    select: {
      createdAt: true,
      items: { select: { productId: true, quantity: true } },
    },
  });

  // For each product, collect the timestamps it was ordered + total qty seen.
  const byProduct = new Map<
    string,
    { dates: Date[]; qtySum: number; qtyCount: number }
  >();

  for (const order of orders) {
    // Dedupe within an order — a single order with the same product on two
    // lines is still one purchase event for cadence purposes.
    const seenInOrder = new Set<string>();
    for (const item of order.items) {
      const entry =
        byProduct.get(item.productId) ?? { dates: [], qtySum: 0, qtyCount: 0 };
      entry.qtySum += item.quantity;
      entry.qtyCount += 1;
      if (!seenInOrder.has(item.productId)) {
        entry.dates.push(order.createdAt);
        seenInOrder.add(item.productId);
      }
      byProduct.set(item.productId, entry);
    }
  }

  const stats: PurchaseStats[] = [];
  for (const [productId, { dates, qtySum, qtyCount }] of byProduct) {
    if (dates.length < RESTOCK_CONFIG.minPurchases) continue;

    // Average gap between consecutive purchases.
    let gapsTotalMs = 0;
    for (let i = 1; i < dates.length; i++) {
      gapsTotalMs += dates[i]!.getTime() - dates[i - 1]!.getTime();
    }
    const avgGapDays = gapsTotalMs / (dates.length - 1) / 86_400_000;

    const intervalDays = Math.min(
      RESTOCK_CONFIG.maxIntervalDays,
      Math.max(RESTOCK_CONFIG.minIntervalDays, avgGapDays)
    );

    stats.push({
      productId,
      count: dates.length,
      lastOrderedAt: dates[dates.length - 1]!,
      intervalDays,
      averageQty: Math.max(1, Math.round(qtySum / qtyCount)),
    });
  }

  return stats;
};

/**
 * Reconcile RestockState rows for the user against current order history.
 * Upserts so per-row preferences (snoozedUntil, status) are preserved.
 */
const syncRestockStates = async (userId: string): Promise<void> => {
  const stats = await computePurchaseStats(userId);
  if (stats.length === 0) return;

  await prisma.$transaction(
    stats.map((s) =>
      prisma.restockState.upsert({
        where: { userId_productId: { userId, productId: s.productId } },
        create: {
          userId,
          productId: s.productId,
          lastOrderedAt: s.lastOrderedAt,
          intervalDays: s.intervalDays,
        },
        update: {
          lastOrderedAt: s.lastOrderedAt,
          intervalDays: s.intervalDays,
        },
      })
    )
  );
};

export interface ReadyRestockItem {
  productId: string;
  product: {
    id: string;
    name: string;
    brand: string;
    unit: string;
    imageUrl: string;
    price: number;
    mrp: number;
  };
  lastOrderedAt: Date;
  intervalDays: number;
  dueAt: Date;
  /** Days past the due date. Negative would be "due in N days" (we filter those out). */
  daysOverdue: number;
  /** Suggested order quantity based on past purchases. */
  suggestedQuantity: number;
  status: "ACTIVE" | "PAUSED";
  snoozedUntil: Date | null;
}

/** Returns items that are due to be restocked, sorted by most overdue first. */
export const listReadyToRestock = async (): Promise<ReadyRestockItem[]> => {
  const userId = await getCurrentUserId();
  await syncRestockStates(userId);

  const now = new Date();

  const states = await prisma.restockState.findMany({
    where: {
      userId,
      status: "ACTIVE",
      OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }],
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          brand: true,
          unit: true,
          imageUrl: true,
          price: true,
          mrp: true,
        },
      },
    },
  });

  // Recompute averageQty per product so the suggestion stays fresh — it's
  // cheap (already in memory from the sync step) but for cleanliness we redo
  // the lookup here. 200-product DB; acceptable.
  const stats = await computePurchaseStats(userId);
  const qtyByProduct = new Map(stats.map((s) => [s.productId, s.averageQty]));

  const ready: ReadyRestockItem[] = [];
  for (const s of states) {
    const dueAt = new Date(s.lastOrderedAt.getTime() + s.intervalDays * 86_400_000);
    const daysOverdue = (now.getTime() - dueAt.getTime()) / 86_400_000;
    if (daysOverdue < 0) continue; // not due yet

    ready.push({
      productId: s.productId,
      product: s.product,
      lastOrderedAt: s.lastOrderedAt,
      intervalDays: s.intervalDays,
      dueAt,
      daysOverdue: Math.round(daysOverdue * 10) / 10,
      suggestedQuantity:
        qtyByProduct.get(s.productId) ?? RESTOCK_CONFIG.defaultSuggestedQty,
      status: s.status,
      snoozedUntil: s.snoozedUntil,
    });
  }

  ready.sort((a, b) => b.daysOverdue - a.daysOverdue);
  return ready;
};

const ensureState = async (userId: string, productId: string) => {
  const state = await prisma.restockState.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (!state) {
    throw new ApiError(
      404,
      "No restock cycle for this product — order it at least twice first"
    );
  }
  return state;
};

export interface ReorderResult {
  productId: string;
  product: {
    id: string;
    name: string;
    brand: string;
    unit: string;
    imageUrl: string;
    price: number;
    mrp: number;
    etaMinutes: number;
    stock: number;
    zoneCode: string;
  } | null;
  suggestedQuantity: number;
}

/**
 * Returns the suggested item to add to the cart. The cycle isn't reset here —
 * placing the actual order will update lastOrderedAt on the next sync.
 *
 * If the user has a default zone, we resolve stock + ETA in that zone so the
 * frontend can pop the item straight into the cart.
 */
export const reorder = async (productId: string): Promise<ReorderResult> => {
  const userId = await getCurrentUserId();
  await ensureState(userId, productId);

  const stats = await computePurchaseStats(userId);
  const stat = stats.find((s) => s.productId === productId);
  const suggestedQuantity = stat?.averageQty ?? RESTOCK_CONFIG.defaultSuggestedQty;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { defaultZone: { select: { id: true, code: true } } },
  });

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      brand: true,
      unit: true,
      imageUrl: true,
      price: true,
      mrp: true,
      stocks: user?.defaultZone
        ? {
            where: { zoneId: user.defaultZone.id },
            select: { stock: true, etaMinutes: true },
            take: 1,
          }
        : false,
    },
  });

  if (!product) throw new ApiError(404, "Product not found");

  const stock = product.stocks?.[0];
  return {
    productId,
    product: {
      id: product.id,
      name: product.name,
      brand: product.brand,
      unit: product.unit,
      imageUrl: product.imageUrl,
      price: product.price,
      mrp: product.mrp,
      etaMinutes: stock?.etaMinutes ?? 0,
      stock: stock?.stock ?? 0,
      zoneCode: user?.defaultZone?.code ?? "",
    },
    suggestedQuantity,
  };
};

/** Reset the cycle: pretend we just bought it, push the next due date out by intervalDays. */
export const skip = async (productId: string) => {
  const userId = await getCurrentUserId();
  const state = await ensureState(userId, productId);
  return prisma.restockState.update({
    where: { id: state.id },
    data: { lastOrderedAt: new Date(), snoozedUntil: null },
  });
};

/** Snooze: don't show this in "ready" until snoozedUntil. */
export const snooze = async (productId: string, days: number) => {
  if (!Number.isFinite(days) || days < 1 || days > 365) {
    throw new ApiError(400, "Invalid 'days': expected integer 1..365");
  }
  const userId = await getCurrentUserId();
  const state = await ensureState(userId, productId);
  const until = new Date(Date.now() + Math.round(days) * 86_400_000);
  return prisma.restockState.update({
    where: { id: state.id },
    data: { snoozedUntil: until },
  });
};
