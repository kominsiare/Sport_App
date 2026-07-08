"use client";

import { cn } from "@/lib/utils";

type SlotCellProps = {
  time: string;
  state?: "available" | "selected" | "held" | "booked";
  onClick?: () => void;
};

const stateStyles = {
  available:
    "border-white/10 bg-white/[0.045] text-foreground hover:border-accent/45 hover:bg-accent/10",
  selected: "blue-glow border-primary bg-primary text-white",
  held: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  booked:
    "cursor-not-allowed border-white/10 bg-muted/70 text-muted-foreground line-through",
};

export function SlotCell({
  time,
  state = "available",
  onClick,
}: SlotCellProps) {
  const readOnly = !onClick;

  return (
    <button
      type="button"
      disabled={state === "booked" || readOnly}
      onClick={onClick}
      className={cn(
        "focus-ring min-h-11 rounded-2xl border px-3 py-2 text-xs font-semibold transition",
        stateStyles[state],
        readOnly && "cursor-default disabled:opacity-100",
      )}
    >
      {time}
    </button>
  );
}
