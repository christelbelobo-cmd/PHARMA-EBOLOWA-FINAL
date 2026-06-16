import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Search, MapPin, Phone, Clock, Map, Pill } from "lucide-react";
import { trpc } from "@/lib/trpc";

const statusConfig = {
  available: { label: "Disponible", color: "bg-green-100 text-green-800 border-green-200" },
  low_stock: { label: "Stock faible", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  on_order: { label: "Sur commande", color: "bg-blue-100 text-blue-800 border-blue-200" },
  out_of_stock: { label: "Rupture", color: "bg-red-100 text-red-800 border-red-200" },
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
    <div className="h-screen w-full bg-slate-50 flex flex-col overflow-hidden font-sans">
      
      {/* 1. Header Fixe Épuré */}
      <header className="bg-white border-b shadow-sm flex-none z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
              Φ
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-gray-900 leading-none">PharmaEbolowa</h1>
              <span className="text-[10px] text-gray-500 font-medium flex items-center gap-0.5 mt-0.5">
                <MapPin size={10} className="text-indigo-500" /> Ebolowa, Cameroun
              </span>
            </div>
          </div>
          <nav className="flex gap-2">
            <Link href="/medications">
              <Button variant="ghost" size="sm" className="text-gray-600 font-medium">Médicaments</Button>
            </Link>
            <Link href="/pharmacies">
              <Button variant="ghost" size="sm" className="text-gray-600 font-medium">Pharmacies</Button>
            </Link>
            {user?.role === "admin" && (
              <Link href="/admin">
                <Button variant="outline" size="sm" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">Admin</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* 2. Zone Centrale Dynamique Flex-1 (Prend toute la hauteur restante sans déborder) */}
      <main className="flex-1 flex flex-col overflow-hidden max-w-4xl w-full mx-auto px-4 py-6 gap-6 justify-center">
        
        {/* Titre accrocheur et compact */}
        <div className="text-center flex-none">
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl tracking-tight">
            Vérification des médicaments à Ebolowa
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Recherchez instantanément la disponibilité et le prix dans les officines de la ville.
          </p>
        </div>

        {/* BARRE DE RECHERCHE CORRIGÉE : Bloc visible au centre avec bouton Rechercher */}
        <div className="bg-white p-3 rounded-xl shadow-md border border-gray-100 flex-none">
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Ex: Paracétamol, Ibuprofène, Amoxicilline..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 py-5 text-base border-gray-200 rounded-lg focus-visible:ring-indigo-500 bg-slate-50/50"
              />
            </div>
            <Button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 h-auto rounded-lg shadow-sm flex items-center gap-2"
            >
              <Search size={16} />
              <span className="hidden sm:inline">Rechercher</span>
            </Button>
          </form>
        </div>

        {/* 3. Conteneur de Contenu défilable de manière indépendante */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-0">
          
          {/* CAS A : L'utilisateur n'a pas encore fait de recherche */}
          {!searchQuery.trim() && (
            <div className="space-y-6 py-2">
              {/* Pharmacie de garde mise en avant */}
              {dutyPharmacy && (
                <Card className="border-2 border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-white shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold tracking-wider text-indigo-800 uppercase flex items-center gap-1.5">
                        🚨 Pharmacie de garde actuelle
                      </h3>
                      <Badge className="bg-indigo-600 text-white animate-pulse">Ouvert 24h/24</Badge>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">{dutyPharmacy.name}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin size={16} className="text-gray-400 flex-none" />
                        <span className="truncate">{dutyPharmacy.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone size={16} className="text-gray-400 flex-none" />
                        <a href={`tel:${dutyPharmacy.phone}`} className="text-indigo-600 font-semibold hover:underline">
                          {dutyPharmacy.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Liens d'accès rapide discrets */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link href="/pharmacies/map">
                  <Card className="p-4 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer bg-white group">
                    <div className="flex items-center gap-2 mb-1">
                      <Map className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                      <h4 className="font-bold text-gray-900 text-sm">Pharmacies sur carte</h4>
                    </div>
                    <p className="text-xs text-gray-500">Localisation GPS des officines.</p>
                  </Card>
                </Link>

                <Link href="/pharmacies">
                  <Card className="p-4 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer bg-white group">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                      <h4 className="font-bold text-gray-900 text-sm">Horaires & Contacts</h4>
                    </div>
                    <p className="text-xs text-gray-500">Liste complète des 7 pharmacies.</p>
                  </Card>
                </Link>

                <Link href="/medications">
                  <Card className="p-4 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer bg-white group">
                    <div className="flex items-center gap-2 mb-1">
                      <Pill className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                      <h4 className="font-bold text-gray-900 text-sm">Tout le catalogue</h4>
                    </div>
                    <p className="text-xs text-gray-500">Explorer les 143+ médicaments.</p>
                  </Card>
                </Link>
              </div>
            </div>
          )}

          {/* CAS B : Résultats de la recherche en cours */}
          {searchQuery.trim() && (
            <div className="space-y-4 py-1">
              {searchResults.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-gray-500 font-medium">
                    Aucun médicament trouvé pour <span className="font-bold text-gray-700">"{searchQuery}"</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Vérifiez l'orthographe ou essayez avec la DCI.</p>
                </div>
              ) : (
                searchResults.map((result) => (
                  <Card key={result.medication.id} className="border-gray-200 shadow-sm bg-white overflow-hidden">
                    {/* Header Médicament */}
                    <div className="p-4 bg-slate-50/50 border-b flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{result.medication.name}</h3>
                        {result.medication.dci && (
                          <p className="text-xs text-gray-500 font-medium">DCI : {result.medication.dci}</p>
                        )}
                      </div>
                      {result.medication.therapeuticCategory && (
                        <Badge variant="secondary" className="bg-slate-200/70 text-gray-700 border-none text-[11px]">
                          {result.medication.therapeuticCategory}
                        </Badge>
                      )}
                    </div>

                    {/* Liste des stocks par Pharmacie */}
                    <div className="p-3 divide-y divide-gray-100">
                      {result.pharmacyInfo.length === 0 ? (
                        <p className="text-sm text-gray-500 p-2 text-center">Aucune donnée de stock disponible.</p>
                      ) : (
                        result.pharmacyInfo.map((info) => (
                          <div key={`${result.medication.id}-${info.pharmacy?.id}`} className="py-3 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                            <div className="space-y-0.5">
                              <h4 className="font-bold text-gray-800 text-sm">{info.pharmacy?.name}</h4>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <a href={`tel:${info.pharmacy?.phone}`} className="text-indigo-600 hover:underline flex items-center gap-0.5 font-medium">
                                  <Phone size={12} /> {info.pharmacy?.phone}
                                </a>
                              </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-4 flex-none">
                              <Badge className={`text-xs px-2.5 py-0.5 border font-semibold ${statusConfig[info.stock.status as keyof typeof statusConfig]?.color || 'bg-gray-100'}`}>
                                {statusConfig[info.stock.status as keyof typeof statusConfig]?.label || info.stock.status}
                              </Badge>
                              {info.stock.price && (
                                <span className="font-extrabold text-indigo-600 text-sm bg-indigo-50/50 px-2 py-1 rounded-md border border-indigo-100/50">
                                  {info.stock.price} FCFA
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* 4. Footer Fixe et Discret */}
      <footer className="bg-white border-t py-2 flex-none text-center text-xs text-gray-400">
        © 2026 PharmaEbolowa — Système de suivi de disponibilité en temps réel
      </footer>
    </div>
  );
}
