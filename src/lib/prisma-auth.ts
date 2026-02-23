import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/env";

const globalForPrismaAuth = globalThis as unknown as {
  prismaAuth?: PrismaClient;
};

function createPrismaAuth() {
  // Use direct Aiven connection to avoid PgBouncer pool contention for auth.
  // Falls back to DATABASE_URL when DIRECT_DATABASE_URL is not set (e.g. local dev).
  const connectionString =
    env.DIRECT_DATABASE_URL ?? env.DATABASE_URL;
  const isDirectAiven = !!env.DIRECT_DATABASE_URL;
  const adapter = new PrismaPg({
    connectionString,
    max: 2,
    // Aiven direct connection requires SSL; Aiven uses its own CA so we accept the cert.
    ...(isDirectAiven && { ssl: { rejectUnauthorized: false } }),
  });
  return new PrismaClient({ adapter, log: ["error"] });
}

export const prismaAuth =
  globalForPrismaAuth.prismaAuth ?? createPrismaAuth();
globalForPrismaAuth.prismaAuth = prismaAuth;
