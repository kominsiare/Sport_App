"use client";

import { useState } from "react";
import { HiChevronDown, HiMapPin } from "react-icons/hi2";

import { cities } from "@/lib/mock-data";

export function CitySelector() {
  const [city, setCity] = useState<(typeof cities)[number]>("Chandigarh");

  return (
    <label className="relative block">
      <span className="sr-only">Choose city</span>
      <HiMapPin className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-accent" />
      <select
        value={city}
        onChange={(event) => setCity(event.target.value as (typeof cities)[number])}
        className="focus-ring h-12 w-full appearance-none rounded-xl border border-input bg-[#071020] px-10 text-sm font-medium text-foreground transition hover:border-[#344666] focus:border-primary"
      >
        {cities.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
    </label>
  );
}
