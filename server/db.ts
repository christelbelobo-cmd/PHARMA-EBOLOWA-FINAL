import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, pharmacies, medications, stockEntries, Pharmacy, Medication, StockEntry, InsertPharmacy, InsertMedication, InsertStockEntry } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Pharmacy queries
export async function getPharmacies(): Promise<Pharmacy[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pharmacies);
}

export async function getPharmacyById(id: number): Promise<Pharmacy | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(pharmacies).where(eq(pharmacies.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePharmacy(id: number, data: Partial<InsertPharmacy>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(pharmacies).set(data).where(eq(pharmacies.id, id));
}

export async function setDutyPharmacy(pharmacyId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(pharmacies).set({ isOnDuty: false });
  await db.update(pharmacies).set({ isOnDuty: true }).where(eq(pharmacies.id, pharmacyId));
}

// Medication queries
export async function getMedications(): Promise<Medication[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(medications);
}

export async function getMedicationById(id: number): Promise<Medication | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(medications).where(eq(medications.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Stock queries
export async function getStockEntries(): Promise<StockEntry[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stockEntries);
}

export async function getStockEntry(medicationId: number, pharmacyId: number): Promise<StockEntry | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(stockEntries).where(
    and(
      eq(stockEntries.medicationId, medicationId),
      eq(stockEntries.pharmacyId, pharmacyId)
    )
  ).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateStockEntry(medicationId: number, pharmacyId: number, data: Partial<InsertStockEntry>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(stockEntries).set(data).where(
    and(
      eq(stockEntries.medicationId, medicationId),
      eq(stockEntries.pharmacyId, pharmacyId)
    )
  );
}

export async function getStockByPharmacy(pharmacyId: number): Promise<StockEntry[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stockEntries).where(eq(stockEntries.pharmacyId, pharmacyId));
}

export async function getStockByMedication(medicationId: number): Promise<StockEntry[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stockEntries).where(eq(stockEntries.medicationId, medicationId));
}
