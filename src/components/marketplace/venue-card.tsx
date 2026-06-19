import Image from "next/image";
import { HiArrowRight, HiMapPin } from "react-icons/hi2";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { SportName } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type VenueCardProps = {
  name: string;
  area: string;
  price: string;
  sports: SportName[];
  image: string;
  href?: string;
  mock?: boolean;
};

export function VenueCard({
  name,
  area,
  price,
  sports,
  image,
  href = "#",
  mock = false,
}: VenueCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image src={image} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 420px" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#040812] via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge variant="success">Verified</Badge>
          {mock ? <Badge variant="neutral">Mock data</Badge> : null}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold">{name}</h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <HiMapPin className="size-4 text-accent" />
              {area}
            </p>
          </div>
          <p className="whitespace-nowrap text-sm font-semibold text-accent">{price}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {sports.map((sport) => (
            <Badge key={sport} variant="neutral">
              {sport}
            </Badge>
          ))}
        </div>
        <a
          href={href}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 w-full")}
        >
          View venue
          <HiArrowRight className="size-4" />
        </a>
      </div>
    </article>
  );
}
