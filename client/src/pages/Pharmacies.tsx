import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { MapPin, Phone, Clock, MapIcon, Navigation, Loader } from "lucide-react";
import { trpc } from "@/lib/trpc";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

// Fonction utilitaire pour le calcul de distance
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function Pharmacies() {
  const { data: pharmacies = [] } = trpc.pharmacy.list.useQuery();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Localiser l'utilisateur au chargement
  useEffect(() => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsLocating(false);
        },
        () => {
          setIsLocating(false);
        }
      );
    }
  }, []);

  // Calculer les pharmacies avec distances
  const pharmaciesWithDistance = pharmacies.map((pharmacy) => {
    const lat = pharmacy.latitude || (2.9065 + (pharmacy.id % 10) * 0.001);
    const lng = pharmacy.longitude || (11.1606 + (pharmacy.id % 10) * 0.001);
    
    const distance = userLocation 
      ? calculateDistance(userLocation.lat, userLocation.lng, lat, lng)
      : undefined;

    return { ...pharmacy, distance };
  }).sort((a, b) => {
    if (a.distance === undefined) return 1;
    if (b.distance === undefined) return -1;
    return a.distance - b.distance;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Unifié */}
      <PublicHeader />

      {/* Page Title */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Pharmacies d'Ebolowa
              </h2>
              <p className="text-xl text-gray-600">
                Découvrez toutes les pharmacies de la ville avec leurs horaires et coordonnées
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsLocating(true);
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    setUserLocation({
                      lat: position.coords.latitude,
                      lng: position.coords.longitude,
                    });
                    setIsLocating(false);
                  },
                  () => setIsLocating(false)
                );
              }}
              className="flex items-center gap-2"
              disabled={isLocating}
            >
              {isLocating ? <Loader className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
              {userLocation ? "Actualiser ma position" : "Me localiser"}
            </Button>
          </div>
        </div>
      </section>

      {/* Pharmacies Grid */}
      <section className="flex-1 max-w-7xl mx-auto px-4 py-12 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pharmaciesWithDistance.map((pharmacy) => (
            <Card
              key={pharmacy.id}
              className="overflow-hidden hover:shadow-lg transition-shadow border-t-4 border-t-indigo-600"
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
                  {/* Distance Badge if available */}
                  {pharmacy.distance !== undefined && (
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Navigation size={12} className="mr-1" />
                        {pharmacy.distance.toFixed(2)} km
                      </Badge>
                    </div>
                  )}

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
                  <Button className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700">Voir le stock</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {pharmaciesWithDistance.length === 0 && (
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
