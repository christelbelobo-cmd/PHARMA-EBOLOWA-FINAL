import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, double } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  username: varchar("username", { length: 255 }).unique(),
  password: text("password"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "pharmacist"]).default("user").notNull(),
  pharmacyId: int("pharmacyId"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const pharmacies = mysqlTable("pharmacies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address").notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }),
  openingHours: text("openingHours"),
  mapLink: text("mapLink"),
  latitude: double("latitude"),
  longitude: double("longitude"),
  isOnDuty: boolean("isOnDuty").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const medications = mysqlTable("medications", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  dci: varchar("dci", { length: 255 }),
  therapeuticCategory: varchar("therapeuticCategory", { length: 255 }),
  dosage: varchar("dosage", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const stockEntries = mysqlTable("stockEntries", {
  id: int("id").autoincrement().primaryKey(),
  medicationId: int("medicationId").notNull(),
  pharmacyId: int("pharmacyId").notNull(),
  status: mysqlEnum("status", ["available", "low_stock", "on_order", "out_of_stock"]).default("available").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  quantity: int("quantity").default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  pharmacy: one(pharmacies, { fields: [users.pharmacyId], references: [pharmacies.id] }),
}));

export const pharmaciesRelations = relations(pharmacies, ({ many }) => ({
  users: many(users),
  stockEntries: many(stockEntries),
}));

export const medicationsRelations = relations(medications, ({ many }) => ({
  stockEntries: many(stockEntries),
}));

export const stockEntriesRelations = relations(stockEntries, ({ one }) => ({
  medication: one(medications, { fields: [stockEntries.medicationId], references: [medications.id] }),
  pharmacy: one(pharmacies, { fields: [stockEntries.pharmacyId], references: [pharmacies.id] }),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Pharmacy = typeof pharmacies.$inferSelect;
export type InsertPharmacy = typeof pharmacies.$inferInsert;
export type Medication = typeof medications.$inferSelect;
export type InsertMedication = typeof medications.$inferInsert;
export type StockEntry = typeof stockEntries.$inferSelect;
export type InsertStockEntry = typeof stockEntries.$inferInsert;

