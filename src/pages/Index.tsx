import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, Pill, Store, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PharmacyCard } from "@/components/PharmacyCard";
import { PHARMACIES, getPharmacy } from "@/data/pharmacies";
import { MEDICATIONS } from "@/data/medications";
import { usePharma } from "@/store/PharmaStore";

const Index = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { state } = usePharma();

  const availableCountByPharmacy = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ph of PHARMACIES) counts[ph.id] = 0;
    for (const med of MEDICATIONS) {
      for (const ph of PHARMACIES) {
        const entry = state.stock[med.id]?.[ph.id];
        if (entry && (entry.status === "available" || entry.status === "low")) {
          counts[ph.id] += 1;
        }
      }
    }
    return counts;
  }, [state.stock]);

  const dutyPharmacy = getPharmacy(state.dutyPharmacyId);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/medicaments${query ? `?q=${encodeURIComponent(query)}` : ""}`);
  };

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="rounded-2xl bg-gradient-to-br from-primary to-primary-glow px-6 py-10 text-primary-foreground shadow-lg md:px-10 md:py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold md:text-4xl">
            Trouvez vos médicaments à Ebolowa
          </h1>
          <p className="mt-3 text-primary-foreground/90">
            Vérifiez en temps réel la disponibilité des médicaments dans les 7 pharmacies de la ville.
          </p>
          <form onSubmit={onSearch} className="mt-6 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex : Paracétamol, Coartem, Amoxicilline…"
                className="h-12 bg-background pl-10 text-foreground"
              />
            </div>
            <Button type="submit" size="lg" variant="secondary" className="h-12">
              Rechercher
            </Button>
          </form>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4 p-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Store className="h-6 w-6" />
          </span>
          <div>
            <p className="text-2xl font-bold">{PHARMACIES.length}</p>
            <p className="text-sm text-muted-foreground">Pharmacies couvertes</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Pill className="h-6 w-6" />
          </span>
          <div>
            <p className="text-2xl font-bold">{MEDICATIONS.length}+</p>
            <p className="text-sm text-muted-foreground">Médicaments référencés</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <p className="text-base font-bold">{dutyPharmacy?.name ?? "—"}</p>
            <p className="text-sm text-muted-foreground">Pharmacie de garde</p>
          </div>
        </Card>
      </section>

      {/* Pharmacies */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Les pharmacies d'Ebolowa</h2>
          <Link to="/pharmacies" className="text-sm font-medium text-primary hover:underline">
            Tout voir →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PHARMACIES.map((ph) => (
            <PharmacyCard
              key={ph.id}
              pharmacy={ph}
              isDuty={ph.id === state.dutyPharmacyId}
              availableCount={availableCountByPharmacy[ph.id]}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
