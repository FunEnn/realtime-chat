import { type Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

export type TransactionClient = Prisma.TransactionClient;

export type TransactionCallback<T> = (tx: TransactionClient) => Promise<T>;

export async function withTransaction<T>(
  callback: TransactionCallback<T>,
  timeout: number = 5000,
): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      return await callback(tx);
    },
    {
      timeout,
    },
  );
}
