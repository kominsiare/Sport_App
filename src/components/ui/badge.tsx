import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.01em]",
  {
    variants: {
      variant: {
        default: "border-primary/20 bg-primary/8 text-primary",
        accent: "border-primary/25 bg-primary/10 text-primary",
        neutral: "border-border bg-muted text-muted-foreground",
        success: "border-emerald-500/20 bg-emerald-50 text-emerald-700",
        warning: "border-amber-500/25 bg-amber-50 text-amber-700",
        danger: "border-red-500/20 bg-red-50 text-red-700",
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
