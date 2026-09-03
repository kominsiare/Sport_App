"use client";

import { cn } from "@/lib/utils";

type SlotCellProps = {
  time: string;
  state?: "available" | "selected" | "held" | "booked";
  onClick?: () => void;
};

const stateStyles = {
  available:
    "border-border bg-card text-foreground hover:border-primary/45 hover:bg-primary/5",
  selected: "blue-glow border-primary bg-primary text-white",
  held: "border-amber-400/40 bg-amber-50 text-amber-700",
  booked:
    "cursor-not-allowed border-border bg-muted/70 text-muted-foreground line-through",
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
        "focus-ring min-h-11 rounded-2xl border px-3 py-2 text-xs font-semibold transition hover:-translate-y-0.5",
        stateStyles[state],
        readOnly && "cursor-default disabled:opacity-100",
      )}
    >
      {time}
    </button>
  );
}
