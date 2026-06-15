import { useMemo, useState, useEffect } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { usePharmacies } from '@/hooks/usePharmacies';
import { Search, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
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
import { normalize } from "@/lib/format";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const ITEMS_PER_PAGE = 20;

const Admin = () => {
  const { state, updateEntry, setDutyPharmacy, resetData } = usePharma();
  const { toast } = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [pharmacyId, setPharmacyId] = useState(PHARMACIES[0].id);
  const [query, setQuery] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: pharmaciesData } = usePharmacies();
  const queryClient = useQueryClient();

  const rows = useMemo(() => {
    const q = normalize(query.trim());
    return MEDICATIONS.filter((m) =>
      q ? normalize(`${m.name} ${m.dci} ${m.category}`).includes(q) : true
    );
  }, [query]);

  // Reset to page 1 when query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  // Pagination logic
  const totalPages = Math.ceil(rows.length / ITEMS_PER_PAGE);
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return rows.slice(startIndex, endIndex);
  }, [rows, currentPage]);

  // form for editing pharmacy info
  const selectedPharmacy = (pharmaciesData || []).find((p) => p.id === pharmacyId);
  const [editName, setEditName] = useState(selectedPharmacy?.name ?? "");
  const [editAddress, setEditAddress] = useState(selectedPharmacy?.address ?? "");
  const [editPhone, setEditPhone] = useState(selectedPharmacy?.phone ?? "");
  const [editHours, setEditHours] = useState(selectedPharmacy?.hours ?? "");

  // sync when selection changes
  useEffect(() => {
    setEditName(selectedPharmacy?.name ?? "");
    setEditAddress(selectedPharmacy?.address ?? "");
    setEditPhone(selectedPharmacy?.phone ?? "");
    setEditHours(selectedPharmacy?.hours ?? "");
  }, [selectedPharmacy]);

  const { token } = useAuth();

  async function savePharmacy() {
    if (!token) {
      toast({ title: 'Erreur', description: 'Vous devez être connecté pour effectuer cette action.', variant: 'destructive' });
      return;
    }
    setIsUpdating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pharmacies/${encodeURIComponent(pharmacyId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName, address: editAddress, phone: editPhone, hours: editHours }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({ title: 'Erreur', description: err.message || 'Erreur lors de la mise à jour de la pharmacie.', variant: 'destructive' });
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['pharmacies'] });
      toast({ title: 'Succès', description: 'Pharmacie mise à jour avec succès.' });
    } catch (e) {
      toast({ title: 'Erreur', description: 'Erreur réseau lors de la mise à jour de la pharmacie.', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  }

  // Admin import handler (same format as pharmacist)
  async function handleFile(file?: File) {
    if (!file) {
      toast({ title: 'Erreur', description: 'Sélectionnez un fichier.', variant: 'destructive' });
      return;
    }
    
    setIsUpdating(true);
    const text = await file.text();
    let importRows: any[] = [];
    try {
      if (file.name.endsWith(".json")) {
        importRows = JSON.parse(text);
      } else {
        const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const header = lines.shift()?.split(",").map((h) => h.trim().toLowerCase()) || [];
        for (const line of lines) {
          const cols = line.split(",").map((c) => c.trim());
          const obj: any = {};
          header.forEach((h, i) => (obj[h] = cols[i]));
          importRows.push(obj);
        }
      }
    } catch (e) {
      toast({ title: 'Erreur', description: 'Format de fichier invalide.', variant: 'destructive' });
      setIsUpdating(false);
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const r of importRows) {
      let med = MEDICATIONS.find((m) => m.id === r.id || m.id === r.medId);
      if (!med && r.name) {
        const n = r.name.toString().toLowerCase();
        med = MEDICATIONS.find((m) => m.name.toLowerCase() === n || m.dci?.toLowerCase() === n);
      }
      if (!med) {
        errorCount++;
        continue;
      }
      
      const status = (r.status || r.availability || "out") as any;
      const price = r.price === undefined || r.price === null || r.price === "" ? null : Number(r.price);
      
      try {
        await updateEntry(med.id, pharmacyId, { status, price });
        successCount++;
      } catch (error) {
        console.error(`Erreur lors de la mise à jour de ${med.name}:`, error);
        errorCount++;
      }
    }

    setIsUpdating(false);
    toast({ 
      title: "Import terminé", 
      description: `${successCount} médicament(s) importé(s) avec succès. ${errorCount} erreur(s).` 
    });
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
              toast({ title: "Succès", description: "Les données de démonstration ont été restaurées." });
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
          <Select value={state.dutyPharmacyId} onValueChange={(v) => { 
            setDutyPharmacy(v).catch(() => {
              toast({ title: 'Erreur', description: 'Erreur lors de la mise à jour de la pharmacie de garde.', variant: 'destructive' });
            });
            toast({ title: "Succès", description: "Pharmacie de garde mise à jour." }); 
          }}>
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
          <input 
            type="file" 
            accept=".csv,.json" 
            onChange={(e) => handleFile(e.target.files?.[0])}
            disabled={isUpdating}
          />
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

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {rows.length > 0 
            ? `${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, rows.length)} sur ${rows.length} médicament(s)`
            : "Aucun médicament trouvé"
          }
        </span>
      </div>

      <Card className="overflow-hidden">
        <div className="divide-y">
          {paginatedRows.length > 0 ? (
            paginatedRows.map((med) => {
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
                    onValueChange={(v) => {
                      updateEntry(med.id, pharmacyId, {
                        status: v as AvailabilityStatus,
                        ...(v === "out" ? { price: null } : {}),
                      }).catch(() => {
                        toast({ title: 'Erreur', description: 'Erreur lors de la mise à jour du statut.', variant: 'destructive' });
                      });
                    }}
                    disabled={isUpdating}
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
                      disabled={status === "out" || isUpdating}
                      onChange={(e) =>
                        updateEntry(med.id, pharmacyId, {
                          price: e.target.value === "" ? null : Number(e.target.value),
                        }).catch(() => {
                          toast({ title: 'Erreur', description: 'Erreur lors de la mise à jour du prix.', variant: 'destructive' });
                        })
                      }
                      placeholder="Prix"
                      className="h-9 w-28"
                    />
                    <span className="text-xs text-muted-foreground">FCFA</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-10 text-center text-muted-foreground">
              Aucun médicament ne correspond à votre recherche.
            </div>
          )}
        </div>
      </Card>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="w-10"
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Admin;
