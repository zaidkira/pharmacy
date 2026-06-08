import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("🐘 Supabase PostgreSQL connected successfully via Prisma and PG Driver Adapter");
  } catch (error) {
    console.error("❌ PostgreSQL database connection failure:", error);
    process.exit(1);
  }
};
