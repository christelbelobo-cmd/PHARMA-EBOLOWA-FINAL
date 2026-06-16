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
import { AlertCircle, LogOut, Package, ShieldCheck, Activity, Pill, Store, Users, Plus, Search, FileSpreadsheet, CheckCircle, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

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
  const [activeTab, setActiveTab] = useState<"stock" | "duty" | "users" | "accounts">("stock");
  
  const [searchQuery, setSearchQuery] = useState("");

  // États du formulaire de Stock unitaire
  const [selectedMedication, setSelectedMedication] = useState<number | null>(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("");
  const [price, setPrice] = useState<string>("");

  // États du formulaire de création d'utilisateur
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"pharmacist" | "admin">("pharmacist");
  const [associatedPharmacyId, setAssociatedPharmacyId] = useState<string>("none");

  // Requêtes tRPC
  const { data: medications = [], refetch: refetchMeds } = trpc.medication.list.useQuery();
  const { data: pharmacies = [], refetch: refetchPharmacies } = trpc.pharmacy.list.useQuery();
  const { data: stock = [], refetch: refetchStock } = trpc.stock.list.useQuery();
  const { data: users = [], refetch: refetchUsers } = trpc.auth.list.useQuery();

  // Mutations tRPC
  const stockUpdateMutation = trpc.stock.update.useMutation();
  const pharmacySetDutyMutation = trpc.pharmacy.setDuty.useMutation();
  const importCsvMutation = trpc.dataImport.uploadData.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();
  const createUserMutation = trpc.auth.register.useMutation();
  const toggleUserStatusMutation = trpc.auth.toggleUserStatus.useMutation();
  const deleteUserMutation = trpc.auth.delete.useMutation();

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

  useEffect(() => {
    if (user && user.role !== "admin" && (activeTab === "duty" || activeTab === "users" || activeTab === "accounts")) {
      setActiveTab("stock");
    }
  }, [activeTab, user]);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setLocation("/");
    } catch (err) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setLocation("/");
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

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess("");

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result;
      if (typeof text !== "string") {
        setError("Le format du fichier est illisible.");
        return;
      }

      try {
        await importCsvMutation.mutateAsync({ csvContent: text });
        setSuccess("Fichier CSV importé avec succès !");
        refetchStock();
        refetchMeds();
        refetchPharmacies();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de l'importation du CSV");
      }
    };
    reader.readAsText(file);
  };

  const handleCreateUser = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!newUsername || !newPassword) {
      setError("L'identifiant et le mot de passe sont requis");
      return;
    }

    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    try {
      setError("");
      setSuccess("");

      const pId = associatedPharmacyId === "none" ? null : parseInt(associatedPharmacyId);

      // Envoi à la route auth.register
      await createUserMutation.mutateAsync({
        username: newUsername,
        password: newPassword,
        role: newUserRole,
        pharmacyId: pId,
      });

      setSuccess(`Le compte pour "${newUsername}" a été créé et activé avec succès !`);
      setNewUsername("");
      setNewPassword("");
      setAssociatedPharmacyId("none");
      setNewUserRole("pharmacist");
      refetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création du compte");
    }
  };

  const handleSetDutyPharmacy = async (pharmacyId: number) => {
    if (user?.role !== "admin") return;
    try {
      setError("");
      setSuccess("");
      await pharmacySetDutyMutation.mutateAsync(pharmacyId);
      setSuccess("Pharmacie de garde mise à jour avec succès");
      refetchPharmacies();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour de la garde");
    }
  };

  const handleToggleUserStatus = async (userId: number, isActive: boolean) => {
    try {
      setError("");
      setSuccess("");
      await toggleUserStatusMutation.mutateAsync({ userId, isActive: !isActive });
      setSuccess(isActive ? "Compte désactivé" : "Compte activé");
      refetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la modification du compte");
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le compte "${username}" ?`)) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      await deleteUserMutation.mutateAsync({ userId });
      setSuccess("Utilisateur supprimé avec succès");
      refetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression de l'utilisateur");
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

  const totalRuptures = stock.filter(s => s.status === "out_of_stock").length;
  const activeDutyName = pharmacies.find(p => p.isOnDuty)?.name || "Aucune";

  const filteredStock = stock
    .filter((s) => user.role === "admin" || s.pharmacyId === user.pharmacyId)
    .filter((s) => {
      const medName = medications.find((m) => m.id === s.medicationId)?.name || "";
      const pharmName = pharmacies.find((p) => p.id === s.pharmacyId)?.name || "";
      return medName.toLowerCase().includes(searchQuery.toLowerCase()) || pharmName.toLowerCase().includes(searchQuery.toLowerCase());
    });

  const filteredPharmacies = pharmacies.filter((p) => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col overflow-hidden font-sans">
      <header className="bg-white border-b shadow-xs flex-none z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-xs shrink-0">Φ</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-gray-950 leading-none">PharmaEbolowa</h1>
                <span className={`text-[10px] border font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${user.role === "admin" ? "bg-red-100 text-red-800 border-red-200" : "bg-emerald-100 text-emerald-800 border-emerald-200"}`}>
                  {user.role === "admin" ? "Équipe Admin" : "Gérant Pharmacie"}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-1">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Session : <strong className="text-gray-800 font-bold">{user.username}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <Button variant={activeTab === "stock" ? "default" : "ghost"} size="sm" className={`text-xs font-bold h-7 ${activeTab === "stock" ? "bg-white text-indigo-700 shadow-xs hover:bg-white" : "text-gray-600"}`} onClick={() => { setActiveTab("stock"); setSearchQuery(""); }}>
                <Package size={13} className="mr-1" /> Stocks
              </Button>
              
              {user.role === "admin" && (
                <>
                  <Button variant={activeTab === "duty" ? "default" : "ghost"} size="sm" className={`text-xs font-bold h-7 ${activeTab === "duty" ? "bg-white text-indigo-700 shadow-xs hover:bg-white" : "text-gray-600"}`} onClick={() => { setActiveTab("duty"); setSearchQuery(""); }}>
                    <Activity size={13} className="mr-1" /> Tour de Garde
                  </Button>
                  <Button variant={activeTab === "users" ? "default" : "ghost"} size="sm" className={`text-xs font-bold h-7 ${activeTab === "users" ? "bg-white text-indigo-700 shadow-xs hover:bg-white" : "text-gray-600"}`} onClick={() => { setActiveTab("users"); setSearchQuery(""); }}>
                    <Users size={13} className="mr-1" /> Utilisateurs
                  </Button>
                  <Button variant={activeTab === "accounts" ? "default" : "ghost"} size="sm" className={`text-xs font-bold h-7 ${activeTab === "accounts" ? "bg-white text-indigo-700 shadow-xs hover:bg-white" : "text-gray-600"}`} onClick={() => { setActiveTab("accounts"); setSearchQuery(""); }}>
                    <ShieldCheck size={13} className="mr-1" /> Comptes
                  </Button>
                </>
              )}
            </div>
            
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50 font-bold text-xs h-8 px-2.5 rounded-lg transition-colors shrink-0">
              <LogOut size={14} className="mr-1" /> Quitter
            </Button>
          </div>
        </div>
      </header>

      <section className="bg-white border-b px-4 py-2 flex-none grid grid-cols-3 divide-x divide-slate-100 text-center max-w-7xl w-full mx-auto">
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
      </section>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 flex flex-col md:flex-row gap-4 overflow-hidden min-h-0">
        <div className="w-full md:w-[380px] flex flex-col flex-none bg-white p-4 rounded-xl border shadow-xs justify-between overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900 tracking-tight">
                {activeTab === "stock" && "Mise à jour des stocks"}
                {activeTab === "duty" && "Garde de la ville"}
                {activeTab === "users" && "Créer un compte utilisateur"}
                {activeTab === "accounts" && "Gestion des comptes utilisateurs"}
              </h2>
              <p className="text-xs text-gray-500">Insérer vos données en toute sécurité.</p>
            </div>

            {error && (
              <Alert variant="destructive" className="py-2 px-3 bg-red-50 text-red-900 border-red-200">
                <AlertDescription className="text-xs flex items-center gap-1.5 font-medium"><AlertCircle size={14}/> {error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="py-2 px-3 bg-emerald-50 text-emerald-900 border-emerald-200">
                <AlertDescription className="text-xs font-medium flex items-center gap-1.5"><CheckCircle size={14}/> {success}</AlertDescription>
              </Alert>
            )}

            {activeTab === "stock" && (
              <div className="space-y-4">
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Médicament ciblé</label>
                    <Select value={selectedMedication?.toString() || ""} onValueChange={(val) => setSelectedMedication(parseInt(val))}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Choisir un produit..." /></SelectTrigger>
                      <SelectContent>
                        {medications.map((med) => (
                          <SelectItem key={med.id} value={med.id.toString()} className="text-xs">{med.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Pharmacie distributrice</label>
                    <Select value={selectedPharmacy?.toString() || ""} onValueChange={(val) => setSelectedPharmacy(parseInt(val))}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Choisir l'officine..." /></SelectTrigger>
                      <SelectContent>
                        {pharmacies.filter(p => user.role === "admin" || p.id === user.pharmacyId).map((pharm) => (
                          <SelectItem key={pharm.id} value={pharm.id.toString()} className="text-xs">{pharm.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">État du stock</label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Sélectionner un état..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available" className="text-xs">Disponible</SelectItem>
                        <SelectItem value="low_stock" className="text-xs">Stock faible</SelectItem>
                        <SelectItem value="on_order" className="text-xs">Sur commande</SelectItem>
                        <SelectItem value="out_of_stock" className="text-xs">Rupture</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Prix (optionnel)</label>
                    <Input
                      type="number"
                      placeholder="Entrer le prix..."
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <Button onClick={handleUpdateStock} disabled={stockUpdateMutation.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs shadow-xs">
                  <Package size={14} className="mr-1.5" /> {stockUpdateMutation.isPending ? "Mise à jour..." : "Mettre à jour"}
                </Button>

                <div className="border-t pt-4 space-y-2">
                  <label className="text-xs font-bold text-gray-600">Importer un fichier CSV</label>
                  <input type="file" accept=".csv" onChange={handleCsvUpload} className="text-xs" />
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="space-y-4">
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Identifiant</label>
                    <Input
                      type="text"
                      placeholder="Entrer l'identifiant..."
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Mot de passe</label>
                    <Input
                      type="password"
                      placeholder="Entrer le mot de passe..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Rôle</label>
                    <Select value={newUserRole} onValueChange={(val) => setNewUserRole(val as "pharmacist" | "admin")}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pharmacist" className="text-xs">Pharmacien</SelectItem>
                        <SelectItem value="admin" className="text-xs">Administrateur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newUserRole === "pharmacist" && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Officine rattachée</label>
                      <Select value={associatedPharmacyId} onValueChange={setAssociatedPharmacyId}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Lier à une pharmacie..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucune (Compte volant)</SelectItem>
                          {pharmacies.map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()} className="text-xs">{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <Button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCreateUser(e);
                  }} 
                  disabled={createUserMutation.isPending} 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Plus size={14}/> {createUserMutation.isPending ? "Création en cours..." : "Activer le compte"}
                </Button>
              </div>
            )}

            {activeTab === "duty" && (
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs font-medium space-y-2">
                <p className="text-gray-600 leading-relaxed">Le basculement des tours de garde s'effectue en temps réel.</p>
                <div className="text-[11px] text-gray-500 bg-white p-2 border rounded border-indigo-100/60">
                  Garde active à Ebolowa : <strong className="text-indigo-800 font-bold">{activeDutyName}</strong>
                </div>
              </div>
            )}

            {activeTab === "accounts" && (
              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs font-medium space-y-2">
                <p className="text-gray-600 leading-relaxed">Gérez l'accès des utilisateurs en activant ou désactivant leurs comptes.</p>
                <div className="text-[11px] text-gray-500 bg-white p-2 border rounded border-blue-100/60">
                  Comptes actifs : <strong className="text-blue-800 font-bold">{users.filter(u => u.isActive).length} / {users.length}</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 bg-white border rounded-xl shadow-xs overflow-hidden flex flex-col min-h-0">
          <div className="p-3 border-b bg-slate-50/50 flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center flex-none">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <Input
                type="text"
                placeholder="Filtrer la liste..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-white shadow-2xs"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-0">
            {activeTab === "stock" && (
              filteredStock.map((s) => {
                const med = medications.find((m) => m.id === s.medicationId);
                const pharm = pharmacies.find((p) => p.id === s.pharmacyId);
                return (
                  <div key={`${s.medicationId}-${s.pharmacyId}`} className="p-3 flex items-center justify-between text-xs/40 hover:bg-slate-50">
                    <div className="space-y-0.5 max-w-[65%]">
                      <p className="font-bold text-gray-900 truncate">{med?.name}</p>
                      <p className="text-gray-500 font-medium truncate flex items-center gap-1"><Store size={12}/> {pharm?.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`text-[10px] px-2 py-0.5 font-bold border ${statusConfig[s.status as keyof typeof statusConfig]?.color || 'bg-gray-100'}`}>
                        {statusConfig[s.status as keyof typeof statusConfig]?.label || s.status}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}

            {activeTab === "duty" && (
              filteredPharmacies.map((pharmacy) => (
                <div key={pharmacy.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-gray-900 text-sm">{pharmacy.name}</h4>
                    <p className="text-gray-500 text-xs">{pharmacy.address}</p>
                  </div>
                  <Button onClick={() => handleSetDutyPharmacy(pharmacy.id)} variant={pharmacy.isOnDuty ? "default" : "outline"} size="sm" className="h-8 font-bold text-xs" disabled={pharmacySetDutyMutation.isPending}>
                    {pharmacy.isOnDuty ? "En Garde" : "Activer"}
                  </Button>
                </div>
              ))
            )}

            {activeTab === "users" && (
              <div className="p-4 text-center space-y-2">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-gray-400"><ShieldCheck size={20}/></div>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">Les comptes créés sont automatiquement activés et prêts à l'emploi.</p>
              </div>
            )}

            {activeTab === "accounts" && (
              users.length === 0 ? (
                <div className="p-4 text-center space-y-2">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-gray-400"><Users size={20}/></div>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">Aucun compte utilisateur trouvé.</p>
                </div>
              ) : (
                users
                  .filter((u) => !u.username || u.username.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((u) => {
                    const pharmacy = pharmacies.find((p) => p.id === u.pharmacyId);
                    return (
                      <div key={u.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 border-b last:border-b-0">
                        <div className="space-y-0.5 flex-1">
                          <h4 className="font-bold text-gray-900 text-sm">{u.username || u.name || "Utilisateur"}</h4>
                          <p className="text-gray-500 text-xs flex items-center gap-1">
                            <Badge className={`text-[10px] px-2 py-0.5 font-bold border ${u.role === "admin" ? "bg-red-100 text-red-800 border-red-200" : "bg-emerald-100 text-emerald-800 border-emerald-200"}`}>
                              {u.role === "admin" ? "Admin" : "Pharmacien"}
                            </Badge>
                            {pharmacy && <span className="text-gray-600">• {pharmacy.name}</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                            variant={u.isActive ? "default" : "outline"}
                            size="sm"
                            className={`h-7 font-bold text-xs ${u.isActive ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-200 hover:bg-gray-300"}`}
                            disabled={toggleUserStatusMutation.isPending}
                          >
                            {u.isActive ? "Actif" : "Inactif"}
                          </Button>
                          <Button 
                            onClick={() => handleDeleteUser(u.id, u.username || u.name || "Utilisateur")}
                            variant="outline"
                            size="sm"
                            className="h-7 font-bold text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={deleteUserMutation.isPending}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    );
                  })
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
