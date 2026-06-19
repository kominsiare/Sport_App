import * as React from "react";

import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "focus-ring h-12 w-full rounded-xl border border-input bg-[#071020] px-4 text-sm text-foreground placeholder:text-muted-foreground transition hover:border-[#344666] focus:border-primary",
        className,
      )}
      {...props}
    />
  );
}
