import { AvailabilityStatus } from "@/types";

export const STATUS_LABELS: Record<AvailabilityStatus, string> = {
  available: "Disponible",
  low: "Stock faible",
  on_order: "Sur commande",
  out: "Rupture",
};

// Classes Tailwind (badge) par statut.
export const STATUS_BADGE: Record<AvailabilityStatus, string> = {
  available: "bg-success/15 text-success border border-success/30",
  low: "bg-warning/15 text-warning-foreground border border-warning/40",
  on_order: "bg-accent text-accent-foreground border border-accent",
  out: "bg-destructive/10 text-destructive border border-destructive/30",
};

// Couleur du point indicateur.
export const STATUS_DOT: Record<AvailabilityStatus, string> = {
  available: "bg-success",
  low: "bg-warning",
  on_order: "bg-primary",
  out: "bg-destructive",
};

export const STATUS_ORDER: AvailabilityStatus[] = [
  "available",
  "low",
  "on_order",
  "out",
];

export function formatPrice(price: number | null): string {
  if (price === null) return "—";
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
}

export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
