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
import { AlertCircle, LogOut, Package, ShieldCheck, Activity, Pill, Store, UploadCloud } from "lucide-react";
import { trpc } from "@/lib/trpc";
import axios from "axios";

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Nouvel état pour le fichier
  const [isUploading, setIsUploading] = useState(false); // Nouvel état pour l'indicateur de chargement

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
    if (parsedUser.role !== "admin") {
      setLocation("/");
      return;
    }

    setUser(parsedUser);
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setLocation("/");
  };

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
      <div className="h-screen w-full bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-500 font-medium">Chargement du tableau de bord...</p>
        </div>
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
  const activeDutyName = pharmacies.find(p => p.isOnDuty)?.name || "Aucune";

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col overflow-hidden font-sans">
      
      {/* 1. Header Dynamique Multi-Rôles */}
      <header className="bg-white border-b shadow-sm flex-none z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3">
          
          {/* Section Gauche : Logo & Identité Connectée */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
              Φ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-gray-950 leading-none">
                  PharmaEbolowa
                </h1>
                {user.role === "admin" ? (
                  <span className="text-[10px] bg-red-100 text-red-800 border border-red-200 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Équipe Admin
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Gérant Pharmacie
                  </span>
                )}
              </div>
              
              <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-1">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Session active : <strong className="text-gray-800 font-bold">{user.username}</strong>
              </p>
            </div>
          </div>

          {/* Section Droite : Onglets de Navigation & Déconnexion */}
          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <Button
                variant={activeTab === "stock" ? "default" : "ghost"}
                size="sm"
                className={`text-xs font-bold h-7 ${activeTab === "stock" ? "bg-white text-indigo-700 shadow-xs hover:bg-white" : "text-gray-600"}`}
                onClick={() => setActiveTab("stock")}
              >
                <Package size={13} className="mr-1" /> Stocks
              </Button>
              <Button
                variant={activeTab === "duty" ? "default" : "ghost"}
                size="sm"
                className={`text-xs font-bold h-7 ${activeTab === "duty" ? "bg-white text-indigo-700 shadow-xs hover:bg-white" : "text-gray-600"}`}
                onClick={() => setActiveTab("duty")}
              >
                <Activity size={13} className="mr-1" /> Tour de Garde
              </Button>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout} 
              className="text-red-600 hover:text-red-700 hover:bg-red-50 font-bold text-xs h-8 px-2.5 rounded-lg transition-colors shrink-0"
            >
              <LogOut size={14} className="mr-1" /> Quitter
            </Button>
          </div>

        </div>
      </header>

      {/* 2. Mini Barre de Stats d'exploitation */}
      <section className="bg-white border-b px-4 py-2 flex-none grid grid-cols-3 divide-x divide-slate-100 text-center max-w-7xl w-full mx-auto shadow-xs">
        <div className="py-1">
          <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center justify-center gap-1"><Store size={12}/> Officines</p>
          <p className="text-base font-extrabold text-slate-800">{pharmacies.length} enregistrées</p>
        </div>
        <div className="py-1">
          <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center justify-center gap-1"><Pill size={12}/> Catalogue</p>
          <p className="text-base font-extrabold text-slate-800">{medications.length} produits</p>
        </div>
        <div className="py-1">
          <p className="text-[10px] uppercase font-bold tracking-wider text-red-400 flex items-center justify-center gap-1"><AlertCircle size={12}/> Alertes Rupture</p>
          <p className="text-base font-extrabold text-red-600">{totalRuptures} cas signalés</p>
        </div>
      </section>

      {/* 3. Zone de Travail Flex-1 en colonnes */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 flex flex-col md:flex-row gap-4 overflow-hidden min-h-0">
        
        {/* COLONNE GAUCHE : Formulaires fixes d'action */}
        <div className="w-full md:w-[380px] flex flex-col flex-none bg-white p-4 rounded-xl border shadow-xs space-y-4 justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-md font-bold text-gray-900 tracking-tight">
                {activeTab === "stock" ? "Mise à jour des stocks" : "Pilotage de la Garde"}
              </h2>
              <p className="text-xs text-gray-500">Sélectionnez les critères requis.</p>
            </div>

            {error && (
              <Alert variant="destructive" className="py-2 px-3 border-red-200 bg-red-50 text-red-900">
                <AlertDescription className="text-xs flex items-center gap-1.5 font-medium"><AlertCircle size={14}/> {error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="py-2 px-3 bg-emerald-50 border-emerald-200 text-emerald-900">
                <AlertDescription className="text-xs font-medium">✓ {success}</AlertDescription>
              </Alert>
            )}

            {activeTab === "stock" ? (
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Médicament ciblé</label>
                  <Select value={selectedMedication?.toString() || ""} onValueChange={(val) => setSelectedMedication(parseInt(val))}>
                    <SelectTrigger className="h-9 text-xs bg-slate-50/50">
                      <SelectValue placeholder="Choisir un produit..." />
                    </SelectTrigger>
                    <SelectContent>
                      {medications.map((med) => (
                        <SelectItem key={med.id} value={med.id.toString()} className="text-xs">
                          {med.name} {med.dci && `(${med.dci})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Pharmacie distributrice</label>
                  <Select value={selectedPharmacy?.toString() || ""} onValueChange={(val) => setSelectedPharmacy(parseInt(val))}>
                    <SelectTrigger className="h-9 text-xs bg-slate-50/50">
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

                {currentStock && (
                  <div className="p-2.5 bg-slate-50 border rounded-lg flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium">État actuel :</span>
                    <div className="flex items-center gap-1.5 font-bold">
                      <Badge className={`text-[10px] px-1.5 py-0 border shadow-none ${statusConfig[currentStock.status as keyof typeof statusConfig]?.color || 'bg-gray-100'}`}>
                        {statusConfig[currentStock.status as keyof typeof statusConfig]?.label || currentStock.status}
                      </Badge>
                      {currentStock.price && <span className="text-indigo-600">{currentStock.price} FCFA</span>}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Nouveau Statut de disponibilité</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-9 text-xs bg-slate-50/50">
                      <SelectValue placeholder="Définir la disponibilité..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available" className="text-xs">Disponible</SelectItem>
                      <SelectItem value="low_stock" className="text-xs">Stock faible</SelectItem>
                      <SelectItem value="on_order" className="text-xs">Sur commande</SelectItem>
                      <SelectItem value="out_of_stock" className="text-xs">Rupture de stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Prix unitaire (FCFA) - Optionnel</label>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ex: 1500"
                    className="h-9 text-xs bg-slate-50/50"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  Pour modifier la garde de la ville d'Ebolowa, utilisez les boutons d'activation directe situés dans le tableau de droite sur la ligne de l'officine souhaitée.
                </p>
                <div className="text-xs pt-1">
                  <span className="text-gray-400">Garde actuelle :</span> <strong className="text-indigo-800">{activeDutyName}</strong>
                </div>
              </div>
            )}
          </div>

          {activeTab === "stock" && (
            <>
              <Button
                onClick={handleUpdateStock}
                disabled={stockUpdateMutation.isPending}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 text-xs shadow-md mt-4 flex-none"
              >
                {stockUpdateMutation.isPending ? "Mise à jour réseau..." : "Sauvegarder les modifications"}
              </Button>

              {/* Nouvelle section pour l'upload de fichiers */}
              <div className="border-t pt-4 mt-4 space-y-3.5">
                <h3 className="text-md font-bold text-gray-900 tracking-tight">
                  Importation de données (CSV)
                </h3>
                <p className="text-xs text-gray-500">
                  Importez des pharmacies, médicaments et stocks via un fichier CSV.
                </p>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Sélectionner un fichier CSV</label>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="h-9 text-xs bg-slate-50/50"
                  />
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 text-xs shadow-md flex-none"
                >
                  {isUploading ? (
                    <>
                      <UploadCloud size={14} className="mr-2 animate-pulse" /> Importation en cours...
                    </>
                  ) : (
                    <>
                      <UploadCloud size={14} className="mr-2" /> Importer le fichier
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* COLONNE DROITE : Visualisation de données défilable */}
        <div className="flex-1 bg-white border rounded-xl shadow-xs overflow-hidden flex flex-col min-h-0">
          <div className="p-3 border-b bg-slate-50/50 flex justify-between items-center flex-none">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              {activeTab === "stock" ? "Registre Général des Stocks Renseignés" : "Liste des Officines et Statuts de Garde"}
            </h3>
            <Badge variant="outline" className="text-[10px] bg-white px-2 py-0 border-slate-200">
              {activeTab === "stock" ? `${stock.length} lignes` : `${pharmacies.length} pharmacies`}
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-0">
            {activeTab === "stock" ? (
              stock.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">Aucun stock répertorié dans la base MySQL.</p>
              ) : (
                stock.map((s) => {
                  const med = medications.find((m) => m.id === s.medicationId);
                  const pharm = pharmacies.find((p) => p.id === s.pharmacyId);
                  return (
                    <div key={`${s.medicationId}-${s.pharmacyId}`} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/40 transition-colors">
                      <div className="space-y-0.5 max-w-[65%]">
                        <p className="font-bold text-gray-900 truncate">{med?.name || `Produit #${s.medicationId}`}</p>
                        <p className="text-gray-500 font-medium truncate flex items-center gap-1">
                          <Store size={12} className="text-gray-400 flex-none" /> {pharm?.name || `Pharmacie #${s.pharmacyId}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-none">
                        <Badge className={`text-[10px] px-2 py-0.5 font-bold border ${statusConfig[s.status as keyof typeof statusConfig]?.color || 'bg-gray-100'}`}>
                          {statusConfig[s.status as keyof typeof statusConfig]?.label || s.status}
                        </Badge>
                        {s.price && <span className="font-extrabold text-gray-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50 text-[11px]">{s.price} F</span>}
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              pharmacies.map((pharmacy) => (
                <div key={pharmacy.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/40 transition-colors">
                  <div className="space-y-1">
                    <h4 className="font-bold text-gray-900 text-sm">{pharmacy.name}</h4>
                    <p className="text-gray-500 text-xs">{pharmacy.address}</p>
                    {pharmacy.isOnDuty && (
                      <Badge className="bg-red-600 text-white font-bold text-[9px] px-1.5 py-0 shadow-xs tracking-wider uppercase animate-pulse">
                        🚑 En service de garde
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={() => handleSetDutyPharmacy(pharmacy.id)}
                    variant={pharmacy.isOnDuty ? "default" : "outline"}
                    size="sm"
                    className={`h-8 font-bold text-xs ${pharmacy.isOnDuty ? "bg-red-600 text-white hover:bg-red-700" : "border-slate-200 text-gray-700 hover:bg-slate-50"}`}
                    disabled={pharmacySetDutyMutation.isPending}
                  >
                    {pharmacy.isOnDuty ? "De garde" : "Mettre de garde"}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* 4. Footer Fixe */}
      <footer className="bg-white border-t py-1.5 flex-none text-center text-[11px] text-gray-400 font-medium">
        Espace d'Administration Sécurisé PharmaEbolowa — v1.1.0
      </footer>
    </div>
  );
}
