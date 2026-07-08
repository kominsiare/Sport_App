import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: PageShellProps) {
  return (
    <main
      className={cn(
        "mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10",
        className,
      )}
    >
      <header className="stadium-card arena-field flex flex-col gap-5 rounded-[2rem] p-5 md:flex-row md:items-end md:justify-between md:p-7">
        <div className="max-w-2xl">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-display mt-2 text-3xl font-semibold uppercase leading-none tracking-[-0.035em] md:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </header>
      <div className="py-6 md:py-8">{children}</div>
    </main>
  );
}
