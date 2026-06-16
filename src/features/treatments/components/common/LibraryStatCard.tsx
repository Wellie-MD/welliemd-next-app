import type { ReactNode } from "react";

interface LibraryStatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  tone?: "blue" | "teal" | "purple" | "indigo";
}

const toneClasses = {
  blue: "bg-blue-50 text-blue-700",
  teal: "bg-teal-50 text-teal-700",
  purple: "bg-purple-50 text-purple-700",
  indigo: "bg-indigo-50 text-indigo-700",
};

export function LibraryStatCard({ label, value, icon, tone = "blue" }: LibraryStatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
          {icon}
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
          <div className="text-xl font-semibold text-slate-950">{value}</div>
        </div>
      </div>
    </div>
  );
}
