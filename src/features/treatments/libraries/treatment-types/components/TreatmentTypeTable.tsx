import { Link } from "react-router-dom";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TreatmentType } from "@/features/treatments/types";
import { StatusPill } from "@/features/treatments/common/components";
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
  onEdit?: (key: string) => void;
  onDelete?: (key: string) => void;
}

export function TreatmentTypeTable({ treatmentTypes, onEdit, onDelete }: TreatmentTypeTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[280px] text-xs font-semibold uppercase tracking-wider text-slate-500">Name</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">ID</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Intake Visit Type</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Follow-up Visit Type</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Used In</TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {treatmentTypes.map((type) => (
            <TableRow key={type.key} className="group hover:bg-slate-50/50">
              <TableCell className="font-medium">
                <Link to={`/dashboard/treatments/treatment-types/${type.key}`} className="text-slate-900 hover:text-[#12517A] hover:underline">
                  {type.name}
                </Link>
                <div className="text-xs text-slate-500 font-normal mt-1">
                  Treatment category
                </div>
              </TableCell>
              <TableCell>
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700 font-medium font-mono">{type.key}</code>
              </TableCell>
              <TableCell className="text-slate-600">{type.intakeVisitType}</TableCell>
              <TableCell className="text-slate-600">
                {type.followupVisitType ? (
                  type.followupVisitType
                ) : (
                  <span className="text-slate-400 text-sm">Not configured</span>
                )}
              </TableCell>
              <TableCell>
                <StatusPill tone="blue">{type.programCount || 0} programs</StatusPill>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#12517A]" title="View Details">
                    <Link to={`/dashboard/treatments/treatment-types/${type.key}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#12517A]" title="Edit" onClick={() => onEdit?.(type.key)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {onDelete && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" title="Delete" onClick={() => onDelete(type.key)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
