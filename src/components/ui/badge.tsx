import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
  {
    variants: {
      variant: {
        default: "border-primary/35 bg-primary/15 text-[#b8c7ff]",
        accent: "border-accent/40 bg-accent/12 text-accent",
        neutral: "border-white/10 bg-white/[0.055] text-muted-foreground",
        success: "border-emerald-400/35 bg-emerald-400/12 text-emerald-300",
        warning: "border-amber-400/35 bg-amber-400/12 text-amber-300",
        danger: "border-red-400/35 bg-red-400/12 text-red-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
