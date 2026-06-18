import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";

// Correction des icônes Leaflet par défaut
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Icône personnalisée pour l'utilisateur
const UserIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Icône personnalisée pour les pharmacies
const PharmacyIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface RoutingProps {
  userLocation: [number, number];
  pharmacyLocation: [number, number];
}

function Routing({ userLocation, pharmacyLocation }: RoutingProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || !userLocation || !pharmacyLocation) return;

    // @ts-ignore - Leaflet Routing Machine n'a pas de types parfaits pour React
    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(userLocation[0], userLocation[1]),
        L.latLng(pharmacyLocation[0], pharmacyLocation[1])
      ],
      lineOptions: {
        styles: [{ color: "#2563eb", weight: 6, opacity: 0.8 }],
        extendToWaypoints: true,
        missingRouteTolerance: 10
      },
      addWaypoints: false,
      // @ts-ignore
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false // Cacher le panneau d'instructions textuelles
    }).addTo(map);

    return () => {
      try {
        map.removeControl(routingControl);
      } catch (e) {
        console.warn("Error removing routing control", e);
      }
    };
  }, [map, userLocation, pharmacyLocation]);

  return null;
}

interface LeafletMapProps {
  userLocation: { lat: number; lng: number } | null;
  pharmacies: any[];
  selectedPharmacy: any | null;
  onPharmacySelect: (pharmacy: any) => void;
  showDirections: boolean;
  className?: string;
}

export function LeafletMap({
  userLocation,
  pharmacies,
  selectedPharmacy,
  onPharmacySelect,
  showDirections,
  className
}: LeafletMapProps) {
  const center: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lng] 
    : [2.9065, 11.1606];

  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={UserIcon}>
            <Popup>Votre position</Popup>
          </Marker>
        )}

        {pharmacies.map((pharmacy) => (
          pharmacy.lat && pharmacy.lng && (
            <Marker
              key={pharmacy.id}
              position={[pharmacy.lat, pharmacy.lng]}
              icon={PharmacyIcon}
              eventHandlers={{
                click: () => onPharmacySelect(pharmacy),
              }}
            >
              <Popup>
                <div className="font-bold">{pharmacy.name}</div>
                <div className="text-sm">{pharmacy.address}</div>
              </Popup>
            </Marker>
          )
        ))}

        {showDirections && userLocation && selectedPharmacy && selectedPharmacy.lat && selectedPharmacy.lng && (
          <Routing
            userLocation={[userLocation.lat, userLocation.lng]}
            pharmacyLocation={[selectedPharmacy.lat, selectedPharmacy.lng]}
          />
        )}
      </MapContainer>
    </div>
  );
}
