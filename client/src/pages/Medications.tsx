import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { trpc } from "@/lib/trpc";

const statusConfig = {
  available: { label: "Disponible", color: "bg-green-100 text-green-800" },
  low_stock: { label: "Stock faible", color: "bg-yellow-100 text-yellow-800" },
  on_order: { label: "Sur commande", color: "bg-blue-100 text-blue-800" },
  out_of_stock: { label: "Rupture", color: "bg-red-100 text-red-800" },
};

export default function Medications() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const { data: medications = [] } = trpc.medication.list.useQuery();
  const { data: stock = [] } = trpc.stock.list.useQuery();

  const categories = useMemo(() => {
    const cats = new Set<string>();
    medications.forEach((m) => {
      if (m.therapeuticCategory) {
        cats.add(m.therapeuticCategory);
      }
    });
    return Array.from(cats).sort();
  }, [medications]);

  const filteredMedications = useMemo(() => {
    return medications.filter((med) => {
      const matchesSearch =
        searchQuery === "" ||
        med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (med.dci && med.dci.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === null || med.therapeuticCategory === selectedCategory;

      let matchesAvailability = true;
      if (onlyAvailable) {
        const medStock = stock.filter((s) => s.medicationId === med.id);
        matchesAvailability = medStock.some((s) => s.status === "available");
      }

      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [medications, searchQuery, selectedCategory, onlyAvailable, stock]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                Φ
              </div>
              <h1 className="text-2xl font-bold text-gray-900">PharmaEbolowa</h1>
            </div>
          </Link>
          <nav className="flex gap-4">
            <Link href="/">
              <Button variant="ghost">Accueil</Button>
            </Link>
            <Link href="/pharmacies">
              <Button variant="ghost">Pharmacies</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Page Title */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Catalogue des médicaments
          </h2>
          <p className="text-xl text-gray-600">
            Parcourez tous les médicaments disponibles dans nos pharmacies
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          {/* Search */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Nom ou DCI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie thérapeutique
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
                size="sm"
              >
                Toutes
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat)}
                  size="sm"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Availability Filter */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">
                Disponibles uniquement
              </span>
            </label>
          </div>
        </div>
      </section>

      {/* Medications List */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="space-y-4">
          {filteredMedications.map((medication) => {
            const medStock = stock.filter((s) => s.medicationId === medication.id);
            const availableCount = medStock.filter(
              (s) => s.status === "available"
            ).length;

            return (
              <Card key={medication.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">
                      {medication.name}
                    </h3>
                    {medication.dci && (
                      <p className="text-gray-600 text-sm">DCI: {medication.dci}</p>
                    )}
                    {medication.dosage && (
                      <p className="text-gray-600 text-sm">Dosage: {medication.dosage}</p>
                    )}
                  </div>
                  {medication.therapeuticCategory && (
                    <Badge variant="outline">{medication.therapeuticCategory}</Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Disponible dans{" "}
                    <span className="font-semibold text-gray-900">
                      {availableCount}
                    </span>{" "}
                    pharmacie(s)
                  </div>
                  <div className="flex gap-2">
                    {medStock.slice(0, 3).map((s) => (
                      <Badge
                        key={`${medication.id}-${s.pharmacyId}`}
                        className={
                          statusConfig[s.status as keyof typeof statusConfig]?.color
                        }
                      >
                        {
                          statusConfig[s.status as keyof typeof statusConfig]
                            ?.label
                        }
                      </Badge>
                    ))}
                    {medStock.length > 3 && (
                      <Badge variant="outline">+{medStock.length - 3}</Badge>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}

          {filteredMedications.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                Aucun médicament ne correspond à vos critères
              </p>
            </div>
          )}
        </div>
      </section>

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
