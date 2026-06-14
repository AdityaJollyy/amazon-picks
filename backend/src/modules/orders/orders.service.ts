import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

/**
 * Orders feature service.
 *
 * The prototype has a single seeded user (Aarav). We read his id from the DB
 * once and cache it for the process lifetime — auth slots in here later.
 */

let cachedUserId: string | null = null;

const getCurrentUserId = async (): Promise<string> => {
  if (cachedUserId) return cachedUserId;
  // The seed creates exactly one user; pick the first by createdAt for stability.
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) {
    throw new ApiError(500, "No seeded user found — run `npm run seed`");
  }
  cachedUserId = user.id;
  return user.id;
};

export interface CreateOrderInput {
  items: Array<{ productId: string; quantity: number }>;
  zoneCode: string;
}

const ORDER_INCLUDE = {
  items: true,
  zone: {
    select: { id: true, name: true, code: true, city: true, pincode: true },
  },
} as const;

export const createOrder = async ({ items, zoneCode }: CreateOrderInput) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "items must be a non-empty array");
  }
  if (!zoneCode || typeof zoneCode !== "string") {
    throw new ApiError(400, "zoneCode is required");
  }

  // Merge duplicate productIds in the request so { id: x, qty: 2 } and
  // { id: x, qty: 1 } become one line of qty 3 — simpler stock check + cleaner order rows.
  const merged = new Map<string, number>();
  for (const it of items) {
    if (!it || typeof it.productId !== "string" || !it.productId) {
      throw new ApiError(400, "Each item needs a productId");
    }
    const qty = Number(it.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 999) {
      throw new ApiError(
        400,
        `Invalid quantity for ${it.productId}: expected integer 1..999`
      );
    }
    merged.set(it.productId, (merged.get(it.productId) ?? 0) + qty);
  }

  const productIds = Array.from(merged.keys());

  const zone = await prisma.zone.findUnique({ where: { code: zoneCode } });
  if (!zone) throw new ApiError(404, `Unknown zone code: ${zoneCode}`);

  const [products, stocks] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true },
    }),
    prisma.zoneStock.findMany({
      where: { productId: { in: productIds }, zoneId: zone.id },
      select: { productId: true, stock: true },
    }),
  ]);

  if (products.length !== productIds.length) {
    const found = new Set(products.map((p) => p.id));
    const missing = productIds.filter((id) => !found.has(id));
    throw new ApiError(404, `Products not found: ${missing.join(", ")}`);
  }

  const stockByProduct = new Map(stocks.map((s) => [s.productId, s.stock]));
  const productById = new Map(products.map((p) => [p.id, p]));

  for (const [productId, qty] of merged) {
    const available = stockByProduct.get(productId) ?? 0;
    if (available < qty) {
      const name = productById.get(productId)!.name;
      throw new ApiError(
        409,
        `Not enough stock for "${name}" in ${zoneCode}: ${qty} requested, ${available} available`
      );
    }
  }

  // Snapshot name + price at order time so order history stays correct even if
  // the catalog changes later (matches the seed's existing approach).
  const orderItems = Array.from(merged).map(([productId, quantity]) => {
    const p = productById.get(productId)!;
    return { productId, name: p.name, price: p.price, quantity };
  });
  const total = orderItems.reduce((sum, it) => sum + it.price * it.quantity, 0);

  const userId = await getCurrentUserId();

  // Atomic: create order + items AND decrement stock. If anything fails the
  // whole thing rolls back so we never have an order without its inventory hit.
  return prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId,
        zoneId: zone.id,
        status: "PLACED",
        total,
        items: { create: orderItems },
      },
      include: ORDER_INCLUDE,
    });

    for (const [productId, qty] of merged) {
      await tx.zoneStock.update({
        where: { productId_zoneId: { productId, zoneId: zone.id } },
        data: { stock: { decrement: qty } },
      });
    }

    return created;
  });
};

export const listOrders = async () => {
  const userId = await getCurrentUserId();
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: ORDER_INCLUDE,
  });
};

export const getOrderById = async (id: string) => {
  if (!id) throw new ApiError(400, "Invalid order id");
  const userId = await getCurrentUserId();
  const order = await prisma.order.findFirst({
    where: { id, userId },
    include: ORDER_INCLUDE,
  });
  if (!order) throw new ApiError(404, `Order not found: ${id}`);
  return order;
};
