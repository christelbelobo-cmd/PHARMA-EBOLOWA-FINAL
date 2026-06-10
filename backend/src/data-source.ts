import "reflect-metadata";
import { DataSource } from "typeorm";
import { Pharmacy } from "./models/Pharmacy.entity";
import { Medication } from "./models/Medication.entity";
import { StockEntry } from "./models/StockEntry.entity"; // Import the new entity

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "database.sqlite",
  synchronize: false, // Temporarily set to false to avoid SQLite "Expression tree too large" error during schema sync
  logging: false,
  entities: [Pharmacy, Medication, StockEntry],
  migrations: ["src/migrations/**/*.ts"], // Point to migration files
  subscribers: [],
});
