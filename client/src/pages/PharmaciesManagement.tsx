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
import {
  AlertCircle,
  LogOut,
  Store,
  Edit,
  Save,
  X,
  Plus,
  Search,
  MapPin,
  Phone,
  Clock,
  Mail,
  Navigation,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function PharmaciesManagement() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPharmacyId, setEditingPharmacyId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // États du formulaire d'édition/création
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    openingHours: { open: "08:00", close: "20:00" },
    mapLink: "",
    latitude: 0,
    longitude: 0,
  });

  // Requêtes tRPC
  const { data: pharmacies = [], refetch: refetchPharmacies } =
    trpc.pharmacy.list.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();
  const createPharmacyMutation = trpc.pharmacy.create.useMutation();
  const updatePharmacyMutation = trpc.pharmacy.update.useMutation();
  const deletePharmacyMutation = trpc.pharmacy.delete.useMutation();

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

  const handleDeletePharmacy = async (pharmacyId: number, pharmacyName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la pharmacie "${pharmacyName}" ?`)) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      await deletePharmacyMutation.mutateAsync(pharmacyId);
      setSuccess("Pharmacie supprimée avec succès");
      refetchPharmacies();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
    }
  };

  const handleEditPharmacy = (pharmacy: any) => {
    if (user?.role !== "admin") {
      setError("Seuls les administrateurs peuvent modifier les pharmacies");
      return;
    }

    setEditingPharmacyId(pharmacy.id);
    setFormData({
      name: pharmacy.name,
      address: pharmacy.address,
      phone: pharmacy.phone,
      email: pharmacy.email || "",
      openingHours: pharmacy.openingHours
        ? JSON.parse(pharmacy.openingHours)
        : { open: "08:00", close: "20:00" },
      mapLink: pharmacy.mapLink || "",
      latitude: pharmacy.latitude || 0,
      longitude: pharmacy.longitude || 0,
    });
    setShowAddForm(false);
  };

  const handleAddPharmacy = () => {
    if (user?.role !== "admin") {
      setError("Seuls les administrateurs peuvent ajouter des pharmacies");
      return;
    }

    setEditingPharmacyId(null);
    setFormData({
      name: "",
      address: "",
      phone: "",
      email: "",
      openingHours: { open: "08:00", close: "20:00" },
      mapLink: "",
      latitude: 0,
      longitude: 0,
    });
    setShowAddForm(true);
  };

  const handleCancelEdit = () => {
    setEditingPharmacyId(null);
    setShowAddForm(false);
    setFormData({
      name: "",
      address: "",
      phone: "",
      email: "",
      openingHours: { open: "08:00", close: "20:00" },
      mapLink: "",
      latitude: 0,
      longitude: 0,
    });
  };

  const handleSavePharmacy = async () => {
    if (!formData.name || !formData.address || !formData.phone) {
      setError("Les champs nom, adresse et téléphone sont obligatoires");
      return;
    }

    try {
      setError("");
      setSuccess("");

      if (editingPharmacyId) {
        // Mise à jour
        await updatePharmacyMutation.mutateAsync({
          id: editingPharmacyId,
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email || undefined,
          openingHours: formData.openingHours,
          mapLink: formData.mapLink || undefined,
          latitude: formData.latitude || undefined,
          longitude: formData.longitude || undefined,
        });
        setSuccess("Pharmacie mise à jour avec succès");
      } else {
        // Création
        await createPharmacyMutation.mutateAsync({
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email || undefined,
          openingHours: formData.openingHours,
          mapLink: formData.mapLink || undefined,
          latitude: formData.latitude || undefined,
          longitude: formData.longitude || undefined,
        });
        setSuccess("Pharmacie créée avec succès");
      }

      setEditingPharmacyId(null);
      setShowAddForm(false);
      refetchPharmacies();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith("openingHours.")) {
      const subField = field.split(".")[1];
      setFormData({
        ...formData,
        openingHours: {
          ...formData.openingHours,
          [subField]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [field]: value,
      });
    }
  };

  if (!user) {
    return (
      <div className="h-screen w-full bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-500 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  const filteredPharmacies = pharmacies.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery)
  );

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-white border-b shadow-xs flex-none z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-xs shrink-0">
              Φ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-gray-950 leading-none">
                  PharmaEbolowa - Gestion des Pharmacies
                </h1>
                <span
                  className={`text-[10px] border font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    user.role === "admin"
                      ? "bg-red-100 text-red-800 border-red-200"
                      : "bg-emerald-100 text-emerald-800 border-emerald-200"
                  }`}
                >
                  {user.role === "admin" ? "Équipe Admin" : "Gérant Pharmacie"}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-1">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Session : <strong className="text-gray-800 font-bold">{user.username}</strong>
              </p>
            </div>
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
      </header>

      {/* Stats Section */}
      <section className="bg-white border-b px-4 py-2 flex-none grid grid-cols-2 divide-x divide-slate-100 text-center max-w-7xl w-full mx-auto">
        <div className="py-1">
          <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center justify-center gap-1">
            <Store size={12} /> Pharmacies
          </p>
          <p className="text-base font-extrabold text-slate-800">{pharmacies.length}</p>
        </div>
        <div className="py-1">
          <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center justify-center gap-1">
            <Navigation size={12} /> En Garde
          </p>
          <p className="text-base font-extrabold text-slate-800">
            {pharmacies.filter((p) => p.isOnDuty).length}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 flex flex-col overflow-hidden min-h-0">
        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-4 py-2 px-3 bg-red-50 text-red-900 border-red-200">
            <AlertDescription className="text-xs flex items-center gap-1.5 font-medium">
              <AlertCircle size={14} /> {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 py-2 px-3 bg-green-50 text-green-900 border-green-200">
            <AlertDescription className="text-xs flex items-center gap-1.5 font-medium">
              <AlertCircle size={14} /> {success}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col md:flex-row gap-4 flex-1 overflow-hidden min-h-0">
          {/* Left Panel - Form */}
          <div className="w-full md:w-[420px] flex flex-col flex-none bg-white p-4 rounded-xl border shadow-xs justify-between overflow-y-auto">
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900 tracking-tight">
                  {editingPharmacyId
                    ? "Modifier la pharmacie"
                    : showAddForm
                    ? "Ajouter une pharmacie"
                    : "Gestion des pharmacies"}
                </h2>
                <p className="text-xs text-gray-500">
                  {editingPharmacyId || showAddForm
                    ? "Remplissez les informations de la pharmacie"
                    : "Sélectionnez une pharmacie pour la modifier"}
                </p>
              </div>

              {(editingPharmacyId || showAddForm) && (
                <div className="space-y-3">
                  {/* Name */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Nom de la pharmacie *
                    </label>
                    <Input
                      type="text"
                      placeholder="Ex: Pharmacie Centrale"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Adresse *
                    </label>
                    <Input
                      type="text"
                      placeholder="Ex: Rue de la Paix, Ebolowa"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Téléphone *
                    </label>
                    <Input
                      type="tel"
                      placeholder="Ex: +237 6XX XXX XXX"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="Ex: contact@pharmacie.cm"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  {/* Opening Hours */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        Ouverture
                      </label>
                      <Input
                        type="time"
                        value={formData.openingHours.open}
                        onChange={(e) =>
                          handleInputChange("openingHours.open", e.target.value)
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        Fermeture
                      </label>
                      <Input
                        type="time"
                        value={formData.openingHours.close}
                        onChange={(e) =>
                          handleInputChange("openingHours.close", e.target.value)
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  {/* Map Link */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Lien Google Maps
                    </label>
                    <Input
                      type="url"
                      placeholder="https://maps.google.com/..."
                      value={formData.mapLink}
                      onChange={(e) => handleInputChange("mapLink", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  {/* Coordinates */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        Latitude
                      </label>
                      <Input
                        type="number"
                        step="0.0001"
                        placeholder="2.9065"
                        value={formData.latitude}
                        onChange={(e) =>
                          handleInputChange("latitude", parseFloat(e.target.value))
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        Longitude
                      </label>
                      <Input
                        type="number"
                        step="0.0001"
                        placeholder="11.1606"
                        value={formData.longitude}
                        onChange={(e) =>
                          handleInputChange("longitude", parseFloat(e.target.value))
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleSavePharmacy}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-8 text-xs font-bold"
                      disabled={createPharmacyMutation.isPending || updatePharmacyMutation.isPending}
                    >
                      <Save size={14} className="mr-1" /> {createPharmacyMutation.isPending || updatePharmacyMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="flex-1 h-8 text-xs font-bold"
                      disabled={createPharmacyMutation.isPending || updatePharmacyMutation.isPending}
                    >
                      <X size={14} className="mr-1" /> Annuler
                    </Button>
                  </div>
                </div>
              )}

              {!editingPharmacyId && !showAddForm && user?.role === "admin" && (
                <Button
                  onClick={handleAddPharmacy}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 h-9 text-xs font-bold"
                >
                  <Plus size={14} className="mr-1" /> Ajouter une pharmacie
                </Button>
              )}
            </div>
          </div>

          {/* Right Panel - List */}
          <div className="flex-1 bg-white border rounded-xl shadow-xs overflow-hidden flex flex-col min-h-0">
            {/* Search Bar */}
            <div className="p-3 border-b bg-slate-50/50 flex-none">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher par nom, adresse ou téléphone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-white shadow-2xs"
                />
              </div>
            </div>

            {/* Pharmacies List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-0">
              {filteredPharmacies.length === 0 ? (
                <div className="p-4 text-center space-y-2">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                    <Store size={20} />
                  </div>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    Aucune pharmacie trouvée
                  </p>
                </div>
              ) : (
                filteredPharmacies.map((pharmacy) => (
                  <div
                    key={pharmacy.id}
                    className="p-3.5 hover:bg-slate-50 border-b last:border-b-0 transition-colors"
                  >
                    <div className="space-y-2">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                            {pharmacy.name}
                            {pharmacy.isOnDuty && (
                              <Badge className="bg-red-100 text-red-800 text-[10px] px-1.5 py-0">
                                🚑 Garde
                              </Badge>
                            )}
                          </h4>
                        </div>
                        {user?.role === "admin" && (
                          <div className="flex gap-1">
                            <Button
                              onClick={() => handleEditPharmacy(pharmacy)}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                              disabled={editingPharmacyId !== null || showAddForm || deletePharmacyMutation.isPending}
                            >
                              <Edit size={14} />
                            </Button>
                            <Button
                              onClick={() => handleDeletePharmacy(pharmacy.id, pharmacy.name)}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={editingPharmacyId !== null || showAddForm || deletePharmacyMutation.isPending}
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 gap-1.5 text-xs text-gray-600">
                        {/* Address */}
                        <div className="flex items-start gap-2">
                          <MapPin size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{pharmacy.address}</span>
                        </div>

                        {/* Phone */}
                        <div className="flex items-center gap-2">
                          <Phone size={12} className="text-gray-400 flex-shrink-0" />
                          <a
                            href={`tel:${pharmacy.phone}`}
                            className="text-indigo-600 hover:underline"
                          >
                            {pharmacy.phone}
                          </a>
                        </div>

                        {/* Email */}
                        {pharmacy.email && (
                          <div className="flex items-center gap-2">
                            <Mail size={12} className="text-gray-400 flex-shrink-0" />
                            <a
                              href={`mailto:${pharmacy.email}`}
                              className="text-indigo-600 hover:underline truncate"
                            >
                              {pharmacy.email}
                            </a>
                          </div>
                        )}

                        {/* Hours */}
                        {pharmacy.openingHours && (
                          <div className="flex items-center gap-2">
                            <Clock size={12} className="text-gray-400 flex-shrink-0" />
                            <span>
                              {JSON.parse(pharmacy.openingHours).open} -{" "}
                              {JSON.parse(pharmacy.openingHours).close}
                            </span>
                          </div>
                        )}

                        {/* Coordinates */}
                        {pharmacy.latitude && pharmacy.longitude && (
                          <div className="flex items-center gap-2">
                            <Navigation size={12} className="text-gray-400 flex-shrink-0" />
                            <span className="text-[11px]">
                              {pharmacy.latitude.toFixed(4)}, {pharmacy.longitude.toFixed(4)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
