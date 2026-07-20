import { HiClock } from "react-icons/hi2";

import { Badge } from "@/components/ui/badge";

type CourtRowProps = {
  name: string;
  type: string;
  duration: string;
  price: string;
};

export function CourtRow({ name, type, duration, price }: CourtRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-4 last:border-0">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{name}</p>
          <Badge variant="neutral">{type}</Badge>
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <HiClock className="size-4" />
          {duration}
        </p>
      </div>
      <p className="text-sm font-semibold text-primary">{price}</p>
    </div>
  );
}
