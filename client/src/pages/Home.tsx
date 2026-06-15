import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Search, MapPin, Phone, Clock, Map } from "lucide-react";
import { trpc } from "@/lib/trpc";

const statusConfig = {
  available: { label: "Disponible", color: "bg-green-100 text-green-800" },
  low_stock: { label: "Stock faible", color: "bg-yellow-100 text-yellow-800" },
  on_order: { label: "Sur commande", color: "bg-blue-100 text-blue-800" },
  out_of_stock: { label: "Rupture", color: "bg-red-100 text-red-800" },
};

export default function Home() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: medications = [] } = trpc.medication.list.useQuery();
  const { data: pharmacies = [] } = trpc.pharmacy.list.useQuery();
  const { data: stock = [] } = trpc.stock.list.useQuery();

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const matchedMeds = medications.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        (m.dci && m.dci.toLowerCase().includes(query))
    );

    return matchedMeds.map((med) => {
      const medStock = stock.filter((s) => s.medicationId === med.id);
      const pharmacyInfo = medStock.map((s) => {
        const pharmacy = pharmacies.find((p) => p.id === s.pharmacyId);
        return {
          pharmacy,
          stock: s,
        };
      });

      return {
        medication: med,
        pharmacyInfo,
      };
    });
  }, [searchQuery, medications, stock, pharmacies]);

  const dutyPharmacy = pharmacies.find((p) => p.isOnDuty);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
              Φ
            </div>
            <h1 className="text-2xl font-bold text-gray-900">PharmaEbolowa</h1>
          </div>
          <nav className="flex gap-4">
            <Link href="/medications">
              <Button variant="ghost">Médicaments</Button>
            </Link>
            <Link href="/pharmacies">
              <Button variant="ghost">Pharmacies</Button>
            </Link>
            {user?.role === "admin" && (
              <Link href="/admin">
                <Button variant="outline">Admin</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Trouvez vos médicaments facilement
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Recherchez un médicament et découvrez sa disponibilité dans les pharmacies d'Ebolowa
          </p>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Rechercher par nom ou DCI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-3 text-lg"
            />
          </div>
        </div>
      </section>

      {/* Duty Pharmacy */}
      {dutyPharmacy && (
        <section className="bg-indigo-50 border-b">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🚑 Pharmacie de garde
            </h3>
            <Card className="bg-white border-2 border-indigo-200">
              <div className="p-6">
                <h4 className="text-xl font-bold text-gray-900 mb-4">
                  {dutyPharmacy.name}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <MapPin size={20} className="text-indigo-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Adresse</p>
                      <p className="text-gray-900">{dutyPharmacy.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone size={20} className="text-indigo-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Téléphone</p>
                      <a
                        href={`tel:${dutyPharmacy.phone}`}
                        className="text-indigo-600 hover:underline"
                      >
                        {dutyPharmacy.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Search Results */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {searchQuery.trim() && searchResults.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              Aucun médicament trouvé pour "{searchQuery}"
            </p>
          </div>
        )}

        {searchResults.map((result) => (
          <Card key={result.medication.id} className="mb-6 overflow-hidden">
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  {result.medication.name}
                </h3>
                {result.medication.dci && (
                  <p className="text-gray-600">DCI: {result.medication.dci}</p>
                )}
                {result.medication.therapeuticCategory && (
                  <Badge variant="outline" className="mt-2">
                    {result.medication.therapeuticCategory}
                  </Badge>
                )}
              </div>

              <div className="space-y-3">
                {result.pharmacyInfo.length === 0 ? (
                  <p className="text-gray-600">Aucune pharmacie n'a ce médicament</p>
                ) : (
                  result.pharmacyInfo.map((info) => (
                    <div
                      key={`${result.medication.id}-${info.pharmacy?.id}`}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {info.pharmacy?.name}
                        </h4>
                        <Badge
                          className={
                            statusConfig[info.stock.status as keyof typeof statusConfig]
                              ?.color
                          }
                        >
                          {
                            statusConfig[info.stock.status as keyof typeof statusConfig]
                              ?.label
                          }
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex gap-4">
                          <a
                            href={`tel:${info.pharmacy?.phone}`}
                            className="text-indigo-600 hover:underline flex items-center gap-1"
                          >
                            <Phone size={16} />
                            {info.pharmacy?.phone}
                          </a>
                        </div>
                        {info.stock.price && (
                          <p className="font-bold text-indigo-600">
                            {info.stock.price} FCFA
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        ))}
      </section>

      {/* Quick Links */}
      {!searchQuery.trim() && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Accès rapide</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/pharmacies/map">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <Map className="w-6 h-6 text-indigo-600" />
                  <h4 className="text-xl font-bold text-gray-900">
                    Pharmacies sur la carte
                  </h4>
                </div>
                <p className="text-gray-600">
                  Trouvez les pharmacies à proximité avec localisation GPS
                </p>
              </Card>
            </Link>
            <Link href="/pharmacies">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  Toutes les pharmacies
                </h4>
                <p className="text-gray-600">
                  Consultez la liste complète des pharmacies avec leurs horaires
                </p>
              </Card>
            </Link>
            <Link href="/medications">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  Tous les médicaments
                </h4>
                <p className="text-gray-600">
                  Parcourez le catalogue complet des médicaments disponibles
                </p>
              </Card>
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-center text-gray-400">
            © 2024 PharmaEbolowa. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
