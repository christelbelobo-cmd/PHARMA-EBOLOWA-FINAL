import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AppState, AvailabilityStatus, StockEntry, Medication, Pharmacy } from "@/types";
import { buildInitialState, buildSeedStock } from "@/data/seed";
import { useMedications } from "@/hooks/useMedications";
import { usePharmacies } from "@/hooks/usePharmacies";

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
  isLoading: boolean;
  isError: boolean;
}

const PharmaContext = createContext<PharmaContextValue | null>(null);

function loadState(medications: Medication[], pharmacies: Pharmacy[]): AppState {
  if (typeof window === "undefined") return buildInitialState(medications, pharmacies);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildInitialState(medications, pharmacies);
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.stock || !parsed.dutyPharmacyId) return buildInitialState(medications, pharmacies);
    // Compléter d'éventuels nouveaux médicaments absents du stock sauvegardé.
    const seed = buildSeedStock(medications, pharmacies);
    for (const med of medications) {
      if (!parsed.stock[med.id]) parsed.stock[med.id] = seed[med.id];
    }
    return parsed;
  } catch {
    return buildInitialState(medications, pharmacies);
  }
}

export function PharmaProvider({ children }: { children: React.ReactNode }) {
  const { data: medications, isLoading: isLoadingMedications, isError: isErrorMedications } = useMedications();
  const { data: pharmacies, isLoading: isLoadingPharmacies, isError: isErrorPharmacies } = usePharmacies();

  const isLoading = isLoadingMedications || isLoadingPharmacies;
  const isError = isErrorMedications || isErrorPharmacies;

  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    if (medications && pharmacies && !state) {
      setState(loadState(medications, pharmacies));
    }
  }, [medications, pharmacies, state]);

  useEffect(() => {
    if (state) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // ignore quota errors
      }
    }
  }, [state]);

  const value = useMemo<PharmaContextValue>(
    () => ({
      state: state || buildInitialState(medications || [], pharmacies || []), // Provide a default empty state if not loaded yet
      getEntry: (medId, pharmacyId) => state?.stock[medId]?.[pharmacyId],
      updateEntry: (medId, pharmacyId, patch) =>
        setState((prev) => {
          if (!prev) return null; // Should not happen if state is initialized
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

          // optimistic local update
          const nextState = {
            ...prev,
            stock: {
              ...prev.stock,
              [medId]: { ...prev.stock[medId], [pharmacyId]: nextEntry },
            },
          };

          // attempt to sync with backend if token is present
          try {
            const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
            if (token) {
              // send patch (no await - fire and forget)
              fetch(`http://localhost:5000/api/stock/${encodeURIComponent(medId)}/${encodeURIComponent(pharmacyId)}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: nextEntry.status, price: nextEntry.price }),
              }).then((res) => {
                if (!res.ok) console.error('Failed to sync stock update', res.statusText);
              }).catch((err) => console.error('Network error syncing stock update', err));
            }
          } catch (e) {
            console.error('Error while attempting to sync update', e);
          }

          return nextState;
        }),
      setDutyPharmacy: (pharmacyId) =>
        setState((prev) => (prev ? { ...prev, dutyPharmacyId: pharmacyId } : null)),
      resetData: () => setState(buildInitialState(medications || [], pharmacies || [])),
      isLoading,
      isError,
    }),
    [state, medications, pharmacies, isLoading, isError]
  );

  if (isLoading) {
    return <div>Chargement des données...</div>;
  }

  if (isError) {
    return <div>Erreur lors du chargement des données.</div>;
  }

  if (!state) {
    return <div>Initialisation de l'application...</div>;
  }

  return <PharmaContext.Provider value={value}>{children}</PharmaContext.Provider>;
}

export function usePharma(): PharmaContextValue {
  const ctx = useContext(PharmaContext);
  if (!ctx) throw new Error("usePharma must be used within PharmaProvider");
  return ctx;
}
