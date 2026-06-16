import { Link } from "react-router-dom";
import { Eye, GitBranch, Pencil, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CustomProgram } from "../../types";
import { StatusPill } from "../common";
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
  onEdit?: (program: CustomProgram) => void;
  onDelete?: (id: string) => void;
}

export function CustomProgramTable({ customPrograms, onEdit, onDelete }: CustomProgramTableProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[300px] text-xs font-semibold uppercase tracking-wider text-slate-500">Name</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Programs</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sections</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Consents</TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customPrograms.map((program) => (
            <TableRow key={program.id} className="group transition-colors hover:bg-slate-50/50">
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <Link 
                    to={`/dashboard/treatments/custom-programs/${program.id}/builder`}
                    className="text-slate-900 hover:text-[#12517A] hover:underline"
                  >
                    {program.name}
                  </Link>
                  <span className="mt-1 text-xs text-slate-500 truncate max-w-[280px]">
                    {program.description}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <StatusPill tone={program.status === "published" ? "green" : "yellow"}>
                  {program.status}
                </StatusPill>
              </TableCell>
              <TableCell className="text-slate-600">{program.includedProgramIds.length}</TableCell>
              <TableCell className="text-slate-600">{program.sectionIds.length}</TableCell>
              <TableCell className="text-slate-600">{program.consentIds.length}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#12517A]" title="Open Builder">
                    <Link to={`/dashboard/treatments/custom-programs/${program.id}/builder`}>
                      <GitBranch className="h-4 w-4" />
                    </Link>
                  </Button>
                  {onEdit && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#12517A]" title="Edit" onClick={() => onEdit(program)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" title="Delete" onClick={() => onDelete(program.id)}>
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

