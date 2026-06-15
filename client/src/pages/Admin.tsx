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
import { AlertCircle, LogOut } from "lucide-react";
import { trpc } from "@/lib/trpc";

const statusConfig = {
  available: { label: "Disponible", color: "bg-green-100 text-green-800" },
  low_stock: { label: "Stock faible", color: "bg-yellow-100 text-yellow-800" },
  on_order: { label: "Sur commande", color: "bg-blue-100 text-blue-800" },
  out_of_stock: { label: "Rupture", color: "bg-red-100 text-red-800" },
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

  const { data: medications = [] } = trpc.medication.list.useQuery();
  const { data: pharmacies = [] } = trpc.pharmacy.list.useQuery();
  const { data: stock = [] } = trpc.stock.list.useQuery();
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

  const handleUpdateStock = async () => {
    if (!selectedMedication || !selectedPharmacy || !status) {
      setError("Veuillez remplir tous les champs");
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
      setSuccess("Pharmacie de garde mise à jour");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Chargement...</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
              Φ
            </div>
            <h1 className="text-2xl font-bold text-gray-900">PharmaEbolowa Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Connecté en tant que <strong>{user.username}</strong>
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut size={16} className="mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex gap-4">
          <Button
            variant={activeTab === "stock" ? "default" : "outline"}
            onClick={() => setActiveTab("stock")}
          >
            Gestion des stocks
          </Button>
          <Button
            variant={activeTab === "duty" ? "default" : "outline"}
            onClick={() => setActiveTab("duty")}
          >
            Pharmacie de garde
          </Button>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {activeTab === "stock" && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Mise à jour des stocks
            </h2>

            <div className="space-y-6">
              {/* Medication Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Médicament
                </label>
                <Select
                  value={selectedMedication?.toString() || ""}
                  onValueChange={(val) => setSelectedMedication(parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un médicament" />
                  </SelectTrigger>
                  <SelectContent>
                    {medications.map((med) => (
                      <SelectItem key={med.id} value={med.id.toString()}>
                        {med.name} {med.dci && `(${med.dci})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pharmacy Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pharmacie
                </label>
                <Select
                  value={selectedPharmacy?.toString() || ""}
                  onValueChange={(val) => setSelectedPharmacy(parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une pharmacie" />
                  </SelectTrigger>
                  <SelectContent>
                    {pharmacies.map((pharm) => (
                      <SelectItem key={pharm.id} value={pharm.id.toString()}>
                        {pharm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Current Status */}
              {currentStock && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Statut actuel</p>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        statusConfig[currentStock.status as keyof typeof statusConfig]
                          ?.color
                      }
                    >
                      {
                        statusConfig[currentStock.status as keyof typeof statusConfig]
                          ?.label
                      }
                    </Badge>
                    {currentStock.price && (
                      <span className="text-gray-900 font-semibold">
                        {currentStock.price} FCFA
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau statut
                </label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="low_stock">Stock faible</SelectItem>
                    <SelectItem value="on_order">Sur commande</SelectItem>
                    <SelectItem value="out_of_stock">Rupture</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix (FCFA) - Optionnel
                </label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Entrez le prix"
                />
              </div>

              <Button
                onClick={handleUpdateStock}
                disabled={stockUpdateMutation.isPending}
                className="w-full"
              >
                {stockUpdateMutation.isPending
                  ? "Mise à jour en cours..."
                  : "Mettre à jour le stock"}
              </Button>
            </div>
          </Card>
        )}

        {activeTab === "duty" && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Pharmacie de garde
            </h2>

            <div className="space-y-4">
              {pharmacies.map((pharmacy) => (
                <div
                  key={pharmacy.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {pharmacy.name}
                    </h3>
                    {pharmacy.isOnDuty && (
                      <Badge className="mt-2 bg-red-100 text-red-800">
                        🚑 Actuellement de garde
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={() => handleSetDutyPharmacy(pharmacy.id)}
                    variant={pharmacy.isOnDuty ? "default" : "outline"}
                    disabled={pharmacySetDutyMutation.isPending}
                  >
                    {pharmacy.isOnDuty ? "De garde" : "Mettre de garde"}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
