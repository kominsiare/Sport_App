import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "focus-ring inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-5 text-sm font-semibold transition duration-200 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-[#2d63ff] active:translate-y-px",
        accent:
          "bg-accent text-accent-foreground hover:bg-[#e4ff68] active:translate-y-px",
        outline:
          "border border-border bg-transparent text-foreground hover:border-accent/60 hover:bg-secondary",
        ghost: "text-foreground hover:bg-secondary",
        subtle: "bg-secondary text-secondary-foreground hover:bg-[#17233e]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-red-500/90",
      },
      size: {
        default: "h-12",
        sm: "h-10 min-h-10 rounded-lg px-4 text-xs",
        lg: "h-14 rounded-2xl px-6 text-base",
        icon: "size-11 min-h-11 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
