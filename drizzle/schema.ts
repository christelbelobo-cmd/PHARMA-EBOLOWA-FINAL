import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, foreignKey, real } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "pharmacist"]).default("user").notNull(),
  pharmacyId: int("pharmacyId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Pharmacies table - stores pharmacy information
 */
export const pharmacies = mysqlTable("pharmacies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address").notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }),
  openingHours: text("openingHours"),
  mapLink: text("mapLink"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  isOnDuty: boolean("isOnDuty").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Pharmacy = typeof pharmacies.$inferSelect;
export type InsertPharmacy = typeof pharmacies.$inferInsert;

/**
 * Medications table - stores medication information
 */
export const medications = mysqlTable("medications", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  dci: varchar("dci", { length: 255 }), // International non-proprietary name
  therapeuticCategory: varchar("therapeuticCategory", { length: 255 }),
  dosage: varchar("dosage", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Medication = typeof medications.$inferSelect;
export type InsertMedication = typeof medications.$inferInsert;

/**
 * Stock entries - tracks medication availability in each pharmacy
 */
export const stockEntries = mysqlTable("stockEntries", {
  id: int("id").autoincrement().primaryKey(),
  medicationId: int("medicationId").notNull(),
  pharmacyId: int("pharmacyId").notNull(),
  status: mysqlEnum("status", ["available", "low_stock", "on_order", "out_of_stock"]).default("available").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  quantity: int("quantity").default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  medicationPharmacyIndex: foreignKey({
    columns: [table.medicationId, table.pharmacyId],
    foreignColumns: [medications.id, pharmacies.id],
  }),
}));

export type StockEntry = typeof stockEntries.$inferSelect;
export type InsertStockEntry = typeof stockEntries.$inferInsert;

/**
 * Relations
 */
export const usersRelations = relations(users, ({ one }) => ({
  pharmacy: one(pharmacies, {
    fields: [users.pharmacyId],
    references: [pharmacies.id],
  }),
}));

export const pharmaciesRelations = relations(pharmacies, ({ many }) => ({
  users: many(users),
  stockEntries: many(stockEntries),
}));

export const medicationsRelations = relations(medications, ({ many }) => ({
  stockEntries: many(stockEntries),
}));

export const stockEntriesRelations = relations(stockEntries, ({ one }) => ({
  medication: one(medications, {
    fields: [stockEntries.medicationId],
    references: [medications.id],
  }),
  pharmacy: one(pharmacies, {
    fields: [stockEntries.pharmacyId],
    references: [pharmacies.id],
  }),
}));