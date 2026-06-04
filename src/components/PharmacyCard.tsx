import { Link } from "react-router-dom";
import { MapPin, Phone, Clock, ShieldCheck } from "lucide-react";
import { Pharmacy } from "@/types";
import { Card } from "@/components/ui/card";

interface Props {
  pharmacy: Pharmacy;
  isDuty?: boolean;
  availableCount?: number;
}

export function PharmacyCard({ pharmacy, isDuty, availableCount }: Props) {
  return (
    <Card className="flex h-full flex-col p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link to={`/pharmacies/${pharmacy.id}`} className="text-lg font-semibold hover:text-primary">
            {pharmacy.name}
          </Link>
          <p className="text-sm text-muted-foreground">{pharmacy.quartier}</p>
        </div>
        {isDuty && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="h-3.5 w-3.5" /> De garde
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {pharmacy.address}
        </p>
        <p className="flex items-center gap-2">
          <Phone className="h-4 w-4 shrink-0" />
          <a href={`tel:${pharmacy.phone.replace(/\s/g, "")}`} className="hover:text-primary">
            {pharmacy.phone}
          </a>
        </p>
        <p className="flex items-start gap-2">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" /> {pharmacy.hours}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t pt-3">
        {typeof availableCount === "number" ? (
          <span className="text-sm">
            <span className="font-semibold text-success">{availableCount}</span>{" "}
            <span className="text-muted-foreground">médicaments disponibles</span>
          </span>
        ) : (
          <span />
        )}
        <Link
          to={`/pharmacies/${pharmacy.id}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          Voir le stock →
        </Link>
      </div>
    </Card>
  );
}
