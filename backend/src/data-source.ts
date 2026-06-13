import "reflect-metadata";
import { DataSource } from "typeorm";
import { Pharmacy } from "./models/Pharmacy.entity";
import { Medication } from "./models/Medication.entity";
import { StockEntry } from "./models/StockEntry.entity";
import { User } from "./models/User.entity";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "pharma_user",
  password: process.env.DB_PASSWORD || "pharma_pass",
  database: process.env.DB_NAME || "pharma_ebolowa",
  synchronize: false, // Set to false for migrations
  logging: false,
  entities: [Pharmacy, Medication, StockEntry, User],
  migrations: ["src/migrations/**/*.ts"],
  subscribers: [],
});
