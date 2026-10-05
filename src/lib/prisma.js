import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

// If cached client is missing newly generated models, recreate it
const existingPrisma = globalThis.prisma;
const isStale = existingPrisma && !existingPrisma.branch_product_stock;

const prisma = (!existingPrisma || isStale)
  ? prismaClientSingleton()
  : existingPrisma;

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
