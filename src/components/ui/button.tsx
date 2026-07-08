import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "focus-ring inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-5 text-sm font-semibold transition duration-200 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "blue-glow bg-[linear-gradient(135deg,#2b63ff,#35d8ff)] text-primary-foreground hover:brightness-110 active:translate-y-px",
        accent:
          "bg-[linear-gradient(135deg,#d8ff35,#78ffbd)] text-accent-foreground shadow-[0_16px_38px_rgba(216,255,53,0.18)] hover:brightness-110 active:translate-y-px",
        outline:
          "border border-white/[0.12] bg-white/[0.035] text-foreground backdrop-blur hover:border-accent/55 hover:bg-accent/10 hover:text-accent",
        ghost: "text-foreground hover:bg-white/[0.065]",
        subtle:
          "border border-white/10 bg-white/[0.055] text-secondary-foreground hover:bg-white/[0.09]",
        destructive:
          "bg-[linear-gradient(135deg,#ff4d5d,#ff8a3d)] text-destructive-foreground hover:brightness-110",
      },
      size: {
        default: "h-12",
        sm: "h-10 min-h-10 rounded-xl px-4 text-xs",
        lg: "h-14 rounded-[1.35rem] px-6 text-base",
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
