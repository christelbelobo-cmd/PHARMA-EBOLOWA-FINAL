import { useMemo, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin, Phone, Clock, ShieldCheck, ArrowLeft, Search, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { usePharma } from "@/store/PharmaStore";
import { formatPrice, formatDate, STATUS_ORDER } from "@/lib/format";
import { AvailabilityStatus } from "@/types";
import { usePharmacies } from "@/hooks/usePharmacies";
import { useMedications } from "@/hooks/useMedications";
import { useQueryClient } from '@tanstack/react-query';
import MAPS_URLS from "@/data/mapsUrls";
import MAPS_METADATA from "@/data/mapsMetadata";
import { useAuth } from "@/hooks/useAuth";

// Fonction de normalisation pour les recherches
const normalize = (s: string): string => {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const PharmacyDetail = () => {
  const { id = "" } = useParams();
  const { state, updateEntry } = usePharma();
  const [query, setQuery] = useState("");

  const { data: pharmacies, isLoading: isLoadingPharmacies, isError: isErrorPharmacies } = usePharmacies();
  const { data: medications, isLoading: isLoadingMedications, isError: isErrorMedications } = useMedications();

  const { token, role, pharmacyId: authPharmacyId, logout } = useAuth();

  // When pharmacist leaves their pharmacy page, revert to regular user
  useEffect(() => {
    return () => {
      if (role === "pharmacist" && authPharmacyId === id) {
        logout();
      }
    };
  }, [role, authPharmacyId, id, logout]);

  const isLoading = isLoadingPharmacies || isLoadingMedications;
  const isError = isErrorPharmacies || isErrorMedications;

  const pharmacy = useMemo(() => {
    if (isLoading || isError || !pharmacies) return undefined;
    return pharmacies.find((p) => p.id === id);
  }, [id, pharmacies, isLoading, isError]);

  const rows = useMemo(() => {
    if (isLoading || isError || !medications || !pharmacy) return [];
    const q = normalize(query.trim());
    return medications.filter((m) =>
      q ? normalize(`${m.name} ${m.dci} ${m.category}`).includes(q) : true
    )
      .map((m) => ({ med: m, entry: state.stock[m.id]?.[id] }))
      .sort((a, b) => {
        const sa = STATUS_ORDER.indexOf((a.entry?.status ?? "out") as AvailabilityStatus);
        const sb = STATUS_ORDER.indexOf((b.entry?.status ?? "out") as AvailabilityStatus);
        if (sa !== sb) return sa - sb;
        return a.med.name.localeCompare(b.med.name);
      });
  }, [query, state.stock, id, medications, pharmacy, isLoading, isError]);

  if (isLoading) {
    return <div>Chargement des détails de la pharmacie...</div>;
  }

  if (isError) {
    return <div>Erreur lors du chargement des détails de la pharmacie.</div>;
  }

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

  const meta = (MAPS_METADATA as any)[pharmacy.id] || null;
  const isDuty = state.dutyPharmacyId === pharmacy.id;
  // Prefer explicit URL overrides (backend-provided, local mapping, or metadata)
  const explicitMapUrl = (pharmacy as any).mapsUrl || MAPS_URLS[pharmacy.id] || meta?.mapsUrl;

  let mapsUrl = "#";
  if (explicitMapUrl && explicitMapUrl.trim().length > 0) {
    mapsUrl = explicitMapUrl;
  } else {
    const hasAddress = (meta?.address ?? pharmacy.address) && (meta?.address ?? pharmacy.address).trim().length > 0;
    const mapsQuery = hasAddress
      ? `${meta?.address ?? pharmacy.address}${pharmacy.quartier ? ', ' + pharmacy.quartier : ''}`
      : (pharmacy.lat && pharmacy.lng ? `${pharmacy.lat},${pharmacy.lng}` : "");
    mapsUrl = mapsQuery
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`
      : '#';
  }

  const displayPhone = meta?.phone ?? pharmacy.phone;
  const displayHours = meta?.hours ?? pharmacy.hours;
  const displayAddress = meta?.address ?? pharmacy.address;

  const queryClient = useQueryClient();

  // Edit mode for pharmacist
  const canEditPharmacy = (role === 'pharmacist' && authPharmacyId === pharmacy.id) || role === 'admin';
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(pharmacy.name);
  const [editAddress, setEditAddress] = useState(displayAddress || "");
  const [editPhone, setEditPhone] = useState(displayPhone || "");
  const [editHours, setEditHours] = useState(displayHours || "");

  useEffect(() => {
    setEditName(pharmacy.name);
    setEditAddress(displayAddress || "");
    setEditPhone(displayPhone || "");
    setEditHours(displayHours || "");
  }, [pharmacy, displayAddress, displayPhone, displayHours]);

  async function savePharmacyInfo() {
    if (!token) return alert('Vous devez être connecté');
    try {
      const res = await fetch(`http://localhost:5000/api/pharmacies/${encodeURIComponent(pharmacy.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName, address: editAddress, phone: editPhone, hours: editHours }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return alert(err.message || 'Erreur');
      }
      await queryClient.invalidateQueries(['pharmacies']);
      alert('Informations mises à jour');
      setEditing(false);
    } catch (e) {
      alert('Erreur réseau');
    }
  }

  // Upload handler for pharmacist (upload CSV or JSON)
  async function handleFile(file?: File) {
    if (!file || !medications) return;
    const text = await file.text();
    let rows: any[] = [];
    try {
      if (file.name.endsWith(".json")) {
        rows = JSON.parse(text);
      } else {
        // simple CSV parser: expect header with id,name,status,price
        const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const header = lines.shift()?.split(",").map((h) => h.trim().toLowerCase()) || [];
        for (const line of lines) {
          const cols = line.split(",").map((c) => c.trim());
          const obj: any = {};
          header.forEach((h, i) => (obj[h] = cols[i]));
          rows.push(obj);
        }
      }
    } catch (e) {
      alert("Format de fichier invalide");
      return;
    }

    // Apply updates
    for (const r of rows) {
      // try by id first
      let med = medications.find((m) => m.id === r.id || m.id === r.medId);
      if (!med && r.name) {
        const n = r.name.toString().toLowerCase();
        med = medications.find((m) => m.name.toLowerCase() === n || m.dci?.toLowerCase() === n);
      }
      if (!med) continue;
      const status = (r.status || r.availability || "out") as any;
      const price = r.price === undefined || r.price === null || r.price === "" ? null : Number(r.price);
      updateEntry(med.id, pharmacy.id, { status, price });
    }

    alert("Import terminé");
  }

  const canUpload = role === "pharmacist" && authPharmacyId === pharmacy.id;

  return (
    <div className="space-y-6">
      <Link to="/pharmacies" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Retour aux pharmacies
      </Link>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-4">
            {meta?.images?.length ? (
              // show first image if available
              <img src={meta.images[0]} alt={`${pharmacy.name}`} className="h-20 w-20 rounded object-cover" />
            ) : null}
            <div>
              <h1 className="text-2xl font-bold">{pharmacy.name}</h1>
              <p className="text-muted-foreground">{pharmacy.quartier}</p>
            </div>
          </div>
          {isDuty && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <ShieldCheck className="h-4 w-4" /> Pharmacie de garde
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {displayAddress}
          </p>
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0" />
            <a href={`tel:${(displayPhone || "").replace(/\s/g, "")}`} className="hover:text-primary">
              {displayPhone}
            </a>
          </p>
          <p className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" /> {displayHours}
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

      {canUpload && (
        <Card className="p-4">
          <h3 className="mb-2 font-medium">Importer un fichier de stock</h3>
          <p className="text-xs text-muted-foreground mb-3">Format accepté : CSV (id,name,status,price) ou JSON (array d'objets avec id/name/status/price)</p>
          <input
            type="file"
            accept=".csv,.json"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </Card>
      )}

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
