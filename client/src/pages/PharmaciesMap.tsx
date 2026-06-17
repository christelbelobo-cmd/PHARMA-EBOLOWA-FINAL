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
  Zap,
  Star,
  X,
  ArrowRight,
  Loader,
  Crosshair,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

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

interface DirectionInfo {
  distance: string;
  duration: string;
  steps: number;
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
  const [showClosestOnly, setShowClosestOnly] = useState(false);
  const [closestCount, setClosestCount] = useState(3);
  const [directionInfo, setDirectionInfo] = useState<DirectionInfo | null>(null);
  const [isLoadingDirections, setIsLoadingDirections] = useState(false);
  const [pharmacyWithDirections, setPharmacyWithDirections] = useState<PharmacyWithDistance | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);

  const { data: pharmacies, isLoading } = trpc.pharmacy.list.useQuery();

  // Fonction pour localiser l'utilisateur
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      toast.error("La géolocalisation n'est pas disponible sur votre appareil");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(loc);
        setHasLocationPermission(true);
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
        toast.success("Position détectée !");
        setIsLocating(false);
      },
      (error) => {
        console.error("Erreur de géolocalisation:", error);
        setHasLocationPermission(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Vous avez refusé l'accès à votre localisation. Veuillez l'autoriser dans les paramètres du navigateur.");
        } else {
          toast.error("Impossible de détecter votre position. Utilisation de la localisation par défaut.");
        }
        // Localisation par défaut : Ebolowa, Cameroun
        const defaultLoc = { lat: 2.9065, lng: 11.1606 };
        setUserLocation(defaultLoc);
        userLocationRef.current = defaultLoc;
        if (mapRef.current) {
          mapRef.current.setCenter(defaultLoc);
        }
        setIsLocating(false);
      }
    );
  };

  // Localiser l'utilisateur au chargement
  useEffect(() => {
    handleRequestLocation();
  }, []);

  // Mettre à jour les marqueurs quand le rayon change
  useEffect(() => {
    if (!mapRef.current || !pharmacies) return;

    // Supprimer les anciens marqueurs
    markersRef.current.forEach((marker) => marker.element?.remove());
    markersRef.current = [];

    // Calculer les pharmacies avec distances
    let allPharmacies = pharmacies
      .map((pharmacy) => {
        // Utiliser les coordonnées de la base de données ou défaut Ebolowa
        const lat = pharmacy.latitude || 2.9065;
        const lng = pharmacy.longitude || 11.1606;

        // Si l'utilisateur n'est pas localisé, on utilise le centre d'Ebolowa pour le calcul initial
        const baseLat = userLocation?.lat || 2.9065;
        const baseLng = userLocation?.lng || 11.1606;

        const distance = calculateDistance(
          baseLat,
          baseLng,
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
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));

    // Filtrer par rayon de recherche
    let filtered = allPharmacies.filter((p) => p.distance! <= searchRadius[0]);

    // Si aucune pharmacie dans le rayon, afficher au moins les 3 plus proches
    if (filtered.length === 0 && allPharmacies.length > 0) {
      filtered = allPharmacies.slice(0, 3);
    }

    // Afficher seulement les plus proches si activé
    if (showClosestOnly) {
      filtered = filtered.slice(0, closestCount);
    }

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
    
    setIsLoadingDirections(true);
    const directionsService = new window.google.maps.DirectionsService();
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        map: mapRef.current,
        polylineOptions: {
          strokeColor: "#2563eb",
          strokeWeight: 4,
        },
      });
    }

    try {
      const result = await directionsService.route({
        origin: userLocation,
        destination: { lat: pharmacy.lat, lng: pharmacy.lng },
        travelMode: window.google?.maps?.TravelMode?.DRIVING || "DRIVING",
      });

      if (result && "routes" in result && result.routes.length > 0) {
        const route = result.routes[0];
        const leg = route.legs[0];
        
        directionsRendererRef.current?.setDirections(result);
        setShowDirections(true);
        setPharmacyWithDirections(pharmacy);
        
        // Extraire les informations d'itinéraire
        setDirectionInfo({
          distance: leg.distance?.text || "N/A",
          duration: leg.duration?.text || "N/A",
          steps: route.legs.reduce((sum, l) => sum + l.steps.length, 0),
        });
        
        toast.success("Itinéraire calculé !");
      }
    } catch (error: unknown) {
      console.error("Erreur lors du calcul de l'itinéraire:", error);
      toast.error("Impossible de calculer l'itinéraire");
    } finally {
      setIsLoadingDirections(false);
    }
  };

  // Masquer les itinéraires
  const handleClearDirections = () => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ 
        routes: [], 
        request: {} as google.maps.DirectionsRequest,
        geocoded_waypoints: [] 
      });
    }
    setShowDirections(false);
    setDirectionInfo(null);
    setPharmacyWithDirections(null);
  };

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Header Unifié */}
      <PublicHeader />

      <div className="flex-1 container mx-auto px-4 py-8">
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
            <Card className="overflow-hidden shadow-lg relative">
              <MapView
                initialCenter={userLocation || { lat: 2.9065, lng: 11.1606 }}
                initialZoom={14}
                onMapReady={handleMapReady}
                className="h-[600px]"
              />
              {/* Bouton "Ma position" */}
              <button
                onClick={handleRequestLocation}
                disabled={isLocating}
                className="absolute bottom-4 right-4 bg-white hover:bg-gray-100 disabled:bg-gray-100 text-blue-600 disabled:text-gray-400 p-3 rounded-lg shadow-lg border border-gray-200 transition-all flex items-center gap-2 font-medium"
                title="Activer la localisation"
              >
                {isLocating ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Localisation...</span>
                  </>
                ) : (
                  <>
                    <Crosshair className="w-5 h-5" />
                    <span className="text-sm">Ma position</span>
                  </>
                )}
              </button>
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Pharmacies trouvées ({pharmaciesInRadius.length})
                </h3>
                <button
                  onClick={() => setShowClosestOnly(!showClosestOnly)}
                  className={`p-2 rounded-lg transition-all ${
                    showClosestOnly
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  title="Afficher seulement les plus proches"
                >
                  <Zap className="w-5 h-5" />
                </button>
              </div>
              {showClosestOnly && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-700">Les {closestCount} plus proches</span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 3, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => setClosestCount(num)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                          closestCount === num
                            ? "bg-blue-600 text-white"
                            : "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {isLoading ? (
                  <p className="text-gray-500">Chargement...</p>
                ) : pharmaciesInRadius.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    Aucune pharmacie trouvée dans ce rayon
                  </p>
                ) : (
                  pharmaciesInRadius.map((pharmacy, index) => (
                    <div key={pharmacy.id}>
                      <button
                        onClick={() => {
                          setSelectedPharmacy(pharmacy);
                          // Centrer la carte sur la pharmacie sélectionnée
                          if (mapRef.current && pharmacy.lat && pharmacy.lng) {
                            mapRef.current.setCenter({ lat: pharmacy.lat, lng: pharmacy.lng });
                            mapRef.current.setZoom(16);
                          }
                        }}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                          selectedPharmacy?.id === pharmacy.id
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-sm flex items-center gap-2">
                              {showClosestOnly && index < 3 && (
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              )}
                              {pharmacy.name}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {pharmacy.distance?.toFixed(2)} km
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {pharmacy.isOnDuty && (
                              <Badge className="bg-green-600 text-xs">De garde</Badge>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShowDirections(pharmacy);
                              }}
                              className="p-2 hover:bg-blue-100 rounded transition-colors"
                              title="Y aller"
                            >
                              <ArrowRight className="w-4 h-4 text-blue-600" />
                            </button>
                          </div>
                        </div>
                      </button>
                    </div>
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
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-700 font-semibold mb-2">Distance : {selectedPharmacy.distance?.toFixed(2)} km</p>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (selectedPharmacy.distance || 0) * 10)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => handleShowDirections(selectedPharmacy)}
                    disabled={isLoadingDirections}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 disabled:opacity-50"
                  >
                    {isLoadingDirections ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Calcul en cours...
                      </>
                    ) : (
                      <>
                        <Navigation className="w-4 h-4" />
                        Y aller
                      </>
                    )}
                  </Button>

                  {showDirections && directionInfo && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-green-900">Itinéraire actif</h4>
                        <button
                          onClick={handleClearDirections}
                          className="p-1 hover:bg-green-100 rounded transition-colors"
                          title="Masquer l'itinéraire"
                        >
                          <X className="w-4 h-4 text-green-600" />
                        </button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-green-700">Distance:</span>
                          <span className="font-semibold text-green-900">{directionInfo.distance}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-green-700">Durée:</span>
                          <span className="font-semibold text-green-900">{directionInfo.duration}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-green-700">Nombre d'étapes:</span>
                          <span className="font-semibold text-green-900">{directionInfo.steps}</span>
                        </div>
                      </div>
                    </div>
                  )}

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

      {/* Footer Unifié */}
      <PublicFooter />
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
    <div class="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full border-2 border-white shadow-lg">
      <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clip-rule="evenodd" />
      </svg>
    </div>
  `;
  return div;
}

function createPharmacyMarkerContent(
  pharmacy: PharmacyWithDistance
): HTMLElement {
  const div = document.createElement("div");
  const bgColor = pharmacy.isOnDuty ? "bg-red-600" : "bg-indigo-600";
  div.innerHTML = `
    <div class="flex items-center justify-center w-10 h-10 ${bgColor} rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform">
      <span class="text-white font-bold text-lg">Φ</span>
    </div>
  `;
  return div;
}
