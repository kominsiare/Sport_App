"use client";

import { useState } from "react";

import { CitySelector } from "@/components/marketplace/city-selector";
import { SportChip } from "@/components/marketplace/sport-chip";
import { VenueCard } from "@/components/marketplace/venue-card";
import { mockVenue, sports, type SportName } from "@/lib/mock-data";

export function VenueBrowserPreview() {
  const [sport, setSport] = useState<SportName>("Cricket");

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-[220px_1fr] md:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            City
          </p>
          <CitySelector />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Sport
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sports.map((item) => (
              <SportChip
                key={item}
                sport={item}
                selected={sport === item}
                onSelect={setSport}
                compact
              />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6 grid max-w-sm gap-4">
        <VenueCard
          {...mockVenue}
          name={`${sport} layout preview`}
          href="/app/player/venues/demo-venue"
          mock
        />
      </div>
    </div>
  );
}
