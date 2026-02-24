import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // CLI (migrate, etc.): Use direct URL when available (bypasses PgBouncer).
    // Runtime uses DATABASE_URL via adapter in src/lib/prisma.ts
    url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL!,
  },
});
