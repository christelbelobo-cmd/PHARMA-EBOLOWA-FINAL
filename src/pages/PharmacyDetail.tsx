import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin, Phone, Clock, ShieldCheck, ArrowLeft, Search, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { getPharmacy } from "@/data/pharmacies";
import { MEDICATIONS } from "@/data/medications";
import { usePharma } from "@/store/PharmaStore";
import { formatPrice, formatDate, STATUS_ORDER } from "@/lib/format";
import { AvailabilityStatus } from "@/types";
import { useEffect } from "react";

// Fonction de normalisation pour les recherches
const normalize = (s: string): string => {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const PharmacyDetail = () => {
  const { id = "" } = useParams();
  const pharmacy = getPharmacy(id);
  const { state } = usePharma();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = normalize(query.trim());
    return MEDICATIONS.filter((m) =>
      q ? normalize(`${m.name} ${m.dci} ${m.category}`).includes(q) : true
    )
      .map((m) => ({ med: m, entry: state.stock[m.id]?.[id] }))
      .sort((a, b) => {
        const sa = STATUS_ORDER.indexOf((a.entry?.status ?? "out") as AvailabilityStatus);
        const sb = STATUS_ORDER.indexOf((b.entry?.status ?? "out") as AvailabilityStatus);
        if (sa !== sb) return sa - sb;
        return a.med.name.localeCompare(b.med.name);
      });
  }, [query, state.stock, id]);

  if (!pharmacy) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-semibold">Pharmacie introuvable.</p>
        <Link to="/pharmacies" className="mt-4 inline-block text-primary hover:underline">
          ← Retour aux pharmacies
        </Link>
      </div>
    );
  }

  const isDuty = state.dutyPharmacyId === pharmacy.id;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${pharmacy.lat},${pharmacy.lng}`;

  return (
    <div className="space-y-6">
      <Link to="/pharmacies" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Retour aux pharmacies
      </Link>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{pharmacy.name}</h1>
            <p className="text-muted-foreground">{pharmacy.quartier}</p>
          </div>
          {isDuty && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <ShieldCheck className="h-4 w-4" /> Pharmacie de garde
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {pharmacy.address}
          </p>
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0" />
            <a href={`tel:${pharmacy.phone.replace(/\s/g, "")}`} className="hover:text-primary">
              {pharmacy.phone}
            </a>
          </p>
          <p className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" /> {pharmacy.hours}
          </p>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 hover:text-primary"
          >
            <ExternalLink className="h-4 w-4 shrink-0" /> Voir sur la carte
          </a>
        </div>
      </Card>

      <div>
        <h2 className="mb-3 text-xl font-bold">Disponibilité des médicaments</h2>
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrer un médicament…"
            className="h-11 pl-10"
          />
        </div>

        <Card className="overflow-hidden">
          <div className="divide-y">
            {rows.map(({ med, entry }) => (
              <div key={med.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{med.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {med.dci} · {med.form}
                    {entry ? ` · maj ${formatDate(entry.updatedAt)}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="hidden text-sm text-muted-foreground sm:inline">
                    {formatPrice(entry?.price ?? null)}
                  </span>
                  <AvailabilityBadge status={entry?.status ?? "out"} />
                </div>
              </div>
            ))}
            {rows.length === 0 && (
              <div className="px-4 py-10 text-center text-muted-foreground">
                Aucun médicament ne correspond.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PharmacyDetail;
