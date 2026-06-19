import type { ReactNode } from "react";
import { HiExclamationTriangle } from "react-icons/hi2";

import { Card } from "@/components/ui/card";

export function ErrorState({
  title = "Something went offside",
  description,
  action,
}: {
  title?: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="border-red-400/25 bg-red-400/5 p-5">
      <div className="flex gap-3">
        <HiExclamationTriangle className="mt-0.5 size-5 shrink-0 text-red-300" />
        <div>
          <h2 className="text-sm font-semibold text-red-100">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-red-100/65">{description}</p>
          {action ? <div className="mt-4">{action}</div> : null}
        </div>
      </div>
    </Card>
  );
}
