import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HiArrowLeft,
  HiCheckBadge,
  HiClock,
  HiMapPin,
} from "react-icons/hi2";

import { PageShell } from "@/components/layout/page-shell";
import { SlotCell } from "@/components/marketplace/slot-cell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getVenueDetail } from "@/lib/venues/server";
import { cn } from "@/lib/utils";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const dateTime = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

function slotState(status: string) {
  if (status === "booked") return "booked" as const;
  if (status === "held" || status === "blocked") return "held" as const;
  return "available" as const;
}

export default async function PlayerVenueDetailPage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  const venue = await getVenueDetail(venueId);

  if (!venue) notFound();

  return (
    <PageShell
      eyebrow="Approved Tricity venue"
      title={venue.name}
      description={venue.description}
      actions={
        <Link
          href="/app/player/venues"
          className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
        >
          <HiArrowLeft className="size-4" />
          All venues
        </Link>
      }
      className="max-w-7xl"
    >
      <div className="relative overflow-hidden rounded-3xl border border-border">
        <div className="relative aspect-[16/8] min-h-72">
          <Image
            src={venue.image_url}
            alt={venue.image_alt}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1200px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 md:p-8">
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">
                <HiCheckBadge className="size-4" />
                Admin approved
              </Badge>
              {venue.is_featured ? <Badge variant="accent">Recommended</Badge> : null}
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm font-medium text-white">
              <HiMapPin className="size-5 text-accent" />
              {venue.area}, {venue.city}
            </p>
            <p className="mt-1 text-xs text-white/70">{venue.address}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-5">
          {venue.courts.map((court) => (
            <Card key={court.id}>
              <CardHeader className="border-b border-border">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{court.name}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {court.court_type}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-accent">
                    From {money.format(court.base_price)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-3">
                  {court.sports.map((sport) => (
                    <Badge key={sport.id} variant="neutral">
                      {sport.name} · {sport.durationMinutes} min
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="flex items-center gap-2">
                  <HiClock className="size-5 text-accent" />
                  <h3 className="text-sm font-semibold">Next read-only slots</h3>
                </div>
                {court.slots.length > 0 ? (
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {court.slots.slice(0, 6).map((slot) => (
                      <SlotCell
                        key={slot.id}
                        time={`${slot.sportName} · ${dateTime.format(
                          new Date(slot.start_time),
                        )}`}
                        state={slotState(slot.status)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    No upcoming display slots are available for this court.
                  </p>
                )}
                <p className="mt-4 text-xs leading-5 text-muted-foreground">
                  Slots are informational in Module 3. Booking and live availability
                  rechecks arrive in the approved booking module.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid content-start gap-5">
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Starting price
            </p>
            <p className="mt-2 text-3xl font-bold text-accent">
              {money.format(venue.from_price)}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Price is taken from the lowest active court. Final sport and slot pricing is
              confirmed later in the booking flow.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold">Sports</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {venue.sports.map((sport) => (
                <Badge key={sport} variant="default">
                  {sport}
                </Badge>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold">Amenities</h2>
            <div className="mt-3 grid gap-2">
              {venue.amenities.map((amenity) => (
                <p key={amenity} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <HiCheckBadge className="size-4 text-accent" />
                  {amenity}
                </p>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
