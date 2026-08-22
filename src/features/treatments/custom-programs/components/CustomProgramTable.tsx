import { Check, Copy, Eye, Pencil, SquarePen } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { showFloatingToast } from "@/components/ui/floating-toast";
import { SlugEditorModal } from "@/features/treatments/common/components";
import type { CustomProgram, CustomProgramStatus, Program } from "@/features/treatments/types";
import { isCustomProgramMulti } from "@/features/treatments/custom-programs/hooks/useCustomProgramsPage";
import { getCustomProgramEffectiveSlug } from "@/features/treatments/custom-programs/utils/customProgramSlug";
import { resolveCustomProgramNames } from "@/features/treatments/custom-programs/utils/customProgramDisplay";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CustomProgramTableProps {
  customPrograms: CustomProgram[];
  onOpenBuilder?: (program: CustomProgram) => void;
  onPreview?: (program: CustomProgram) => void;
  onCopyStartUrl?: (program: CustomProgram) => Promise<void> | void;
  onSaveSlug?: (program: CustomProgram, slugOverride: string) => Promise<void> | void;
  programs?: Program[];
}

const statusClassName: Record<CustomProgramStatus, string> = {
  published: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200",
  draft: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200",
  archived: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const formatStatusLabel = (status: CustomProgramStatus) =>
  status.charAt(0).toUpperCase() + status.slice(1);

const getQuestionCount = (program: CustomProgram) =>
  program.runtimeSummary?.effectiveQuestionCount
  ?? program.questionCount
  ?? program.builderQuestions?.length
  ?? 0;

const formatLastUpdated = (dateStr: string) => {
  if (!dateStr) return "-";

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDiff = Math.round((startOfToday - startOfDate) / 86_400_000);

  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
};

export function CustomProgramTable({
  customPrograms,
  onOpenBuilder,
  onPreview,
  onCopyStartUrl,
  onSaveSlug,
  programs = [],
}: CustomProgramTableProps) {
  const [copiedProgramId, setCopiedProgramId] = useState<string | null>(null);
  const [editingProgram, setEditingProgram] = useState<CustomProgram | null>(null);

  const handleCopy = async (program: CustomProgram) => {
    try {
      await onCopyStartUrl?.(program);
      setCopiedProgramId(program.id);
      showFloatingToast({ title: "Intake URL Copied" });
      window.setTimeout(() => setCopiedProgramId((current) => (current === program.id ? null : current)), 1400);
    } catch {
      // Keep copy failures quiet; the success toast should only show after a confirmed write.
    }
  };

  const handleOpenSlugEditor = (program: CustomProgram) => {
    setEditingProgram(program);
  };

  const handleCloseSlugEditor = () => {
    setEditingProgram(null);
  };

  const handleSaveSlug = async (slug: string) => {
    if (!editingProgram) return;
    await onSaveSlug?.(editingProgram, slug);
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#171b27] dark:shadow-none">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-[#121620]">
            <TableRow>
              <TableHead className="w-[280px] text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Name
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Scope
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Slug
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Routes Into
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Questions
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Last Updated
              </TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customPrograms.map((program) => {
              const isMulti = isCustomProgramMulti(program);
              const copied = copiedProgramId === program.id;
              const effectiveSlug = getCustomProgramEffectiveSlug(program);
              const routedTreatmentNames = resolveCustomProgramNames(program, programs);

              return (
                <TableRow key={program.id} className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => onOpenBuilder?.(program)}
                        className="max-w-[260px] truncate text-left font-semibold text-blue-700 transition-colors hover:text-blue-900 hover:underline focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:text-slate-100 dark:hover:text-blue-300 dark:focus-visible:ring-offset-[#171b27]"
                        aria-label={`Open builder for ${program.name}`}
                      >
                        {program.name}
                      </button>
                      <span className="mt-1 max-w-[260px] truncate text-xs text-slate-400 dark:text-slate-500">
                        {program.description}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300"
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", isMulti ? "bg-[#be185d]" : "bg-[#15803d]")} />
                      {isMulti ? "Multi-treatment" : "Single-treatment"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        {effectiveSlug}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenSlugEditor(program)}
                        className="inline-flex text-slate-400 transition-colors hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-300"
                        aria-label={`Edit ${program.name} slug`}
                      >
                        <SquarePen className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {routedTreatmentNames.length > 0 ? routedTreatmentNames.join(", ") : "No routed treatments configured"}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {getQuestionCount(program)}
                  </TableCell>
                  <TableCell>
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", statusClassName[program.status])}>
                      {program.status === "published" && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                      {formatStatusLabel(program.status)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                    {formatLastUpdated(program.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => onPreview?.(program)}
                        className="inline-flex text-slate-400 transition-colors hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-300"
                        aria-label={`Preview ${program.name}`}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenBuilder?.(program)}
                        className="inline-flex text-slate-400 transition-colors hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-300"
                        aria-label={`Open builder for ${program.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(program)}
                        className="inline-flex text-slate-400 transition-colors hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-300"
                        aria-label={`Copy ${program.name} start URL`}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <SlugEditorModal
        open={Boolean(editingProgram)}
        onOpenChange={(open) => {
          if (!open) handleCloseSlugEditor();
        }}
        title="Edit Slug"
        description={
          <>
            Set a unique URL slug for this questionnaire. When set, it overrides the visit type for routing.
            Use lowercase letters, numbers, and hyphens. Leave empty to use the visit type only.
          </>
        }
        previewUrlPrefix="welliemd.com/start/"
        currentSlug={editingProgram ? editingProgram.slugOverride ?? getCustomProgramEffectiveSlug(editingProgram) : ""}
        onSave={handleSaveSlug}
      />
    </>
  );
}
