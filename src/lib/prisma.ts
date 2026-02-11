// lib/prisma.ts
import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/env";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10, // Limit max connections per pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // 10s — enough for cold starts + SSL handshake
  statement_timeout: 30000, // Kill queries running longer than 30s
  query_timeout: 30000, // Client-side query timeout
});
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
