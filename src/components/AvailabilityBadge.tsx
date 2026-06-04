import { AvailabilityStatus } from "@/types";
import { STATUS_BADGE, STATUS_DOT, STATUS_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  status: AvailabilityStatus;
  className?: string;
}

export function AvailabilityBadge({ status, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_BADGE[status],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
      {STATUS_LABELS[status]}
    </span>
  );
}
