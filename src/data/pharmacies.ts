import { Pharmacy } from "@/types";

// Coordonnées approximatives autour d'Ebolowa (Sud Cameroun).
// Les adresses et numéros sont illustratifs et doivent être confirmés.
export const PHARMACIES: Pharmacy[] = [
  {
    id: "equasep",
    name: "Pharmacie Equasep",
    quartier: "Centre-ville",
    address: "Avenue du Marché, Centre-ville, Ebolowa",
    phone: "+237 6 99 11 22 01",
    hours: "Lun–Sam 08:00–19:00, Dim 09:00–13:00",
    lat: 2.9156,
    lng: 11.1547,
  },
  {
    id: "samba",
    name: "Pharmacie Samba",
    quartier: "Nko'ovos",
    address: "Carrefour Nko'ovos, Ebolowa",
    phone: "+237 6 99 11 22 02",
    hours: "Lun–Sam 08:00–20:00, Dim 09:00–14:00",
    lat: 2.9089,
    lng: 11.1492,
  },
  {
    id: "renaissance",
    name: "Pharmacie Renaissance",
    quartier: "Angalé",
    address: "Route d'Angalé, Ebolowa",
    phone: "+237 6 99 11 22 03",
    hours: "Lun–Sam 08:00–19:30",
    lat: 2.9201,
    lng: 11.1603,
  },
  {
    id: "bercail",
    name: "Pharmacie du Bercail",
    quartier: "Mvog-Betsi",
    address: "Quartier Mvog-Betsi, Ebolowa",
    phone: "+237 6 99 11 22 04",
    hours: "Lun–Sam 07:30–19:00, Dim 10:00–13:00",
    lat: 2.9123,
    lng: 11.1621,
  },
  {
    id: "mvila",
    name: "Pharmacie de la Mvila",
    quartier: "Mvila",
    address: "Avenue de la Mvila, Ebolowa",
    phone: "+237 6 99 11 22 05",
    hours: "Lun–Sam 08:00–19:00",
    lat: 2.9034,
    lng: 11.1558,
  },
  {
    id: "elites",
    name: "Pharmacie des Élites",
    quartier: "Camp SIC",
    address: "Camp SIC, Ebolowa",
    phone: "+237 6 99 11 22 06",
    hours: "Lun–Sam 08:00–20:00, Dim 09:00–13:00",
    lat: 2.9178,
    lng: 11.1489,
  },
  {
    id: "destinee",
    name: "Pharmacie Destinée",
    quartier: "Nkoémvone",
    address: "Route de Nkoémvone, Ebolowa",
    phone: "+237 6 99 11 22 07",
    hours: "Lun–Sam 08:00–19:00",
    lat: 2.8967,
    lng: 11.1456,
  },
];

export const getPharmacy = (id: string): Pharmacy | undefined =>
  PHARMACIES.find((p) => p.id === id);
