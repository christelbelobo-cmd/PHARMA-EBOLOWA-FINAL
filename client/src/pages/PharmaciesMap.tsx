import { useState, useRef, useEffect } from "react";
import { MapView } from "@/components/Map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Navigation,
  Phone,
  Clock,
  Map,
  Eye,
  AlertCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface PharmacyWithDistance {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string | null;
  openingHours: string | null;
  mapLink: string | null;
  isOnDuty: boolean;
  lat?: number;
  lng?: number;
  distance?: number;
}

export default function PharmaciesMap() {
  const mapRef = useRef<google.maps.Map | null>(null);
  const userLocationRef = useRef<google.maps.LatLngLiteral | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(
    null
  );

  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(
    null
  );
  const [searchRadius, setSearchRadius] = useState([5]); // 5 km par défaut (1-10 km)
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyWithDistance | null>(
    null
  );
  const [showDirections, setShowDirections] = useState(false);
  const [showStreetView, setShowStreetView] = useState(false);
  const [pharmaciesInRadius, setPharmaciesInRadius] = useState<PharmacyWithDistance[]>(
    []
  );

  const { data: pharmacies, isLoading } = trpc.pharmacy.list.useQuery();

  // Localiser l'utilisateur
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);
          userLocationRef.current = loc;

          // Centrer la carte sur la position de l'utilisateur
          if (mapRef.current) {
            mapRef.current.setCenter(loc);
            mapRef.current.setZoom(14);

                // Ajouter un marqueur pour la position de l'utilisateur
                if (window.google?.maps?.marker?.AdvancedMarkerElement) {
                  new window.google.maps.marker.AdvancedMarkerElement({
                    map: mapRef.current,
                    position: loc,
                    title: "Votre position",
                    content: createUserMarkerContent(),
                  });
                }
          }
        },
        (error) => {
          console.error("Erreur de géolocalisation:", error);
          toast.error("Impossible d'accéder à votre localisation");
          // Localisation par défaut : Ebolowa, Cameroun
          const defaultLoc = { lat: 2.9065, lng: 11.1606 };
          setUserLocation(defaultLoc);
          userLocationRef.current = defaultLoc;
          if (mapRef.current) {
            mapRef.current.setCenter(defaultLoc);
          }
        }
      );
    }
  }, []);

  // Mettre à jour les marqueurs quand le rayon change
  useEffect(() => {
    if (!mapRef.current || !userLocation || !pharmacies) return;

    // Supprimer les anciens marqueurs
    markersRef.current.forEach((marker) => marker.element?.remove());
    markersRef.current = [];

    // Calculer les pharmacies dans le rayon
    const filtered = pharmacies
      .map((pharmacy) => {
        // Utiliser les vraies coordonnées de la base de données
        const lat = pharmacy.latitude || 2.9065;
        const lng = pharmacy.longitude || 11.1606;

        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          lat,
          lng
        );

        return {
          ...pharmacy,
          lat,
          lng,
          distance,
        };
      })
      .filter((p) => p.distance! <= searchRadius[0])
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));

    setPharmaciesInRadius(filtered);

    // Ajouter les marqueurs pour les pharmacies
    filtered.forEach((pharmacy) => {
      if (mapRef.current && pharmacy.lat && pharmacy.lng) {
        if (window.google?.maps?.marker?.AdvancedMarkerElement) {
          const marker = new window.google.maps.marker.AdvancedMarkerElement({
            map: mapRef.current,
            position: { lat: pharmacy.lat, lng: pharmacy.lng },
            title: pharmacy.name,
            content: createPharmacyMarkerContent(pharmacy),
          });

          marker.addListener("click", () => {
            setSelectedPharmacy(pharmacy);
            setShowDirections(false);
            setShowStreetView(false);
          });

          markersRef.current.push(marker);
        }
      }
    });
  }, [searchRadius, pharmacies, userLocation]);

  // Afficher les itinéraires
  const handleShowDirections = async (pharmacy: PharmacyWithDistance) => {
    if (!mapRef.current || !userLocation || !pharmacy.lat || !pharmacy.lng)
      return;

    if (!window.google?.maps?.DirectionsService) return;
    const directionsService = new window.google.maps.DirectionsService();
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        map: mapRef.current,
      });
    }

    try {
      const result = await directionsService.route({
        origin: userLocation,
        destination: { lat: pharmacy.lat, lng: pharmacy.lng },
        travelMode: window.google?.maps?.TravelMode?.DRIVING || "DRIVING",
      });

      if (result && "routes" in result && result.routes.length > 0) {
        directionsRendererRef.current?.setDirections(result);
        setShowDirections(true);
        toast.success("Itinéraire calculé !");
      }
    } catch (error: unknown) {
      console.error("Erreur lors du calcul de l'itinéraire:", error);
      toast.error("Impossible de calculer l'itinéraire");
    }
  };

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Pharmacies à proximité
          </h1>
          <p className="text-gray-600">
            Trouvez les pharmacies les plus proches de vous sur la carte
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Carte */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden shadow-lg">
              <MapView
                initialCenter={userLocation || { lat: 2.9065, lng: 11.1606 }}
                initialZoom={14}
                onMapReady={handleMapReady}
                className="h-[600px]"
              />
            </Card>
          </div>

          {/* Panneau latéral */}
          <div className="space-y-6">
            {/* Contrôle du rayon */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Rayon de recherche
              </h3>
              <div className="space-y-4">
                <Slider
                  value={searchRadius}
                  onValueChange={setSearchRadius}
                  min={1}
                  max={10}
                  step={0.5}
                  className="w-full"
                />
                <div className="text-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {searchRadius[0]}
                  </span>
                  <span className="text-gray-600"> km</span>
                </div>
              </div>
            </Card>

            {/* Pharmacies trouvées */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Pharmacies trouvées ({pharmaciesInRadius.length})
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {isLoading ? (
                  <p className="text-gray-500">Chargement...</p>
                ) : pharmaciesInRadius.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    Aucune pharmacie trouvée dans ce rayon
                  </p>
                ) : (
                  pharmaciesInRadius.map((pharmacy) => (
                    <button
                      key={pharmacy.id}
                      onClick={() => setSelectedPharmacy(pharmacy)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedPharmacy?.id === pharmacy.id
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="font-semibold text-sm">{pharmacy.name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {pharmacy.distance?.toFixed(1)} km
                      </div>
                      {pharmacy.isOnDuty && (
                        <Badge className="mt-2 bg-green-600">De garde</Badge>
                      )}
                    </button>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Détails de la pharmacie sélectionnée */}
        {selectedPharmacy && (
          <Card className="mt-8 p-8 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {selectedPharmacy.name}
                </h2>

                <div className="space-y-4">
                  {selectedPharmacy.isOnDuty && (
                    <div className="flex items-center gap-3 p-3 bg-green-100 rounded-lg border border-green-300">
                      <AlertCircle className="w-5 h-5 text-green-700" />
                      <span className="text-green-700 font-semibold">
                        Pharmacie de garde
                      </span>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Adresse</p>
                      <p className="text-gray-600">{selectedPharmacy.address}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Téléphone</p>
                      <a
                        href={`tel:${selectedPharmacy.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {selectedPharmacy.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Horaires</p>
                      <p className="text-gray-600">
                        {selectedPharmacy.openingHours}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Navigation className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Distance</p>
                      <p className="text-gray-600">
                        {selectedPharmacy.distance?.toFixed(1)} km
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <Button
                    onClick={() => handleShowDirections(selectedPharmacy)}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    Obtenir l'itinéraire
                  </Button>

                  <Button
                    onClick={() => setShowStreetView(!showStreetView)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {showStreetView ? "Masquer" : "Voir"} Street View
                  </Button>

                  {selectedPharmacy.mapLink && (
                    <Button
                      onClick={() => window.open(selectedPharmacy.mapLink!, "_blank")}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Map className="w-4 h-4" />
                      Ouvrir dans Google Maps
                    </Button>
                  )}
                </div>
              </div>

              {/* Street View */}
              {showStreetView && (
                <div className="rounded-lg overflow-hidden border-2 border-gray-200 h-[400px]">
                  <iframe
                    title="Street View"
                    width="100%"
                    height="100%"
                    frameBorder={0}
                    src={`https://www.google.com/maps/embed/v1/streetview?key=${
                      import.meta.env.VITE_FRONTEND_FORGE_API_KEY
                    }&location=${selectedPharmacy.lat},${selectedPharmacy.lng}&heading=0&pitch=0`}
                    allowFullScreen={true}
                  />
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// Fonctions utilitaires
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

function createUserMarkerContent(): HTMLElement {
  const div = document.createElement("div");
  div.innerHTML = `
    <div class="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full border-4 border-white shadow-lg">
      <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clip-rule="evenodd" />
      </svg>
    </div>
  `;
  return div;
}

function createPharmacyMarkerContent(pharmacy: PharmacyWithDistance): HTMLElement {
  const div = document.createElement("div");
  div.innerHTML = `
    <div class="flex items-center justify-center w-10 h-10 ${
      pharmacy.isOnDuty ? "bg-green-600" : "bg-red-600"
    } rounded-full border-4 border-white shadow-lg">
      <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.5 1.5H9.5C4.81 1.5 1 5.31 1 10c0 5.25 3.07 9.26 7 10.33v-2.3c-2.39-.69-4-2.95-4-5.53 0-3.31 2.69-6 6-6s6 2.69 6 6c0 2.58-1.61 4.84-4 5.53v2.3c3.93-1.07 7-5.08 7-10.33 0-4.69-3.81-8.5-8.5-8.5z" />
      </svg>
    </div>
  `;
  return div;
}
