import { CreditCard, GripVertical, Lock, User } from "lucide-react";
import type { CustomProgramBuilderLockedItem } from "@/features/treatments/types";
import { cn } from "@/lib/utils";

interface CustomBuilderLockedComponentProps {
  item: CustomProgramBuilderLockedItem;
  itemNumber: number;
}

export function CustomBuilderLockedComponent({ item, itemNumber }: CustomBuilderLockedComponentProps) {
  const Icon = item.kind === "authentication" ? User : CreditCard;
  const iconClass = item.kind === "authentication" ? "bg-violet-50 text-violet-700" : "bg-slate-950 text-white";

  return (
    <div className="flex min-h-[64px] items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
      <GripVertical className="h-4 w-4 shrink-0 text-slate-200 dark:text-slate-700" />
      <div className="w-5 shrink-0 text-right text-[11px] font-medium text-slate-400 dark:text-slate-500">{itemNumber}</div>
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", iconClass)}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-[3px] border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {item.label}
          </span>
          <span className="text-sm font-semibold text-slate-950 dark:text-slate-100">{item.title}</span>
          <span className="inline-flex items-center gap-1 rounded-[3px] bg-slate-950 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white dark:bg-slate-100 dark:text-slate-950">
            <Lock className="h-3 w-3" />
            Locked
          </span>
        </div>
        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{item.subtitle}</p>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-3 text-slate-400 dark:text-slate-500">
        {item.required && <span className="text-[11px] italic text-slate-400 dark:text-slate-500">required</span>}
        <Lock className="h-4 w-4" />
      </div>
    </div>
  );
}
