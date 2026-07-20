import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "focus-ring inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-5 text-sm font-semibold transition duration-200 active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "blue-glow bg-primary text-primary-foreground hover:bg-[#00945f]",
        accent:
          "cta-pulse bg-primary text-primary-foreground shadow-[0_18px_42px_rgba(0,168,107,0.22)] hover:bg-[#00945f]",
        outline:
          "border border-border bg-card text-foreground shadow-[0_8px_24px_rgba(16,24,20,0.04)] hover:border-primary/40 hover:bg-secondary hover:text-primary",
        ghost: "text-foreground hover:bg-secondary hover:text-primary",
        subtle:
          "border border-border bg-secondary text-secondary-foreground hover:bg-[#e5f4eb]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_14px_34px_rgba(220,38,38,0.18)] hover:bg-red-700",
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
