import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Package, Activity, Pill, Store } from "lucide-react";
import { trpc } from "@/lib/trpc";
import axios from "axios";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

const statusConfig = {
  available: { label: "Disponible", color: "bg-green-100 text-green-800 border-green-200" },
  low_stock: { label: "Stock faible", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  on_order: { label: "Sur commande", color: "bg-blue-100 text-blue-800 border-blue-200" },
  out_of_stock: { label: "Rupture", color: "bg-red-100 text-red-800 border-red-200" },
};

export default function Admin() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"stock" | "duty">("stock");
  const [selectedMedication, setSelectedMedication] = useState<number | null>(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: medications = [], refetch: refetchMeds } = trpc.medication.list.useQuery();
  const { data: pharmacies = [], refetch: refetchPharmacies } = trpc.pharmacy.list.useQuery();
  const { data: stock = [], refetch: refetchStock } = trpc.stock.list.useQuery();
  
  const stockUpdateMutation = trpc.stock.update.useMutation();
  const pharmacySetDutyMutation = trpc.pharmacy.setDuty.useMutation();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setLocation("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== "admin" && parsedUser.role !== "pharmacist") {
      setLocation("/");
      return;
    }

    setUser(parsedUser);
  }, [setLocation]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Veuillez sélectionner un fichier CSV à importer.");
      return;
    }

    setIsUploading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post("/api/upload-data", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setSuccess(response.data.message || "Données importées avec succès !");
      setSelectedFile(null);
      refetchStock();
      refetchMeds();
      refetchPharmacies();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Erreur lors de l'importation du fichier.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateStock = async () => {
    if (!selectedMedication || !selectedPharmacy || !status) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      setError("");
      setSuccess("");
      await stockUpdateMutation.mutateAsync({
        medicationId: selectedMedication,
        pharmacyId: selectedPharmacy,
        status: status as any,
        price: price ? parseFloat(price) : undefined,
      });
      setSuccess("Stock mis à jour avec succès");
      refetchStock();
      setSelectedMedication(null);
      setSelectedPharmacy(null);
      setStatus("");
      setPrice("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
    }
  };

  const handleSetDutyPharmacy = async (pharmacyId: number) => {
    try {
      setError("");
      setSuccess("");
      await pharmacySetDutyMutation.mutateAsync(pharmacyId);
      setSuccess("Pharmacie de garde mise à jour avec succès");
      refetchPharmacies();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
    }
  };

  if (!user) {
    return (
      <div className="h-screen w-full bg-slate-50 flex flex-col">
        <PublicHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-gray-500 font-medium">Chargement du tableau de bord...</p>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const currentStock = selectedMedication && selectedPharmacy
    ? stock.find(
        (s) =>
          s.medicationId === selectedMedication &&
          s.pharmacyId === selectedPharmacy
      )
    : null;

  const totalRuptures = stock.filter(s => s.status === "out_of_stock").length;

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col font-sans">
      <PublicHeader />

      {/* Mini Barre de Stats */}
      <section className="bg-white border-b px-4 py-3 flex-none shadow-sm">
        <div className="max-w-7xl mx-auto grid grid-cols-3 divide-x divide-slate-100 text-center">
          <div className="py-1">
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center justify-center gap-1"><Store size={12}/> Officines</p>
            <p className="text-base font-extrabold text-slate-800">{pharmacies.length}</p>
          </div>
          <div className="py-1">
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center justify-center gap-1"><Pill size={12}/> Catalogue</p>
            <p className="text-base font-extrabold text-slate-800">{medications.length}</p>
          </div>
          <div className="py-1">
            <p className="text-[10px] uppercase font-bold tracking-wider text-red-400 flex items-center justify-center gap-1"><AlertCircle size={12}/> Ruptures</p>
            <p className="text-base font-extrabold text-red-600">{totalRuptures}</p>
          </div>
        </div>
      </section>

      {/* Zone de Navigation Admin */}
      <div className="bg-white border-b sticky top-[65px] z-30">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold text-gray-900">Gestion</h2>
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <Button
                variant={activeTab === "stock" ? "default" : "ghost"}
                size="sm"
                className={`text-xs font-bold h-7 ${activeTab === "stock" ? "bg-white text-indigo-700 shadow-sm hover:bg-white" : "text-gray-600"}`}
                onClick={() => setActiveTab("stock")}
              >
                <Package size={13} className="mr-1" /> Stocks
              </Button>
              <Button
                variant={activeTab === "duty" ? "default" : "ghost"}
                size="sm"
                className={`text-xs font-bold h-7 ${activeTab === "duty" ? "bg-white text-indigo-700 shadow-sm hover:bg-white" : "text-gray-600"}`}
                onClick={() => setActiveTab("duty")}
              >
                <Activity size={13} className="mr-1" /> Tour de Garde
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
               {user.role === "admin" ? "Administrateur" : "Pharmacien"}
             </Badge>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
        {/* Formulaires d'action */}
        <div className="w-full md:w-[400px] flex flex-col gap-6">
          <Card className="p-6 shadow-sm border-slate-200">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {activeTab === "stock" ? "Mise à jour manuelle" : "Pilotage de la Garde"}
              </h3>
              <p className="text-xs text-gray-500">Modifier les données en temps réel.</p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4 py-2 px-3">
                <AlertDescription className="text-xs flex items-center gap-1.5 font-medium"><AlertCircle size={14}/> {error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="mb-4 py-2 px-3 bg-emerald-50 border-emerald-200 text-emerald-900">
                <AlertDescription className="text-xs font-medium">✓ {success}</AlertDescription>
              </Alert>
            )}

            {activeTab === "stock" ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Médicament</label>
                  <Select value={selectedMedication?.toString() || ""} onValueChange={(val) => setSelectedMedication(parseInt(val))}>
                    <SelectTrigger className="h-10 text-xs">
                      <SelectValue placeholder="Choisir un produit..." />
                    </SelectTrigger>
                    <SelectContent>
                      {medications.map((med) => (
                        <SelectItem key={med.id} value={med.id.toString()} className="text-xs">
                          {med.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Pharmacie</label>
                  <Select value={selectedPharmacy?.toString() || ""} onValueChange={(val) => setSelectedPharmacy(parseInt(val))}>
                    <SelectTrigger className="h-10 text-xs">
                      <SelectValue placeholder="Choisir une pharmacie..." />
                    </SelectTrigger>
                    <SelectContent>
                      {pharmacies.map((pharm) => (
                        <SelectItem key={pharm.id} value={pharm.id.toString()} className="text-xs">
                          {pharm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Statut</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-10 text-xs">
                      <SelectValue placeholder="Disponibilité..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Disponible</SelectItem>
                      <SelectItem value="low_stock">Stock faible</SelectItem>
                      <SelectItem value="on_order">Sur commande</SelectItem>
                      <SelectItem value="out_of_stock">Rupture</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Prix (FCFA)</label>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ex: 2500"
                    className="h-10 text-xs"
                  />
                </div>

                <Button 
                  onClick={handleUpdateStock} 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold h-10"
                  disabled={stockUpdateMutation.isPending}
                >
                  {stockUpdateMutation.isPending ? "Mise à jour..." : "Appliquer les changements"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Sélectionnez la pharmacie qui est actuellement de garde à Ebolowa.
                </p>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {pharmacies.map((pharm) => (
                    <div 
                      key={pharm.id} 
                      className={`p-3 rounded-lg border flex items-center justify-between transition-all ${pharm.isOnDuty ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{pharm.name}</span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-tight">{pharm.address}</span>
                      </div>
                      <Button
                        size="sm"
                        variant={pharm.isOnDuty ? "default" : "outline"}
                        className={`h-7 text-[10px] font-black px-3 ${pharm.isOnDuty ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                        onClick={() => handleSetDutyPharmacy(pharm.id)}
                        disabled={pharmacySetDutyMutation.isPending || pharm.isOnDuty}
                      >
                        {pharm.isOnDuty ? "ACTUELLE" : "ACTIVER"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Import CSV */}
          <Card className="p-6 shadow-sm border-slate-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <UploadCloud size={16} className="text-indigo-600" />
              Importation massive (CSV)
            </h3>
            <div className="space-y-3">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <Button
                onClick={handleUpload}
                disabled={isUploading || !selectedFile}
                variant="outline"
                className="w-full text-xs font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                {isUploading ? "Importation..." : "Lancer l'importation"}
              </Button>
            </div>
          </Card>
        </div>

        {/* Tableaux de données */}
        <div className="flex-1 min-w-0">
          <Card className="h-full flex flex-col shadow-sm border-slate-200 overflow-hidden">
            <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Activity size={16} className="text-indigo-600" />
                Dernières mises à jour des stocks
              </h3>
              <Badge variant="secondary" className="bg-white border shadow-none text-xs">
                {stock.length} entrées
              </Badge>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white border-b z-10">
                  <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="px-4 py-3">Produit</th>
                    <th className="px-4 py-3">Pharmacie</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Prix</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stock.slice(0, 50).map((s) => {
                    const med = medications.find(m => m.id === s.medicationId);
                    const pharm = pharmacies.find(p => p.id === s.pharmacyId);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-gray-900 leading-tight">{med?.name}</p>
                          <p className="text-[10px] text-gray-400">{med?.dci}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-medium">{pharm?.name}</td>
                        <td className="px-4 py-3">
                          <Badge className={`text-[10px] px-2 py-0 border shadow-none font-bold ${statusConfig[s.status as keyof typeof statusConfig]?.color || 'bg-gray-100'}`}>
                            {statusConfig[s.status as keyof typeof statusConfig]?.label || s.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm font-black text-indigo-600">{s.price} FCFA</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
