import Image from "next/image";
import Link from "next/link";
import { HiArrowRight, HiMapPin } from "react-icons/hi2";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type VenueCardProps = {
  name: string;
  area: string;
  price: string | number;
  sports: string[];
  image: string;
  imageAlt?: string;
  description?: string;
  href?: string;
  mock?: boolean;
  priority?: boolean;
};

export function VenueCard({
  name,
  area,
  price,
  sports,
  image,
  imageAlt = "",
  description,
  href = "#",
  mock = false,
  priority = false,
}: VenueCardProps) {
  const displayPrice =
    typeof price === "number"
      ? `From ${new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(price)}`
      : price;

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-primary/55 hover:shadow-[0_18px_48px_rgba(23,82,255,0.16)]">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority={priority}
          className="object-cover transition duration-500 group-hover:scale-[1.025]"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 360px"
        />
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
          <p className="whitespace-nowrap text-sm font-semibold text-accent">
            {displayPrice}
          </p>
        </div>
        {description ? (
          <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {sports.map((sport) => (
            <Badge key={sport} variant="neutral">
              {sport}
            </Badge>
          ))}
        </div>
        <Link
          href={href}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 w-full")}
        >
          View venue
          <HiArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}
