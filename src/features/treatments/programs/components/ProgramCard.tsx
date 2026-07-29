import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Archive, Copy, Eye, HelpCircle, CheckSquare, FileText,
  MoreHorizontal, Pencil, Check, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import type { Program, ProgramStatus, TreatmentType } from "@/features/treatments/types";
import { formatProgramStage } from "@/features/treatments/utils/labels";
import { RuntimeReadinessBadge } from "@/features/treatments/assignment/components/RuntimeReadinessBadge";
import { ADMIN_TREATMENT_ROUTES } from "@/features/treatments/navigation/routes";

interface ProgramCardProps {
  program: Program;
  treatmentType?: TreatmentType;
  consentCount: number;
  assignedClientsCount: number;
  onPreview: (program: Program) => void;
  onEdit: (program: Program) => void;
  onDuplicate: (program: Program) => void;
  onArchive: (program: Program) => void;
  onSaveSlug: (programId: string, newSlug: string) => void;
  onToggleStatus?: (program: Program, status: ProgramStatus) => void | Promise<void>;
  duplicatingProgramId?: string | null;
  archivingProgramId?: string | null;
}

export function ProgramCard({
  program,
  treatmentType,
  consentCount,
  assignedClientsCount,
  onPreview,
  onEdit,
  onDuplicate,
  onArchive,
  onSaveSlug,
  onToggleStatus,
  duplicatingProgramId,
  archivingProgramId,
}: ProgramCardProps) {
  const screeningQuestionCount = program.questionCount || 0;
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col min-h-[300px] group">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-700 border-blue-200">
            {formatProgramStage(program.stage)}
          </span>
          {treatmentType && (
            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium bg-slate-50 text-slate-600 border-slate-200">
              {treatmentType.name}
            </span>
          )}
          <RuntimeReadinessBadge state={program.assignmentRuntimeState} />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${
              isPublished
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-slate-50 text-slate-500 border-slate-200"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isPublished ? "bg-green-500" : "bg-slate-400"
              }`}
            />
            {program.status}
          </span>
          <Switch
            checked={isPublished}
            disabled={program.status === "archived"}
            onCheckedChange={(checked) =>
              onToggleStatus?.(program, checked ? "published" : "draft")
            }
            className="disabled:opacity-100 data-[state=checked]:bg-[#5b4dff] data-[state=unchecked]:bg-slate-300"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEdit(program)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDuplicate(program)}
                disabled={duplicatingProgramId === program.id}
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onArchive(program)}
                disabled={
                  program.status === "archived" ||
                  archivingProgramId === program.id
                }
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <h3 className="text-sm font-bold text-slate-900 leading-tight mb-1">
        {program.name}
      </h3>
      <div className="mt-1 mb-2">
        {isEditingSlug ? (
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md p-1 shadow-sm h-7">
            <span className="text-[10px] text-slate-400 px-1">Slug:</span>
            <input
              value={tempSlug}
              onChange={(e) => setTempSlug(e.target.value)}
              className="w-28 text-[11px] font-bold text-slate-800 focus:outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveSlug();
                if (e.key === "Escape") setIsEditingSlug(false);
              }}
            />
            <button
              onClick={handleSaveSlug}
              className="p-1 hover:bg-slate-50 text-green-600 rounded"
              aria-label="Save slug"
              type="button"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setIsEditingSlug(false)}
              className="p-1 hover:bg-slate-50 text-slate-400 rounded"
              aria-label="Cancel slug edit"
              type="button"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="truncate">
              <span className="text-slate-400">Slug: </span>
              <span className="text-slate-700 font-semibold">{program.slug}</span>
            </span>
            <button
              onClick={() => setIsEditingSlug(true)}
              className="p-1 rounded hover:bg-slate-100 text-slate-400"
              aria-label="Edit slug"
              type="button"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      <div className="flex-1" />

      <div className="h-px bg-slate-100 my-3" />

      <div className="mb-3">
        <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2">
          Content Summary
        </div>
        <div className="grid grid-cols-2 gap-y-2 gap-x-3">
          <div
            className="flex items-center gap-1.5 text-slate-600"
            title="Total configured screening questions across every conditional path. Patient preview counts only the path active for that patient."
          >
            <HelpCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-700">
              {screeningQuestionCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Screening configured
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <CheckSquare className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-700">
              {program.checkoutQuestionCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Checkout
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 col-span-2 sm:col-span-1">
            <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-700">
              {consentCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Consents
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 col-span-2 sm:col-span-1">
            <span className="h-3.5 w-3.5 flex items-center justify-center text-[10px] text-slate-400 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {(!program.serviceStates || program.serviceStates.length === 0)
                ? "All"
                : program.serviceStates.length
              }
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              States
            </span>
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-100 mb-3" />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            asChild
            className="h-8 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            <Link to={ADMIN_TREATMENT_ROUTES.programQuestions(program.id)}>
              Open
            </Link>
          </Button>
          <Button
            variant="outline"
            className="h-8 px-4 text-xs font-bold text-slate-600 border-slate-200 hover:bg-slate-50 rounded"
            onClick={() => onPreview(program)}
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            Preview
          </Button>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-0.5">
            USAGE
          </div>
          <div className="text-[10px] font-medium text-slate-400">
            Assigned to {assignedClientsCount} clients
          </div>
        </div>
      </div>
    </div>
  );
}
