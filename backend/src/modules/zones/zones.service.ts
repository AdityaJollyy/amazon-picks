import { prisma } from "../../config/prisma.js";

/** All delivery zones. */
export const listZones = async () => {
  return prisma.zone.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true, city: true, pincode: true },
  });
};
