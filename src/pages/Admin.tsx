import { useMemo, useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PHARMACIES } from "@/data/pharmacies";
import { MEDICATIONS } from "@/data/medications";
import { usePharma } from "@/store/PharmaStore";
import { AvailabilityStatus } from "@/types";
import { STATUS_LABELS, STATUS_ORDER, formatDate } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[00-\u036f]/g, "");
}

const Admin = () => {
  const { state, updateEntry, setDutyPharmacy, resetData } = usePharma();
  const { toast } = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [pharmacyId, setPharmacyId] = useState(PHARMACIES[0].id);
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = normalize(query.trim());
    return MEDICATIONS.filter((m) =>
      q ? normalize(`${m.name} ${m.dci} ${m.category}`).includes(q) : true
    );
  }, [query]);

  // Admin import handler (same format as pharmacist)
  async function handleFile(file?: File) {
    if (!file) return alert("Sélectionnez un fichier");
    const text = await file.text();
    let rows: any[] = [];
    try {
      if (file.name.endsWith(".json")) {
        rows = JSON.parse(text);
      } else {
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
      return alert("Format de fichier invalide");
    }

    for (const r of rows) {
      let med = MEDICATIONS.find((m) => m.id === r.id || m.id === r.medId);
      if (!med && r.name) {
        const n = r.name.toString().toLowerCase();
        med = MEDICATIONS.find((m) => m.name.toLowerCase() === n || m.dci?.toLowerCase() === n);
      }
      if (!med) continue;
      const status = (r.status || r.availability || "out") as any;
      const price = r.price === undefined || r.price === null || r.price === "" ? null : Number(r.price);
      updateEntry(med.id, pharmacyId, { status, price });
    }

    toast({ title: "Import terminé" });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Administration</h1>
          <p className="text-muted-foreground">
            Mettez à jour les disponibilités et la pharmacie de garde.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              resetData();
              toast({ title: "Données réinitialisées", description: "Les données de démonstration ont été restaurées." });
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Réinitialiser
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              logout();
              toast({ title: "Déconnecté", description: "Vous avez été déconnecté." });
              navigate('/');
            }}
          >
            Se déconnecter
          </Button>
        </div>
      </div>

      <Card className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Pharmacie à modifier</label>
          <Select value={pharmacyId} onValueChange={setPharmacyId}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PHARMACIES.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Pharmacie de garde</label>
          <Select value={state.dutyPharmacyId} onValueChange={(v) => { setDutyPharmacy(v); toast({ title: "Pharmacie de garde mise à jour" }); }}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PHARMACIES.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Importer un fichier</label>
          <input type="file" accept=".csv,.json" onChange={(e) => handleFile(e.target.files?.[0])} />
          <p className="text-xs text-muted-foreground mt-1">Format CSV (id,name,status,price) ou JSON (array d'objets)</p>
        </div>
      </Card>

      <div className="relative">
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
          {rows.map((med) => {
            const entry = state.stock[med.id]?.[pharmacyId];
            const status = entry?.status ?? "out";
            return (
              <div
                key={med.id}
                className="grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{med.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {med.dci} · {med.form}
                    {entry ? ` · maj ${formatDate(entry.updatedAt)}` : ""}
                  </p>
                </div>

                <Select
                  value={status}
                  onValueChange={(v) =>
                    updateEntry(med.id, pharmacyId, {
                      status: v as AvailabilityStatus,
                      ...(v === "out" ? { price: null } : {}),
                    })
                  }
                >
                  <SelectTrigger className="h-9 w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    step={50}
                    value={entry?.price ?? ""}
                    disabled={status === "out"}
                    onChange={(e) =>
                      updateEntry(med.id, pharmacyId, {
                        price: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    placeholder="Prix"
                    className="h-9 w-28"
                  />
                  <span className="text-xs text-muted-foreground">FCFA</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default Admin;
