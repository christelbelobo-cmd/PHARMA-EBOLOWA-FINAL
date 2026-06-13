import "reflect-metadata";
import { DataSource } from "typeorm";
import { Pharmacy } from "./models/Pharmacy.entity";
import { Medication } from "./models/Medication.entity";
import { StockEntry } from "./models/StockEntry.entity";
import { User } from "./models/User.entity";

const databaseUrl = process.env.DATABASE_URL || "postgresql://pharma:password@localhost:5432/pharma_ebolowa";
const ssl = process.env.DATABASE_SSL === "true";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: databaseUrl,
  ssl: ssl ? { rejectUnauthorized: false } : false,
  synchronize: process.env.NODE_ENV === "development",
  logging: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  entities: [Pharmacy, Medication, StockEntry, User],
  migrations: ["src/migrations/**/*.ts"],
  subscribers: [],
});
