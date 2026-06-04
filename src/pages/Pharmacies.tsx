import { useMemo } from "react";
import { PharmacyCard } from "@/components/PharmacyCard";
import { PHARMACIES } from "@/data/pharmacies";
import { MEDICATIONS } from "@/data/medications";
import { usePharma } from "@/store/PharmaStore";

const Pharmacies = () => {
  const { state } = usePharma();

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const ph of PHARMACIES) c[ph.id] = 0;
    for (const med of MEDICATIONS) {
      for (const ph of PHARMACIES) {
        const entry = state.stock[med.id]?.[ph.id];
        if (entry && (entry.status === "available" || entry.status === "low")) c[ph.id] += 1;
      }
    }
    return c;
  }, [state.stock]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pharmacies d'Ebolowa</h1>
        <p className="text-muted-foreground">
          Les 7 pharmacies de la ville, leurs coordonnées et leur stock.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PHARMACIES.map((ph) => (
          <PharmacyCard
            key={ph.id}
            pharmacy={ph}
            isDuty={ph.id === state.dutyPharmacyId}
            availableCount={counts[ph.id]}
          />
        ))}
      </div>
    </div>
  );
};

export default Pharmacies;
