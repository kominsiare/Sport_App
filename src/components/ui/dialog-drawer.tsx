"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { HiXMark } from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DialogDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function DialogDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: DialogDrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onClose={() => onOpenChange(false)}
      className="m-0 h-auto max-h-[88dvh] w-full max-w-none self-end rounded-t-3xl border border-border bg-card p-0 text-foreground backdrop:bg-black/75 md:m-auto md:w-[min(520px,calc(100%-32px))] md:self-auto md:rounded-2xl"
    >
      <div className={cn("p-5 md:p-6", className)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
          >
            <HiXMark className="size-5" />
          </Button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </dialog>
  );
}
