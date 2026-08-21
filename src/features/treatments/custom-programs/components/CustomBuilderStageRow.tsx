import { CheckCircle2, Edit3, Eye, FileCheck, FileText, GripVertical, HelpCircle, Layout, Lock, Trash2 } from "lucide-react";
import type { CustomProgramBuilderStageItem } from "@/features/treatments/types";
import { cn } from "@/lib/utils";

const rowMeta: Record<
  CustomProgramBuilderStageItem["kind"],
  {
    label: string;
    icon: typeof HelpCircle;
    iconClass: string;
    badgeClass: string;
  }
> = {
  question: {
    label: "QUESTION",
    icon: HelpCircle,
    iconClass: "bg-orange-50 text-orange-600",
    badgeClass: "border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-200",
  },
  section: {
    label: "SECTION",
    icon: Layout,
    iconClass: "bg-violet-50 text-violet-600",
    badgeClass: "border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-200",
  },
  program: {
    label: "PROGRAM",
    icon: CheckCircle2,
    iconClass: "bg-teal-50 text-teal-600",
    badgeClass: "border-teal-200 bg-teal-50 text-teal-600 dark:border-teal-400/30 dark:bg-teal-400/10 dark:text-teal-200",
  },
  consent: {
    label: "CONSENT",
    icon: FileCheck,
    iconClass: "bg-purple-50 text-purple-600",
    badgeClass: "border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-400/30 dark:bg-purple-400/10 dark:text-purple-200",
  },
};

interface CustomBuilderStageRowProps {
  item: CustomProgramBuilderStageItem;
  itemNumber: number;
  previewQuestionNumber?: number;
  onEditClientQuestion?: (question: CustomProgramBuilderStageItem) => void;
  onDeleteClientQuestion?: (questionId: string) => void;
  onPreviewQuestion?: (question: CustomProgramBuilderStageItem, questionNumber: number) => void;
}

export function CustomBuilderStageRow({
  item,
  itemNumber,
  previewQuestionNumber,
  onEditClientQuestion,
  onDeleteClientQuestion,
  onPreviewQuestion,
}: CustomBuilderStageRowProps) {
  const meta = rowMeta[item.kind] ?? rowMeta.question;
  const Icon = meta.icon || FileText;
  const isEditableClientQuestion = item.kind === "question" && item.source === "client" && !item.locked;
  const canPreviewQuestion = item.kind === "question" && !isEditableClientQuestion;

  return (
    <div className="flex min-h-[58px] items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all duration-150 hover:border-[#4f00ff] hover:shadow-[0_0_0_1px_rgba(79,0,255,0.12),0_8px_24px_-18px_rgba(79,0,255,0.65)] dark:border-slate-700 dark:bg-[#171b27] dark:shadow-none dark:hover:border-blue-600 dark:hover:bg-[#141827]">
      <GripVertical className="h-4 w-4 shrink-0 text-slate-200 dark:text-slate-700" />
      <div className="w-5 shrink-0 text-right text-[11px] font-medium text-slate-400 dark:text-slate-500">{itemNumber}</div>
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", meta.iconClass)}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-[3px] border px-1.5 py-0.5 text-[10px] font-bold", meta.badgeClass)}>
            {meta.label}
          </span>
          {isEditableClientQuestion && (
            <span className="rounded-[3px] border border-[#4f00ff] bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#4f00ff] dark:border-blue-600 dark:bg-blue-600/10 dark:text-blue-300">
              ADDED BY YOU
            </span>
          )}
          <span className="text-sm font-semibold text-slate-950 dark:text-slate-100">{item.title}</span>
        </div>
        {item.subtitle && <p className="mt-1 text-xs font-medium text-slate-400 dark:text-slate-500">{item.subtitle}</p>}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-3 text-slate-400 dark:text-slate-500">
        {isEditableClientQuestion ? (
          <button
            type="button"
            onClick={() => onEditClientQuestion?.(item)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-slate-400 transition-colors hover:border-[#4f00ff] hover:text-[#4f00ff] focus:outline-none focus-visible:outline-none focus-visible:ring-0 dark:text-slate-500 dark:hover:border-blue-600 dark:hover:text-blue-300"
            aria-label={`Edit ${item.title}`}
          >
            <Edit3 className="h-4 w-4" />
          </button>
        ) : canPreviewQuestion ? (
          <button
            type="button"
            onClick={() => onPreviewQuestion?.(item, previewQuestionNumber ?? itemNumber)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-slate-400 transition-colors hover:border-blue-600 hover:text-blue-600 focus:outline-none focus-visible:outline-none focus-visible:ring-0 dark:text-slate-500 dark:hover:border-blue-600 dark:hover:text-blue-300"
            aria-label={`Preview ${item.title}`}
          >
            <Eye className="h-4 w-4" />
          </button>
        ) : (
          !item.locked && <Edit3 className="h-4 w-4" />
        )}
        {isEditableClientQuestion && (
          <button
            type="button"
            onClick={() => onDeleteClientQuestion?.(item.id)}
            className="inline-flex text-slate-400 transition-colors hover:text-red-500 focus:outline-none focus-visible:outline-none focus-visible:ring-0 dark:text-slate-500 dark:hover:text-red-300"
            aria-label={`Delete ${item.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
        {item.locked && <Lock className="h-4 w-4" />}
      </div>
    </div>
  );
}
