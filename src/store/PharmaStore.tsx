import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AppState, AvailabilityStatus, StockEntry } from "@/types";
import { buildInitialState, buildSeedStock } from "@/data/seed";
import { MEDICATIONS } from "@/data/medications";

const STORAGE_KEY = "pharma-ebolowa-state-v1";

interface PharmaContextValue {
  state: AppState;
  getEntry: (medId: string, pharmacyId: string) => StockEntry | undefined;
  updateEntry: (
    medId: string,
    pharmacyId: string,
    patch: Partial<StockEntry>
  ) => void;
  setDutyPharmacy: (pharmacyId: string) => void;
  resetData: () => void;
}

const PharmaContext = createContext<PharmaContextValue | null>(null);

function loadState(): AppState {
  if (typeof window === "undefined") return buildInitialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildInitialState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.stock || !parsed.dutyPharmacyId) return buildInitialState();
    // Compléter d'éventuels nouveaux médicaments absents du stock sauvegardé.
    const seed = buildSeedStock();
    for (const med of MEDICATIONS) {
      if (!parsed.stock[med.id]) parsed.stock[med.id] = seed[med.id];
    }
    return parsed;
  } catch {
    return buildInitialState();
  }
}

export function PharmaProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state]);

  const value = useMemo<PharmaContextValue>(
    () => ({
      state,
      getEntry: (medId, pharmacyId) => state.stock[medId]?.[pharmacyId],
      updateEntry: (medId, pharmacyId, patch) =>
        setState((prev) => {
          const prevEntry: StockEntry =
            prev.stock[medId]?.[pharmacyId] ?? {
              status: "out" as AvailabilityStatus,
              price: null,
              updatedAt: new Date().toISOString(),
            };
          const nextEntry: StockEntry = {
            ...prevEntry,
            ...patch,
            updatedAt: new Date().toISOString(),
          };
          return {
            ...prev,
            stock: {
              ...prev.stock,
              [medId]: { ...prev.stock[medId], [pharmacyId]: nextEntry },
            },
          };
        }),
      setDutyPharmacy: (pharmacyId) =>
        setState((prev) => ({ ...prev, dutyPharmacyId: pharmacyId })),
      resetData: () => setState(buildInitialState()),
    }),
    [state]
  );

  return <PharmaContext.Provider value={value}>{children}</PharmaContext.Provider>;
}

export function usePharma(): PharmaContextValue {
  const ctx = useContext(PharmaContext);
  if (!ctx) throw new Error("usePharma must be used within PharmaProvider");
  return ctx;
}
