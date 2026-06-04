export type AvailabilityStatus = "available" | "low" | "on_order" | "out";

export interface Pharmacy {
  id: string;
  name: string;
  quartier: string;
  address: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
}

export type MedicationCategory =
  | "Antalgique"
  | "Antibiotique"
  | "Antipaludique"
  | "Anti-inflammatoire"
  | "Gastro"
  | "Vitamines"
  | "Dermatologie"
  | "Cardiologie"
  | "Diabète"
  | "Respiratoire"
  | "Autre";

export interface Medication {
  id: string;
  name: string;
  dci: string; // Dénomination Commune Internationale
  form: string; // comprimé, sirop, injectable...
  category: MedicationCategory;
}

export interface StockEntry {
  status: AvailabilityStatus;
  price: number | null; // FCFA
  updatedAt: string; // ISO date
}

// stock[medicationId][pharmacyId] = StockEntry
export type StockMap = Record<string, Record<string, StockEntry>>;

export interface AppState {
  // pharmacy id currently "de garde" (on call)
  dutyPharmacyId: string;
  stock: StockMap;
}
