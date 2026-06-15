import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AppState, AvailabilityStatus, StockEntry, Medication, Pharmacy } from "@/types";
import { buildInitialState, buildSeedStock } from "@/data/seed";
import { useMedications } from "@/hooks/useMedications";
import { usePharmacies } from "@/hooks/usePharmacies";
import { useQueryClient } from "@tanstack/react-query";

const STORAGE_KEY = "pharma-ebolowa-state-v1";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface PharmaContextValue {
  state: AppState;
  getEntry: (medId: string, pharmacyId: string) => StockEntry | undefined;
  updateEntry: (
    medId: string,
    pharmacyId: string,
    patch: Partial<StockEntry>
  ) => Promise<void>;
  setDutyPharmacy: (pharmacyId: string) => Promise<void>;
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
  const queryClient = useQueryClient();

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
      state: state || buildInitialState(medications || [], pharmacies || []),
      getEntry: (medId, pharmacyId) => state?.stock[medId]?.[pharmacyId],
      updateEntry: async (medId, pharmacyId, patch) => {
        // Récupérer le token d'authentification
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found.');
          throw new Error('Authentication required');
        }

        try {
          // Appeler l'API pour mettre à jour le stock
          const response = await fetch(
            `${API_BASE_URL}/api/stock/${encodeURIComponent(medId)}/${encodeURIComponent(pharmacyId)}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify(patch),
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to update stock via API');
          }

          // Mettre à jour l'état local après la réussite de l'API
          setState((prev) => {
            if (!prev) return null;
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
          });

          // Invalider les requêtes React Query liées au stock
          queryClient.invalidateQueries({ queryKey: ['stock'] });
        } catch (error) {
          console.error('Error updating stock:', error);
          throw error;
        }
      },
      setDutyPharmacy: async (pharmacyId) => {
        // Récupérer le token d'authentification
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found.');
          throw new Error('Authentication required');
        }

        try {
          // Appeler l'API pour mettre à jour la pharmacie de garde (si l'endpoint existe)
          // Pour l'instant, on met à jour localement seulement
          setState((prev) => (prev ? { ...prev, dutyPharmacyId: pharmacyId } : null));
          
          // Invalider les requêtes React Query
          queryClient.invalidateQueries({ queryKey: ['pharmacies'] });
        } catch (error) {
          console.error('Error updating duty pharmacy:', error);
          throw error;
        }
      },
      resetData: () => setState(buildInitialState(medications || [], pharmacies || [])),
      isLoading,
      isError,
    }),
    [state, medications, pharmacies, isLoading, isError, queryClient]
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
