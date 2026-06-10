import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PharmacyCard } from "@/components/PharmacyCard";
import { usePharma } from "@/store/PharmaStore";
import { normalize } from "@/lib/format";
import { usePharmacies } from "@/hooks/usePharmacies";
import { useMedications } from "@/hooks/useMedications";

const Pharmacies = () => {
  const [params, setParams] = useSearchParams();
  const { state } = usePharma();
  const [query, setQuery] = useState(params.get("q") ?? "");

  const { data: pharmacies, isLoading: isLoadingPharmacies, isError: isErrorPharmacies } = usePharmacies();
  const { data: medications, isLoading: isLoadingMedications, isError: isErrorMedications } = useMedications();

  const isLoading = isLoadingPharmacies || isLoadingMedications;
  const isError = isErrorPharmacies || isErrorMedications;

  useEffect(() => {
    const next = new URLSearchParams(params);
    if (query) next.set("q", query);
    else next.delete("q");
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const filteredPharmacies = useMemo(() => {
    if (isLoading || isError || !pharmacies) return [];
    const q = normalize(query.trim());
    return pharmacies.filter((ph) => {
      if (q && !normalize(`${ph.name} ${ph.address} ${ph.city}`).includes(q)) {
        return false;
      }
      return true;
    });
  }, [query, pharmacies, isLoading, isError]);

  const counts = useMemo(() => {
    if (isLoading || isError || !pharmacies || !medications) return {};
    const c: Record<string, number> = {};
    for (const ph of pharmacies) c[ph.id] = 0; // Initialize counts for all pharmacies
    for (const med of medications) {
      for (const ph of pharmacies) {
        const entry = state.stock[med.id]?.[ph.id];
        if (entry && (entry.status === "available" || entry.status === "low"))
          c[ph.id] += 1;
      }
    }
    return c;
  }, [state.stock, pharmacies, medications, isLoading, isError]);

  if (isLoading) {
    return <div>Chargement des pharmacies...</div>;
  }

  if (isError) {
    return <div>Erreur lors du chargement des pharmacies.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pharmacies d'Ebolowa</h1>
        <p className="text-muted-foreground">
          Les pharmacies de la ville, leurs coordonnées et leur stock.
        </p>
      </div>

      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nom de la pharmacie ou quartier…"
          className="h-11 pl-10"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {filteredPharmacies.length} pharmacie
        {filteredPharmacies.length > 1 ? "s" : ""} trouvée
        {filteredPharmacies.length > 1 ? "s" : ""}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPharmacies.length > 0 ? (
          filteredPharmacies.map((ph) => (
            <PharmacyCard
              key={ph.id}
              pharmacy={ph}
              isDuty={ph.id === state.dutyPharmacyId}
              availableCount={counts[ph.id]}
            />
          ))
        ) : (
          <div className="col-span-full">
            <div className="rounded-md border p-10 text-center text-muted-foreground">
              Aucune pharmacie ne correspond à votre recherche.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pharmacies;
