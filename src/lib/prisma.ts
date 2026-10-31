import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env } from "@/lib/env";

const isLocalDb =
  env.DATABASE_URL.includes("localhost") || env.DATABASE_URL.includes("127.0.0.1");

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Embedded local databases can opt into one connection; hosted PostgreSQL
  // retains the normal pool size.
  max: Math.max(1, Math.min(20, Number(process.env.DATABASE_POOL_MAX) || 10)),
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
