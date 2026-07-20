import * as React from "react";

import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "focus-ring h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm text-foreground shadow-[0_1px_2px_rgba(16,24,20,0.03)] placeholder:text-muted-foreground transition hover:border-primary/35 focus:border-primary",
        className,
      )}
      {...props}
    />
  );
}
