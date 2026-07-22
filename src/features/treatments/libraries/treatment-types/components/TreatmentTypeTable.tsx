import { Link } from "react-router-dom";
import { ClipboardCheck, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Program, TreatmentType } from "@/features/treatments/types";
import { ADMIN_TREATMENT_ROUTES } from "@/features/treatments/navigation/routes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TreatmentTypeTableProps {
  treatmentTypes: TreatmentType[];
  /** Full catalog (unfiltered) used to compute shared visit-type identifiers. */
  allTreatmentTypes: TreatmentType[];
  programs: Program[];
  onEdit?: (key: string) => void;
  onDelete?: (id: string) => void;
}

export function TreatmentTypeTable({
  treatmentTypes,
  allTreatmentTypes,
  programs,
  onEdit,
  onDelete,
}: TreatmentTypeTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[240px] text-xs font-semibold uppercase tracking-wider text-slate-500">Name</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">ID</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Intake Visit Type</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Follow-up Visit Type</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Used In</TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {treatmentTypes.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center text-sm text-slate-500">
                No treatment types match your search.
              </TableCell>
            </TableRow>
          )}
          {treatmentTypes.map((type) => {
            const sharedCount = allTreatmentTypes.filter(
              (other) => other.key !== type.key && other.intakeVisitType === type.intakeVisitType
            ).length;
            const usedInPrograms = programs.filter((program) => program.treatmentTypeKey === type.key);

            return (
              <TableRow key={type.key} className="group align-top hover:bg-slate-50/50">
                <TableCell className="font-medium">
                  <Link
                    to={`/dashboard/treatments/treatment-types/${type.key}`}
                    className="text-slate-900 hover:text-blue-600 hover:underline"
                  >
                    {type.name}
                  </Link>
                  {type.description && (
                    <div className="mt-1 text-xs font-normal text-slate-500">{type.description}</div>
                  )}
                </TableCell>
                <TableCell>
                  <code className="rounded bg-violet-50 px-1.5 py-0.5 font-mono text-xs font-medium text-violet-700">
                    {type.key}
                  </code>
                </TableCell>
                <TableCell>
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
                    {type.intakeVisitType}
                  </code>
                  {sharedCount > 0 && (
                    <div className="mt-1 text-[11px] text-slate-400">
                      Shared with {sharedCount} other treatment type{sharedCount === 1 ? "" : "s"}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {type.followupVisitType ? (
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
                      {type.followupVisitType}
                    </code>
                  ) : (
                    <span className="text-sm text-slate-400">No follow-up</span>
                  )}
                </TableCell>
                <TableCell>
                  {usedInPrograms.length === 0 ? (
                    <span className="text-sm text-slate-400">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {usedInPrograms.map((program) => (
                        <Link
                          key={program.id}
                          to={ADMIN_TREATMENT_ROUTES.programQuestions(program.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
                        >
                          <ClipboardCheck className="h-3 w-3 text-slate-400" />
                          {program.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-blue-600"
                      title="Edit"
                      onClick={() => onEdit?.(type.key)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-600"
                        title="Delete"
                        onClick={() => onDelete(type.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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
