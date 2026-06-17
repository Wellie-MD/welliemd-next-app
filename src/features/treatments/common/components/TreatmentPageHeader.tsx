import type { ReactNode } from "react";

interface TreatmentPageHeaderProps {
  title: string;
  subtitle: ReactNode;
  actions?: ReactNode;
}

export function TreatmentPageHeader({ title, subtitle, actions }: TreatmentPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <div className="mt-1 max-w-4xl text-sm leading-6 text-slate-500">{subtitle}</div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
