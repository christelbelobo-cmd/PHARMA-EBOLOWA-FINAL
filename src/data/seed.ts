import { AppState, AvailabilityStatus, StockEntry, StockMap } from "@/types";
import { MEDICATIONS } from "./medications";
import { PHARMACIES } from "./pharmacies";

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
  if (seed < 0.6) return "available";
  if (seed < 0.78) return "low";
  if (seed < 0.9) return "on_order";
  return "out";
}

// Prix indicatifs en FCFA, par catégorie.
function priceFor(medId: string, seed: number): number {
  const base = 500 + Math.floor(seed * 9) * 250; // 500 .. 2750
  return base;
}

export function buildSeedStock(): StockMap {
  const stock: StockMap = {};
  const updatedAt = new Date().toISOString();
  for (const med of MEDICATIONS) {
    stock[med.id] = {};
    for (const ph of PHARMACIES) {
      const seed = hashSeed(`${med.id}:${ph.id}`);
      const status = statusFromSeed(seed);
      const entry: StockEntry = {
        status,
        price: status === "out" ? null : priceFor(med.id, seed),
        updatedAt,
      };
      stock[med.id][ph.id] = entry;
    }
  }
  return stock;
}

export function buildInitialState(): AppState {
  return {
    dutyPharmacyId: "samba",
    stock: buildSeedStock(),
  };
}
