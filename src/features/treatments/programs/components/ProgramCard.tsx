import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Eye, HelpCircle,
  Pencil, Check, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { Program, ProgramStatus } from "@/features/treatments/types";
import { formatProgramStage } from "@/features/treatments/utils/labels";
import { cn } from "@/lib/utils";
import { CLIENT_TREATMENT_ROUTES } from "@/features/treatments/navigation/routes";

interface ProgramCardProps {
  program: Program;
  treatmentName?: string;
  screeningQuestionCount: number;
  onPreview: (program: Program) => void;
  onSaveSlug: (programId: string, newSlug: string) => void;
  onToggleStatus?: (program: Program, status: ProgramStatus) => void | Promise<void>;
}

export function ProgramCard({
  program,
  treatmentName,
  screeningQuestionCount,
  onPreview,
  onSaveSlug,
  onToggleStatus,
}: ProgramCardProps) {
  const isPublished = program.status === "published";
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [tempSlug, setTempSlug] = useState(program.slug);

  useEffect(() => {
    setTempSlug(program.slug);
  }, [program.slug]);

  const handleSaveSlug = () => {
    const formatted = tempSlug
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "")
      .trim();
    if (formatted) {
      onSaveSlug(program.id, formatted);
    }
    setIsEditingSlug(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col min-h-[300px] group dark:border-slate-700 dark:bg-[#171b27]">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
            {formatProgramStage(program.stage)}
          </span>
          {treatmentName && (
            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
              {treatmentName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase",
              isPublished
                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isPublished ? "bg-green-500" : "bg-slate-400"
              )}
            />
            {program.status}
          </span>
          <Switch
            checked={isPublished}
            disabled={program.status === "archived"}
            onCheckedChange={(checked) =>
              onToggleStatus?.(program, checked ? "published" : "draft")
            }
            className="disabled:opacity-100 data-[state=checked]:bg-[#5b4dff] dark:data-[state=checked]:bg-[#7b83ff] data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-slate-600"
          />
        </div>
      </div>

      <h3 className="text-sm font-bold text-slate-900 leading-tight mb-1 dark:text-slate-100">
        {program.name}
      </h3>
      <div className="mt-1 mb-2">
        {isEditingSlug ? (
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md p-1 shadow-sm h-7 dark:bg-[#0f1117] dark:border-slate-700">
            <span className="text-[10px] text-slate-400 px-1">welliemd.com/intake/</span>
            <input
              value={tempSlug}
              onChange={(e) => setTempSlug(e.target.value)}
              className="w-28 text-[11px] font-bold text-slate-800 focus:outline-none dark:bg-transparent dark:text-slate-200"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveSlug();
                if (e.key === "Escape") setIsEditingSlug(false);
              }}
            />
            <button
              onClick={handleSaveSlug}
              className="p-1 hover:bg-slate-50 text-green-600 rounded dark:hover:bg-slate-800"
              aria-label="Save slug"
              type="button"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setIsEditingSlug(false)}
              className="p-1 hover:bg-slate-50 text-slate-400 rounded dark:hover:bg-slate-800"
              aria-label="Cancel slug edit"
              type="button"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="truncate">
              <span className="text-slate-400">welliemd.com/intake/</span>
              <span className="text-slate-700 font-semibold dark:text-slate-200">{program.slug}</span>
            </span>
            <button
              onClick={() => setIsEditingSlug(true)}
              className="p-1 rounded hover:bg-slate-100 text-slate-400 dark:hover:bg-slate-800"
              aria-label="Edit slug"
              type="button"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      <div className="flex-1" />

      <div className="h-px bg-slate-100 my-3 dark:bg-slate-700" />

      <div className="mb-3">
        <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2">
          Content Summary
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <HelpCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {screeningQuestionCount}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            Screening
          </span>
        </div>
      </div>

      <div className="h-px bg-slate-100 mb-3 dark:bg-slate-700" />

      <div className="flex items-center gap-2">
        <Button
          asChild
          className="h-8 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          <Link to={CLIENT_TREATMENT_ROUTES.programQuestions(program.id)}>
            Open
          </Link>
        </Button>
        <Button
          variant="outline"
          className="h-8 px-4 text-xs font-bold text-slate-600 border-slate-200 hover:bg-slate-50 rounded dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          onClick={() => onPreview(program)}
        >
          <Eye className="h-3.5 w-3.5 mr-1" />
          Preview
        </Button>
      </div>
    </div>
  );
}
