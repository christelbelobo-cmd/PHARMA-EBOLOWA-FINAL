import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Clock, MapIcon, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";

const statusConfig = {
  available: { label: "Disponible", color: "bg-green-100 text-green-800" },
  low_stock: { label: "Stock faible", color: "bg-yellow-100 text-yellow-800" },
  on_order: { label: "Sur commande", color: "bg-blue-100 text-blue-800" },
  out_of_stock: { label: "Rupture", color: "bg-red-100 text-red-800" },
};

export default function PharmacyDetail() {
  const [, params] = useRoute("/pharmacies/:id");
  const pharmacyId = params?.id ? parseInt(params.id) : null;

  const { data: pharmacy } = trpc.pharmacy.getById.useQuery(pharmacyId || 0, {
    enabled: !!pharmacyId,
  });
  const { data: stock = [] } = trpc.stock.getByPharmacy.useQuery(pharmacyId || 0, {
    enabled: !!pharmacyId,
  });
  const { data: medications = [] } = trpc.medication.list.useQuery();

  if (!pharmacy) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Pharmacie non trouvée</p>
          <Link href="/pharmacies">
            <Button className="mt-4">Retour aux pharmacies</Button>
          </Link>
        </div>
      </div>
    );
  }

  const pharmacyStock = stock.map((s) => ({
    ...s,
    medication: medications.find((m) => m.id === s.medicationId),
  }));

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

      {/* Back Button */}
      <section className="max-w-7xl mx-auto px-4 py-4">
        <Link href="/pharmacies">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ArrowLeft size={18} />
            Retour aux pharmacies
          </Button>
        </Link>
      </section>

      {/* Pharmacy Info */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {pharmacy.name}
              </h1>
              {pharmacy.isOnDuty && (
                <Badge className="bg-red-100 text-red-800">🚑 Pharmacie de garde</Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Address */}
            <div className="flex items-start gap-4">
              <MapPin size={24} className="text-indigo-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Adresse</p>
                <p className="text-lg text-gray-900">{pharmacy.address}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-4">
              <Phone size={24} className="text-indigo-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Téléphone</p>
                <a
                  href={`tel:${pharmacy.phone}`}
                  className="text-lg text-indigo-600 hover:underline"
                >
                  {pharmacy.phone}
                </a>
              </div>
            </div>

            {/* Hours */}
            {pharmacy.openingHours && (
              <div className="flex items-start gap-4">
                <Clock size={24} className="text-indigo-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Horaires</p>
                  <p className="text-lg text-gray-900">
                    {JSON.parse(pharmacy.openingHours).open} -{" "}
                    {JSON.parse(pharmacy.openingHours).close}
                  </p>
                </div>
              </div>
            )}

            {/* Map */}
            {pharmacy.mapLink && (
              <div className="flex items-start gap-4">
                <MapIcon size={24} className="text-indigo-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Localisation</p>
                  <a
                    href={pharmacy.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg text-indigo-600 hover:underline"
                  >
                    Voir sur la carte
                  </a>
                </div>
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* Stock */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Stock disponible</h2>

        <div className="space-y-4">
          {pharmacyStock.length === 0 ? (
            <Card className="p-6">
              <p className="text-gray-600 text-center">Aucun médicament en stock</p>
            </Card>
          ) : (
            pharmacyStock.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">
                      {item.medication?.name}
                    </h3>
                    {item.medication?.dci && (
                      <p className="text-gray-600 text-sm">
                        DCI: {item.medication.dci}
                      </p>
                    )}
                    {item.medication?.dosage && (
                      <p className="text-gray-600 text-sm">
                        Dosage: {item.medication.dosage}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge
                      className={
                        statusConfig[item.status as keyof typeof statusConfig]?.color
                      }
                    >
                      {
                        statusConfig[item.status as keyof typeof statusConfig]
                          ?.label
                      }
                    </Badge>
                    {item.price && (
                      <p className="text-2xl font-bold text-indigo-600">
                        {item.price} FCFA
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))
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
