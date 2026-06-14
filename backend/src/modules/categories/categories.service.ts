import { prisma } from "../../config/prisma.js";

/** All categories, ordered alphabetically. */
export const listCategories = async () => {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, icon: true },
  });
};
