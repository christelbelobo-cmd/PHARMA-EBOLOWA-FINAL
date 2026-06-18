import { eq } from "drizzle-orm";
import { pharmacies, InsertPharmacy } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Créer une nouvelle pharmacie
 */
export async function createPharmacy(data: InsertPharmacy): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Base de données indisponible");
  }

  if (!data.name || !data.address || !data.phone) {
    throw new Error("Les champs nom, adresse et téléphone sont obligatoires");
  }

  try {
    await db.insert(pharmacies).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("[Database] Impossible de créer la pharmacie:", error);
    throw error;
  }
}

/**
 * Mettre à jour une pharmacie
 */
export async function updatePharmacy(
  id: number,
  data: Partial<InsertPharmacy>
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Base de données indisponible");
  }

  try {
    await db.update(pharmacies).set({
      ...data,
      updatedAt: new Date(),
    }).where(eq(pharmacies.id, id));
  } catch (error) {
    console.error("[Database] Impossible de mettre à jour la pharmacie:", error);
    throw error;
  }
}

/**
 * Supprimer une pharmacie
 */
export async function deletePharmacy(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Base de données indisponible");
  }

  try {
    await db.delete(pharmacies).where(eq(pharmacies.id, id));
  } catch (error) {
    console.error("[Database] Impossible de supprimer la pharmacie:", error);
    throw error;
  }
}
