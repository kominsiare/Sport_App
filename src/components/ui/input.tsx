import * as React from "react";

import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "focus-ring h-12 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur placeholder:text-muted-foreground transition hover:border-accent/35 focus:border-accent",
        className,
      )}
      {...props}
    />
  );
}
