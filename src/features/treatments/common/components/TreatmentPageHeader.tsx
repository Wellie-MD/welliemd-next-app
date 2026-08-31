import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TreatmentPageHeaderProps {
  title: string;
  subtitle: ReactNode;
  actions?: ReactNode;
  actionsClassName?: string;
  stackActionsAt?: "lg" | "xl" | "2xl";
}

export function TreatmentPageHeader({
  title,
  subtitle,
  actions,
  actionsClassName,
  stackActionsAt = "lg",
}: TreatmentPageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4",
        stackActionsAt === "2xl" ? "2xl:flex-row 2xl:items-start 2xl:justify-between" : null,
        stackActionsAt === "xl" ? "xl:flex-row xl:items-start xl:justify-between" : null,
        stackActionsAt === "lg" ? "lg:flex-row lg:items-start lg:justify-between" : null,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <div className="mt-1 max-w-4xl text-sm leading-6 text-slate-500">{subtitle}</div>
      </div>
      {actions ? <div className={cn("flex shrink-0 flex-wrap gap-2", actionsClassName)}>{actions}</div> : null}
    </div>
  );
}
