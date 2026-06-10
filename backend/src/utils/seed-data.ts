import { Medication } from "../models/Medication.entity";
import { Pharmacy } from "../models/Pharmacy.entity";
import { StockEntry, AvailabilityStatus } from "../models/StockEntry.entity"; // Import StockEntry and its enum

// Define StockMap type for internal use in seeding
interface StockMap {
  [medicationId: string]: {
    [pharmacyId: string]: {
      status: AvailabilityStatus;
      price: number | null;
      updatedAt: string;
    };
  };
}

// Petit générateur pseudo-aléatoire déterministe pour des données de démo stables.
function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function statusFromSeed(seed: number): AvailabilityStatus {
  if (seed < 0.6) return AvailabilityStatus.AVAILABLE;
  if (seed < 0.78) return AvailabilityStatus.LOW;
  if (seed < 0.9) return AvailabilityStatus.ON_ORDER;
  return AvailabilityStatus.OUT;
}

// Prix indicatifs en FCFA, par catégorie.
function priceFor(medId: string, seed: number): number {
  const base = 500 + Math.floor(seed * 9) * 250; // 500 .. 2750
  return base;
}

export function buildSeedStock(medications: Medication[], pharmacies: Pharmacy[]): StockMap {
  const stock: StockMap = {};
  const updatedAt = new Date().toISOString();
  for (const med of medications) {
    stock[med.id] = {};
    for (const ph of pharmacies) {
      const seed = hashSeed(`${med.id}:${ph.id}`);
      const status = statusFromSeed(seed);
      const entry = {
        status,
        price: status === AvailabilityStatus.OUT ? null : priceFor(med.id, seed),
        updatedAt,
      };
      stock[med.id][ph.id] = entry;
    }
  }
  return stock;
}
