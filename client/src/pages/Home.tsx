import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Search, MapPin, Phone, Clock, Map, Pill, Store } from "lucide-react";
import { trpc } from "@/lib/trpc";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

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

  const groupedResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    
    // 1. Filtrer les médicaments
    const matchedMeds = medications.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        (m.dci && m.dci.toLowerCase().includes(query))
    );

    const groups: Record<string, any> = {};

    matchedMeds.forEach((med) => {
      const dciKey = med.dci || "Autres";
      if (!groups[dciKey]) {
        groups[dciKey] = {
          dci: dciKey,
          medsByForm: {} as Record<string, any[]>,
        };
      }

      // EXTRACTION DE LA FORME : On cherche le texte entre parenthèses dans le nom
      // Ex: "Paracétamol (Comprimé)" -> Forme = "Comprimé"
      const formMatch = med.name.match(/\(([^)]+)\)/);
      const formKey = formMatch ? formMatch[1] : "Générique / Autre";

      if (!groups[dciKey].medsByForm[formKey]) {
        groups[dciKey].medsByForm[formKey] = [];
      }

      const medStock = stock.filter((s) => s.medicationId === med.id);
      const pharmacyInfo = medStock.map((s) => {
        const pharmacy = pharmacies.find((p) => p.id === s.pharmacyId);
        return {
          pharmacy,
          stock: s,
        };
      });

      groups[dciKey].medsByForm[formKey].push({
        medication: med,
        pharmacyInfo,
      });
    });

    return Object.values(groups);
  }, [searchQuery, medications, stock, pharmacies]);

  const dutyPharmacy = pharmacies.find((p) => p.isOnDuty);

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col overflow-hidden font-sans">
      <PublicHeader />

      <main className="flex-1 flex flex-col overflow-hidden max-w-4xl w-full mx-auto px-4 py-6 gap-6">
        
        <div className="text-center flex-none">
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl tracking-tight">
            Vérification des médicaments à Ebolowa
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Recherchez par molécule ou par nom pour voir les disponibilités.
          </p>
        </div>

        <div className="bg-white p-3 rounded-xl shadow-md border border-gray-100 flex-none">
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Ex: Paracétamol, Amoxicilline..."
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

        <div className="flex-1 overflow-y-auto pr-1 min-h-0">
          
          {!searchQuery.trim() && (
            <div className="space-y-6 py-2">
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
                    <p className="text-xs text-gray-500">Liste complète des pharmacies.</p>
                  </Card>
                </Link>

                <Link href="/medications">
                  <Card className="p-4 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer bg-white group">
                    <div className="flex items-center gap-2 mb-1">
                      <Pill className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                      <h4 className="font-bold text-gray-900 text-sm">Tout le catalogue</h4>
                    </div>
                    <p className="text-xs text-gray-500">Explorer tous les médicaments.</p>
                  </Card>
                </Link>
              </div>
            </div>
          )}

          {searchQuery.trim() && (
            <div className="space-y-6 py-1">
              {groupedResults.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-gray-500 font-medium">
                    Aucune molécule trouvée pour <span className="font-bold text-gray-700">"{searchQuery}"</span>
                  </p>
                </div>
              ) : (
                groupedResults.map((group: any) => (
                  <div key={group.dci} className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <div className="h-8 w-1 bg-indigo-600 rounded-full"></div>
                      <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                        {group.dci}
                      </h3>
                    </div>

                    {Object.entries(group.medsByForm).map(([form, items]: [string, any]) => (
                      <Card key={form} className="border-gray-200 shadow-sm bg-white overflow-hidden">
                        <div className="p-3 bg-slate-50 border-b flex items-center gap-2">
                          <Badge variant="outline" className="bg-white text-indigo-700 border-indigo-200 font-bold">
                            {form}
                          </Badge>
                          <span className="text-xs text-gray-500 font-medium">
                            {items.length} variante(s)
                          </span>
                        </div>

                        <div className="divide-y divide-gray-100">
                          {items.map((item: any) => (
                            <div key={item.medication.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                    {/* On affiche le nom sans la partie entre parenthèses pour éviter la répétition */}
                                    {item.medication.name.replace(/\s*\([^)]+\)/, "")}
                                    {item.medication.dosage && (
                                      <span className="text-indigo-600 font-medium text-xs bg-indigo-50 px-1.5 py-0.5 rounded">
                                        {item.medication.dosage}
                                      </span>
                                    )}
                                  </h4>
                                </div>
                              </div>

                              <div className="space-y-2">
                                {item.pharmacyInfo.length === 0 ? (
                                  <p className="text-xs text-gray-400 italic">Aucun stock disponible.</p>
                                ) : (
                                  item.pharmacyInfo.map((info: any) => (
                                    <div key={`${item.medication.id}-${info.pharmacy?.id}`} className="flex items-center justify-between text-xs py-1.5 border-t border-gray-50 first:border-0">
                                      <div className="flex items-center gap-2">
                                        <Store className="w-3 h-3 text-gray-400" />
                                        <span className="font-bold text-gray-700">{info.pharmacy?.name}</span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <Badge className={`text-[10px] px-2 py-0 border font-bold ${statusConfig[info.stock.status as keyof typeof statusConfig]?.color || 'bg-gray-100'}`}>
                                          {statusConfig[info.stock.status as keyof typeof statusConfig]?.label || info.stock.status}
                                        </Badge>
                                        {info.stock.price && (
                                          <span className="font-black text-indigo-600">
                                            {info.stock.price} FCFA
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
