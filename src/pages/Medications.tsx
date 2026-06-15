import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { usePharma } from "@/store/PharmaStore";
import { AvailabilityStatus, MedicationCategory } from "@/types";
import { formatPrice, STATUS_ORDER, normalize } from "@/lib/format";
import { useMedications } from "@/hooks/useMedications";
import { usePharmacies } from "@/hooks/usePharmacies";
import { useDebounce } from "@/hooks/useDebounce";

const CATEGORIES: (MedicationCategory | "all")[] = [
  "all",
  "Antalgique",
  "Antibiotique",
  "Antipaludique",
  "Anti-inflammatoire",
  "Gastro",
  "Vitamines",
  "Dermatologie",
  "Cardiologie",
  "Diabète",
  "Respiratoire",
  "Autre",
];

const Medications = () => {
  const [params, setParams] = useSearchParams();
  const { state } = usePharma();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState<MedicationCategory | "all">(
    (params.get("category") as MedicationCategory | "all") ?? "all"
  );
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available_at_least_one">(
    (params.get("availability") as "all" | "available_at_least_one") ?? "all"
  );

  // Debounce la recherche pour éviter les calculs trop fréquents
  const debouncedQuery = useDebounce(query, 300);

  const { data: medications, isLoading: isLoadingMedications, isError: isErrorMedications } = useMedications();
  const { data: pharmacies, isLoading: isLoadingPharmacies, isError: isErrorPharmacies } = usePharmacies();

  const isLoading = isLoadingMedications || isLoadingPharmacies;
  const isError = isErrorMedications || isErrorPharmacies;

  const AVAILABILITY_FILTERS = [
    { value: "all", label: "Tous les statuts" },
    { value: "available_at_least_one", label: "Disponibles (au moins 1 pharmacie)" },
  ];

  // Mise à jour de l'URL avec le query débouncé
  useEffect(() => {
    const next = new URLSearchParams(params);
    if (debouncedQuery) next.set("q", debouncedQuery);
    else next.delete("q");
    if (category !== "all") next.set("category", category);
    else next.delete("category");
    if (availabilityFilter !== "all") next.set("availability", availabilityFilter);
    else next.delete("availability");
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, category, availabilityFilter]);

  const results = useMemo(() => {
    if (isLoading || isError || !medications || !pharmacies) return [];
    const q = normalize(debouncedQuery.trim());
    return medications.filter((m) => {
      if (category !== "all" && m.category !== category) return false;
      if (q && !normalize(`${m.name} ${m.dci} ${m.category}`).includes(q))
        return false;
      return true;
    }).map((m) => {
      const byStatus = pharmacies.map((ph) => ({
        pharmacy: ph,
        entry: state.stock[m.id]?.[ph.id],
      }));
      const availablePharmacies = byStatus
        .filter(
          (x) => x.entry && (x.entry.status === "available" || x.entry.status === "low")
        )
        .sort((a, b) => {
          const sa = STATUS_ORDER.indexOf(a.entry!.status as AvailabilityStatus);
          const sb = STATUS_ORDER.indexOf(b.entry!.status as AvailabilityStatus);
          return sa - sb;
        });
      return { med: m, byStatus, availableCount: availablePharmacies.length };
    }).filter((r) => {
      if (availabilityFilter === "available_at_least_one" && r.availableCount === 0) return false;
      return true;
    });
  }, [debouncedQuery, category, availabilityFilter, state.stock, medications, pharmacies, isLoading, isError]);

  if (isLoading) {
    return <div>Chargement des médicaments...</div>;
  }

  if (isError) {
    return <div>Erreur lors du chargement des médicaments.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rechercher un médicament</h1>
        <p className="text-muted-foreground">
          Trouvez dans quelles pharmacies un médicament est disponible.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom ou DCI du médicament…"
            className="h-11 pl-10"
          />
        </div>
        <Select value={category} onValueChange={(v) => setCategory(v as MedicationCategory | "all")}>
          <SelectTrigger className="h-11 md:w-56">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c === "all" ? "Toutes les catégories" : c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={availabilityFilter} onValueChange={(v) => setAvailabilityFilter(v as "all" | "available_at_least_one")}>
          <SelectTrigger className="h-11 md:w-56">
            <SelectValue placeholder="Disponibilité" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABILITY_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        {results.length} médicament{results.length > 1 ? "s" : ""} trouvé
        {results.length > 1 ? "s" : ""}
      </p>

      <div className="space-y-4">
        {results.map(({ med, byStatus, availableCount }) => (
          <Card key={med.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold">{med.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {med.dci} · {med.form} · {med.category}
                </p>
              </div>
              <span className="text-sm">
                <span className="font-semibold text-success">{availableCount}</span>
                <span className="text-muted-foreground"> / {pharmacies?.length || 0} pharmacies</span>
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {byStatus.map(({ pharmacy, entry }) => (
                <Link
                  key={pharmacy.id}
                  to={`/pharmacies/${pharmacy.id}`}
                  className="flex items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-sm hover:border-primary/50"
                >
                  <span className="truncate">
                    <span className="font-medium">{pharmacy.name}</span>
                    {entry && entry.status !== "out" && (
                      <span className="ml-1 text-muted-foreground">
                        {formatPrice(entry.price)}
                      </span>
                    )}
                  </span>
                  <AvailabilityBadge status={entry?.status ?? "out"} />
                </Link>
              ))}
            </div>
          </Card>
        ))}

        {results.length === 0 && (
          <Card className="p-10 text-center text-muted-foreground">
            Aucun médicament ne correspond à votre recherche.
          </Card>
        )}
      </div>
    </div>
  );
};

export default Medications;
