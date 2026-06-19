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
        "focus-ring group flex shrink-0 flex-col items-center gap-2 rounded-2xl px-1 py-1 text-center transition",
        compact && "flex-row gap-2 rounded-full border px-3 py-2",
      )}
    >
      <span
        className={cn(
          "grid size-14 place-items-center rounded-full border border-border bg-[#071020] text-foreground transition duration-200 group-hover:border-primary/70",
          selected &&
            "blue-glow border-[#6383ff] bg-primary text-white group-hover:border-[#7f99ff]",
          compact && "size-8 border-0 bg-transparent",
        )}
      >
        <Icon className={cn("size-7", compact && "size-5")} />
      </span>
      <span
        className={cn(
          "border-b-2 border-transparent pb-1 text-xs font-medium text-muted-foreground transition",
          selected && "border-accent text-foreground",
          compact && "border-0 pb-0 text-xs",
        )}
      >
        {sport}
      </span>
    </button>
  );
}
