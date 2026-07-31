import { Archive, Copy, Eye, Pencil, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { Program, ProgramStatus } from "@/features/treatments/types";
import { formatDateUS } from "@/features/treatments/utils/labels";
import { RuntimeReadinessBadge } from "@/features/treatments/assignment/components/RuntimeReadinessBadge";
import { ADMIN_TREATMENT_ROUTES } from "@/features/treatments/navigation/routes";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProgramListTableProps {
  programs: Program[];
  onEdit: (program: Program) => void;
  onPreview: (program: Program) => void;
  onDuplicate: (program: Program) => void;
  onArchive: (program: Program) => void;
  onToggleStatus: (program: Program, status: ProgramStatus) => void;
  duplicatingProgramId?: string | null;
  archivingProgramId?: string | null;
}

export function ProgramListTable({
  programs,
  onEdit,
  onPreview,
  onDuplicate,
  onArchive,
  onToggleStatus,
  duplicatingProgramId,
  archivingProgramId,
}: ProgramListTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="min-w-[300px] px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Name</TableHead>
            <TableHead className="px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Type</TableHead>
            <TableHead className="px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Treatment Type</TableHead>
            <TableHead className="px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Visit Type</TableHead>
            <TableHead className="px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Questions</TableHead>
            <TableHead className="px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Checkout Qs</TableHead>
            <TableHead className="px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</TableHead>
            <TableHead className="px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Last Updated</TableHead>
            <TableHead className="px-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {programs.map((program) => {
            const isPublished = program.status === "published";
            const checkoutCount = program.checkoutQuestionCount || 0;

            return (
              <TableRow key={program.id} className="group hover:bg-slate-50/50">
                <TableCell className="px-4 font-medium min-w-[300px]">
                  <div className="flex items-center gap-2">
                    <Link
                      className="text-slate-900 font-semibold hover:text-blue-600 hover:underline"
                      to={ADMIN_TREATMENT_ROUTES.programQuestions(program.id)}
                    >
                      {program.name}
                    </Link>
                    <RuntimeReadinessBadge state={program.assignmentRuntimeState} />
                  </div>
                  <div className="text-xs text-slate-500 font-normal mt-1">
                    {program.description || "Intake questionnaire"}
                  </div>
                </TableCell>
                <TableCell className="px-4">
                  <span
                    className={cn(
                      "inline-block rounded px-2.5 py-1 text-[11px] font-semibold",
                      program.stage === "intake"
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    )}
                  >
                    {program.stage === "intake" ? "Onboarding" : "Follow-up"}
                  </span>
                </TableCell>
                <TableCell className="px-4 text-slate-600">{program.treatmentTypeKey}</TableCell>
                <TableCell className="px-4">
                  <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700 font-medium">
                    {program.visitType}
                  </code>
                </TableCell>
                <TableCell className="px-4 text-slate-600">{program.questionCount || 0}</TableCell>
                <TableCell className="px-4">
                  {checkoutCount > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-100 px-2.5 py-1 text-[11.5px] font-semibold text-green-700">
                      <ShoppingCart className="h-3 w-3" />
                      {checkoutCount}
                    </span>
                  ) : (
                    <span className="text-[11.5px] italic text-slate-400">— none</span>
                  )}
                </TableCell>
                <TableCell className="px-4">
                  <button
                    type="button"
                    onClick={() => onToggleStatus(program, isPublished ? "draft" : "published")}
                    title={isPublished ? "Click to unpublish" : "Click to publish"}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                      isPublished
                        ? "bg-green-100 text-green-700 border-green-200 hover:brightness-95"
                        : "bg-gray-100 text-slate-600 border-gray-200 hover:brightness-95"
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", isPublished ? "bg-green-500" : "bg-slate-400")} />
                    {isPublished ? "Published" : "Draft"}
                  </button>
                </TableCell>
                <TableCell className="px-4 text-slate-500 text-xs">{formatDateUS(program.updatedAt)}</TableCell>
                <TableCell className="px-4 text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-blue-600"
                      title="Preview"
                      onClick={() => onPreview(program)}
                    >
                      <span className="sr-only">Preview {program.name}</span>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-blue-600"
                      title="Edit"
                      onClick={() => onEdit(program)}
                    >
                      <span className="sr-only">Edit {program.name}</span>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-blue-600"
                      title="Duplicate"
                      onClick={() => onDuplicate(program)}
                      disabled={duplicatingProgramId === program.id}
                    >
                      <span className="sr-only">Duplicate {program.name}</span>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-amber-700 disabled:opacity-40"
                      title={program.status === "archived" ? "Already archived" : "Archive"}
                      onClick={() => onArchive(program)}
                      disabled={program.status === "archived" || archivingProgramId === program.id}
                    >
                      <span className="sr-only">Archive {program.name}</span>
                      <Archive className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
