"use client";

import { useMemo, useState } from "react";
import { HiAdjustmentsHorizontal, HiArrowPath } from "react-icons/hi2";

import { CitySelector } from "@/components/marketplace/city-selector";
import { SportChip } from "@/components/marketplace/sport-chip";
import { VenueCard } from "@/components/marketplace/venue-card";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import type { SportName } from "@/lib/mock-data";
import type { Sport, TricityCity, VenueCatalogRow } from "@/types/database";

type CityFilter = TricityCity | "All";
type PriceFilter = "all" | "under-1000" | "1000-1800" | "1800-plus";
type SortOption = "recommended" | "price" | "name";

const priceOptions: Array<{ value: PriceFilter; label: string }> = [
  { value: "all", label: "Any price" },
  { value: "under-1000", label: "Under ₹1,000" },
  { value: "1000-1800", label: "₹1,000–₹1,800" },
  { value: "1800-plus", label: "₹1,800+" },
];

export function VenueBrowser({
  venues,
  sports,
}: {
  venues: VenueCatalogRow[];
  sports: Sport[];
}) {
  const [city, setCity] = useState<CityFilter>("All");
  const [sportSlug, setSportSlug] = useState("all");
  const [area, setArea] = useState("All");
  const [price, setPrice] = useState<PriceFilter>("all");
  const [sort, setSort] = useState<SortOption>("recommended");

  const areas = useMemo(
    () =>
      Array.from(
        new Set(
          venues
            .filter((venue) => city === "All" || venue.city === city)
            .map((venue) => venue.area),
        ),
      ).sort(),
    [city, venues],
  );

  const filteredVenues = useMemo(() => {
    const result = venues.filter((venue) => {
      if (city !== "All" && venue.city !== city) return false;
      if (area !== "All" && venue.area !== area) return false;
      if (sportSlug !== "all" && !venue.sport_slugs.includes(sportSlug)) {
        return false;
      }
      if (price === "under-1000" && venue.from_price >= 1000) return false;
      if (
        price === "1000-1800" &&
        (venue.from_price < 1000 || venue.from_price > 1800)
      ) {
        return false;
      }
      if (price === "1800-plus" && venue.from_price < 1800) return false;
      return true;
    });

    return result.sort((left, right) => {
      if (sort === "price") return left.from_price - right.from_price;
      if (sort === "name") return left.name.localeCompare(right.name);
      if (left.is_featured !== right.is_featured) {
        return left.is_featured ? -1 : 1;
      }
      return left.sort_priority - right.sort_priority || left.name.localeCompare(right.name);
    });
  }, [area, city, price, sort, sportSlug, venues]);

  function resetFilters() {
    setCity("All");
    setSportSlug("all");
    setArea("All");
    setPrice("all");
    setSort("recommended");
  }

  return (
    <div>
      <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <HiAdjustmentsHorizontal className="size-5 text-accent" />
          Find your court
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr] lg:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              City
            </p>
            <CitySelector
              value={city}
              includeAll
              onChange={(nextCity) => {
                setCity(nextCity);
                setArea("All");
              }}
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Sport
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                aria-pressed={sportSlug === "all"}
                onClick={() => setSportSlug("all")}
                className={`focus-ring min-h-10 shrink-0 rounded-full border px-4 text-xs font-semibold transition ${
                  sportSlug === "all"
                    ? "border-accent/45 bg-accent/10 text-accent"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                All sports
              </button>
              {sports.map((sport) => (
                <SportChip
                  key={sport.id}
                  sport={sport.name as SportName}
                  selected={sportSlug === sport.slug}
                  onSelect={() => setSportSlug(sport.slug)}
                  compact
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Area
            <select
              value={area}
              onChange={(event) => setArea(event.target.value)}
              className="focus-ring h-11 rounded-xl border border-input bg-[#071020] px-3 text-sm font-medium normal-case tracking-normal text-foreground"
            >
              <option value="All">All areas</option>
              {areas.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Price
            <select
              value={price}
              onChange={(event) => setPrice(event.target.value as PriceFilter)}
              className="focus-ring h-11 rounded-xl border border-input bg-[#071020] px-3 text-sm font-medium normal-case tracking-normal text-foreground"
            >
              {priceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Sort
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className="focus-ring h-11 rounded-xl border border-input bg-[#071020] px-3 text-sm font-medium normal-case tracking-normal text-foreground"
            >
              <option value="recommended">Recommended</option>
              <option value="price">Lowest price</option>
              <option value="name">Name A–Z</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filteredVenues.length}</span>{" "}
          approved {filteredVenues.length === 1 ? "venue" : "venues"}
        </p>
        <Button variant="ghost" size="sm" onClick={resetFilters}>
          <HiArrowPath className="size-4" />
          Reset filters
        </Button>
      </div>

      {filteredVenues.length > 0 ? (
        <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredVenues.map((venue, index) => (
            <VenueCard
              key={venue.id}
              name={venue.name}
              area={`${venue.area} · ${venue.city}`}
              price={venue.from_price}
              sports={venue.sports}
              image={venue.image_url}
              imageAlt={venue.image_alt}
              description={venue.description}
              href={`/app/player/venues/${venue.slug}`}
              priority={index === 0}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState
            title="No approved venues match"
            description="Try another sport, city, area, or price range. Only active venues approved for Player discovery are shown."
            action={
              <Button variant="outline" onClick={resetFilters}>
                Reset filters
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}
