import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type { Prisma } from "../../generated/prisma/client.js";

export interface ListProductsParams {
  page: number;
  limit: number;
  categorySlug?: string;
  zoneCode?: string;
  search?: string;
}

/**
 * Paginated product listing. Filters compose: category + zone-availability + name search.
 * When `zoneCode` is provided we only return products with stock > 0 in that zone.
 */
export const listProducts = async ({
  page,
  limit,
  categorySlug,
  zoneCode,
  search,
}: ListProductsParams) => {
  const where: Prisma.ProductWhereInput = {};

  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  if (zoneCode) {
    where.stocks = {
      some: {
        zone: { code: zoneCode },
        stock: { gt: 0 },
      },
    };
  }

  if (search && search.trim().length > 0) {
    where.name = { contains: search.trim(), mode: "insensitive" };
  }

  const skip = (page - 1) * limit;

  // When zoneCode is given, also fetch the matching ZoneStock per product so
  // the frontend can render zone-specific stock + ETA in the card.
  const zoneStockInclude = zoneCode
    ? { where: { zone: { code: zoneCode } }, take: 1 }
    : false;

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ popularity: "desc" }, { rating: "desc" }],
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true } },
        ...(zoneStockInclude ? { stocks: zoneStockInclude } : {}),
      },
    }),
    prisma.product.count({ where }),
  ]);

  // Flatten zone-specific stock + eta onto each item when a zone was provided.
  const items = rows.map((p) => {
    const { stocks, ...rest } = p as typeof p & { stocks?: { stock: number; etaMinutes: number }[] };
    if (!zoneCode) return rest;
    const zs = stocks?.[0];
    return {
      ...rest,
      stock: zs?.stock ?? 0,
      etaMinutes: zs?.etaMinutes ?? 0,
    };
  });

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/** Fetch one product with its per-zone availability (stock + ETA). */
export const getProductById = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, slug: true, icon: true } },
      stocks: {
        include: {
          zone: { select: { id: true, name: true, code: true, city: true, pincode: true } },
        },
      },
    },
  });

  if (!product) {
    throw new ApiError(404, `Product not found: ${id}`);
  }

  const { stocks, ...rest } = product;
  return {
    ...rest,
    availability: stocks.map((s) => ({
      zone: s.zone,
      stock: s.stock,
      etaMinutes: s.etaMinutes,
      inStock: s.stock > 0,
    })),
  };
};
