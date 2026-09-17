import type { ReactNode } from "react";
import { CheckCircle2, CircleHelp, Grid2X2, LockKeyhole, ShieldCheck, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CustomProgram } from "@/features/treatments/types";

export function SectionHeading({ icon, tone, children }: { icon: ReactNode; tone: "teal" | "amber"; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs font-bold uppercase tracking-wide text-slate-900">
      <span className={cn("grid h-6 w-6 place-items-center rounded-md", tone === "teal" ? "bg-teal-50 text-teal-700" : "bg-amber-50 text-amber-800")}>{icon}</span>
      {children}
    </div>
  );
}

export function FlowSidebarItem({ item, index, active }: { item: CustomProgram["flowItems"][number]; index: number; active: boolean }) {
  const icon = item.kind === "authentication" ? <LockKeyhole className="h-3.5 w-3.5" />
    : item.kind === "routing_question" ? <CircleHelp className="h-3.5 w-3.5" />
      : item.kind === "section" || item.kind === "section_field" ? <Grid2X2 className="h-3.5 w-3.5" />
        : item.kind === "program" ? <ShieldCheck className="h-3.5 w-3.5" />
          : item.kind === "checkout" ? <ShoppingCart className="h-3.5 w-3.5" />
            : <CheckCircle2 className="h-3.5 w-3.5" />;
  return (
    <div className={cn("grid grid-cols-[22px_24px_minmax(0,1fr)] items-start gap-1.5 rounded-md px-2 py-2", active ? "bg-slate-200" : "text-slate-500")}>
      <span className="pt-0.5 text-right text-[10px] text-slate-400">{index}</span>
      <span className={cn("grid h-6 w-6 place-items-center rounded-md", item.kind === "program" ? "bg-teal-50 text-teal-700" : item.kind === "routing_question" ? "bg-indigo-50 text-indigo-700" : "bg-white text-slate-500")}>{icon}</span>
      <span className="min-w-0">
        <span className={cn("block line-clamp-2 text-[11px] leading-4", active && "font-semibold text-slate-900")}>{item.title}</span>
        <span className="block text-[9px] uppercase tracking-wide text-slate-400">{item.kind.replaceAll("_", " ")}</span>
      </span>
    </div>
  );
}
