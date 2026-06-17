import { Link } from "react-router-dom";
import { Eye, Pencil, Trash2, Users, User, GitBranch } from "lucide-react";
import type { CustomProgram } from "@/features/treatments/types";
import { Button } from "@/components/ui/button";
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
  onPreview?: (program: CustomProgram) => void;
}

export function CustomProgramTable({ customPrograms, onEdit, onDelete, onPreview }: CustomProgramTableProps) {
  const isProgramMulti = (p: CustomProgram) => {
    return p.isMulti === true || p.includedProgramIds.length > 1 || (p.tags && p.tags.includes("Multi-treatment"));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      if (dateStr.includes("/")) return dateStr;
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const renderAudienceBadge = (audience: CustomProgram["audience"]) => {
    const iconClass = "h-3.5 w-3.5 mr-1 shrink-0";
    if (audience === "male") {
      return (
        <span className="inline-flex items-center rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-semibold text-blue-700">
          <User className={iconClass} />
          Male
        </span>
      );
    }
    if (audience === "female") {
      return (
        <span className="inline-flex items-center rounded bg-pink-50 border border-pink-200 px-2 py-0.5 text-xs font-semibold text-pink-700">
          <User className={iconClass} />
          Female
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded bg-purple-50 border border-purple-200 px-2 py-0.5 text-xs font-semibold text-purple-700">
        <Users className={iconClass} />
        All
      </span>
    );
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[280px] text-xs font-semibold uppercase tracking-wider text-slate-500">
              Name
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Type
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Audience
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Onboarding Stage
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Updated
            </TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customPrograms.map((program) => {
            const isMulti = isProgramMulti(program);
            return (
              <TableRow key={program.id} className="group transition-colors hover:bg-slate-50/50">
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <Link
                      to={`/dashboard/treatments/custom-programs/${program.id}/builder`}
                      className="text-slate-900 font-semibold hover:text-blue-600 hover:underline flex items-center gap-1.5"
                    >
                      {program.name}
                    </Link>
                    <span className="mt-1 text-xs text-slate-400 truncate max-w-[260px]">
                      {program.description}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {isMulti ? (
                    <span className="inline-block rounded px-2 py-0.5 text-xs font-semibold bg-pink-50 text-[#9d174d] border border-pink-200">
                      Multi-treatment
                    </span>
                  ) : (
                    <span className="inline-block rounded px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      Single treatment
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {renderAudienceBadge(program.audience)}
                    <span className="inline-block rounded border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {program.minAge}
                      {program.maxAge ? `-${program.maxAge}` : "+"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-xs text-slate-900">
                      {program.onboardingName || program.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {program.questionCount || 0} questions
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-slate-500">
                  {formatDate(program.updatedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                      title="Open Builder"
                    >
                      <Link to={`/dashboard/treatments/custom-programs/${program.id}/builder`}>
                        <GitBranch className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                      title="Preview"
                      onClick={() => onPreview?.(program)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                        title="Edit Settings"
                        onClick={() => onEdit(program)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete"
                        onClick={() => onDelete(program.id)}
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
