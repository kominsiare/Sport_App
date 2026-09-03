"use client";

import type { IconType } from "react-icons";
import {
  GiCricketBat,
  GiPingPongBat,
  GiShuttlecock,
  GiSoccerBall,
  GiTennisBall,
} from "react-icons/gi";

import type { SportName } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const sportIcons: Record<SportName, IconType> = {
  Cricket: GiCricketBat,
  Football: GiSoccerBall,
  Badminton: GiShuttlecock,
  Pickleball: GiPingPongBat,
  Tennis: GiTennisBall,
};

type SportChipProps = {
  sport: SportName;
  selected?: boolean;
  onSelect?: (sport: SportName) => void;
  compact?: boolean;
};

export function SportChip({
  sport,
  selected = false,
  onSelect,
  compact = false,
}: SportChipProps) {
  const Icon = sportIcons[sport];

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect?.(sport)}
      className={cn(
        "focus-ring group flex shrink-0 flex-col items-center gap-2 rounded-2xl px-1 py-1 text-center transition hover:-translate-y-0.5",
        compact && "flex-row gap-2 rounded-full border border-border bg-card px-3 py-2 shadow-[0_6px_18px_rgba(16,24,20,0.04)]",
        compact && selected && "border-primary/25 bg-primary/10",
      )}
    >
      <span
        className={cn(
          "grid size-11 place-items-center rounded-2xl border border-border bg-card text-foreground shadow-[0_8px_20px_rgba(16,24,20,0.04)] transition duration-200 group-hover:border-primary/40 group-hover:text-primary md:size-14",
          selected &&
            "blue-glow border-primary bg-primary text-white group-hover:border-primary group-hover:text-white",
          compact && "size-8 border-0 bg-transparent",
        )}
      >
        <Icon className={cn("size-6 md:size-7", compact && "size-5")} />
      </span>
      <span
        className={cn(
          "border-b-2 border-transparent pb-1 text-[11px] font-medium text-muted-foreground transition md:text-xs",
          selected && "border-primary text-foreground",
          compact && "border-0 pb-0 text-xs",
        )}
      >
        {sport}
      </span>
    </button>
  );
}
