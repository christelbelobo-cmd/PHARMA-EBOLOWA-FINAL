import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { MapPin, Phone, Clock, MapIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Pharmacies() {
  const { data: pharmacies = [] } = trpc.pharmacy.list.useQuery();

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
            <Link href="/medications">
              <Button variant="ghost">Médicaments</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Page Title */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Pharmacies d'Ebolowa
          </h2>
          <p className="text-xl text-gray-600">
            Découvrez toutes les pharmacies de la ville avec leurs horaires et coordonnées
          </p>
        </div>
      </section>

      {/* Pharmacies Grid */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pharmacies.map((pharmacy) => (
            <Card
              key={pharmacy.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900 flex-1">
                    {pharmacy.name}
                  </h3>
                  {pharmacy.isOnDuty && (
                    <Badge className="bg-red-100 text-red-800">🚑 Garde</Badge>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Address */}
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-indigo-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">{pharmacy.address}</p>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-indigo-600 flex-shrink-0" />
                    <a
                      href={`tel:${pharmacy.phone}`}
                      className="text-indigo-600 hover:underline"
                    >
                      {pharmacy.phone}
                    </a>
                  </div>

                  {/* Hours */}
                  {pharmacy.openingHours && (
                    <div className="flex items-start gap-3">
                      <Clock size={18} className="text-indigo-600 mt-1 flex-shrink-0" />
                      <p className="text-gray-700">
                        {JSON.parse(pharmacy.openingHours).open} -{" "}
                        {JSON.parse(pharmacy.openingHours).close}
                      </p>
                    </div>
                  )}

                  {/* Map Link */}
                  {pharmacy.mapLink && (
                    <a
                      href={pharmacy.mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-indigo-600 hover:underline mt-4"
                    >
                      <MapIcon size={18} />
                      Voir sur la carte
                    </a>
                  )}
                </div>

                {/* View Details Button */}
                <Link href={`/pharmacies/${pharmacy.id}`}>
                  <Button className="w-full mt-6">Voir le stock</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {pharmacies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Aucune pharmacie trouvée</p>
          </div>
        )}
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
