import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { MapPin, Phone, Clock, MapIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export default function Pharmacies() {
  const { data: pharmacies = [] } = trpc.pharmacy.list.useQuery();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Unifié */}
      <PublicHeader />

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
      <section className="flex-1 max-w-7xl mx-auto px-4 py-12 w-full">
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

      {/* Footer Unifié */}
      <PublicFooter />
    </div>
  );
}
