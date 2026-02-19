// lib/prisma.ts
import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/env";

// Cache BOTH Pool and PrismaClient in globalThis to prevent
// connection leaks during Next.js hot-reloads in development.
// Without this, every HMR creates a new Pool (up to `max` connections),
// quickly exhausting the database's connection limit (error 53300).
const globalForPrisma = globalThis as unknown as {
  pool?: Pool;
  prisma?: PrismaClient;
};

// SSL: Use DATABASE_CA_CERT when provided; otherwise accept self-signed certs
// (e.g. Aiven, some managed Postgres). Vercel/production needs this for TLS.
const sslConfig = process.env.DATABASE_CA_CERT
  ? { ca: process.env.DATABASE_CA_CERT }
  : { rejectUnauthorized: false };

const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    ssl: sslConfig,
    max: 3, // Aiven hobby tier ~20 slots; keep very low to avoid 53300
    min: 0, // Don't hold idle connections
    idleTimeoutMillis: 20000, // Release idle connections sooner
    connectionTimeoutMillis: 10000,
    statement_timeout: 30000,
    query_timeout: 30000,
    allowExitOnIdle: true, // Release pool when no active queries
  });

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error"],
  });

// Cache in both dev and production to avoid creating new pools per request/worker
globalForPrisma.pool = pool;
globalForPrisma.prisma = prisma;
