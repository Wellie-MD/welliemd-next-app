import { Archive, Copy, Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { Program } from "@/features/treatments/types";
import { formatProgramStage } from "@/features/treatments/utils/labels";
import { StatusPill } from "@/features/treatments/common/components";
import { RuntimeReadinessBadge } from "@/features/treatments/assignment/components/RuntimeReadinessBadge";
import { ADMIN_TREATMENT_ROUTES } from "@/features/treatments/navigation/routes";
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
  duplicatingProgramId?: string | null;
  archivingProgramId?: string | null;
}

export function ProgramListTable({
  programs,
  onEdit,
  onPreview,
  onDuplicate,
  onArchive,
  duplicatingProgramId,
  archivingProgramId,
}: ProgramListTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[280px] text-xs font-semibold uppercase tracking-wider text-slate-500">Name</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Type</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Treatment Type</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Visit Type</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Questions</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Checkout Qs</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {programs.map((program) => (
            <TableRow key={program.id} className="group hover:bg-slate-50/50">
              <TableCell className="font-medium">
                <Link
                  className="text-slate-900 hover:text-[#12517A] hover:underline"
                  to={ADMIN_TREATMENT_ROUTES.programQuestions(program.id)}
                >
                  {program.name}
                </Link>
                <div className="text-xs text-slate-500 font-normal mt-1">
                  {program.description || "Intake questionnaire"}
                </div>
              </TableCell>
              <TableCell className="text-slate-600">{formatProgramStage(program.stage)}</TableCell>
              <TableCell className="text-slate-600">{program.treatmentTypeKey}</TableCell>
              <TableCell>
                <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700 font-medium">
                  {program.visitType}
                </code>
              </TableCell>
              <TableCell className="text-slate-600">
                {(program.questionCount || 0) + (program.checkoutQuestionCount || 0)}
              </TableCell>
              <TableCell className="text-slate-600">{program.checkoutQuestionCount}</TableCell>
              <TableCell>
                <div className="flex flex-col items-start gap-1">
                  <StatusPill tone={program.status === "published" ? "green" : "yellow"}>
                    {program.status}
                  </StatusPill>
                  <RuntimeReadinessBadge state={program.assignmentRuntimeState} />
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-[#12517A]"
                    title="Preview"
                    onClick={() => onPreview(program)}
                  >
                    <span className="sr-only">Preview {program.name}</span>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-[#12517A]"
                    title="Edit"
                    onClick={() => onEdit(program)}
                  >
                    <span className="sr-only">Edit {program.name}</span>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-[#12517A]"
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
