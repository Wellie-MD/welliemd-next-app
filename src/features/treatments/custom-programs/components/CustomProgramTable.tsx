import { Link } from "react-router-dom";
import { Eye, Pencil, Trash2, Users, User, GitBranch } from "lucide-react";
import type { CustomProgram } from "@/features/treatments/types";
import { isCustomProgramMulti } from "@/features/treatments/custom-programs/hooks/useCustomProgramsPage";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RuntimeReadinessBadge } from "@/features/treatments/assignment/components/RuntimeReadinessBadge";

interface CustomProgramTableProps {
  customPrograms: CustomProgram[];
  onEdit?: (program: CustomProgram) => void;
  onDelete?: (id: string) => void;
  onPreview?: (program: CustomProgram) => void;
}

export function CustomProgramTable({ customPrograms, onEdit, onDelete, onPreview }: CustomProgramTableProps) {
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
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
            <TableHead className="w-[280px] px-3 py-3 text-xs font-medium uppercase tracking-wider text-gray-700">
              Name
            </TableHead>
            <TableHead className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-gray-700">
              Scope
            </TableHead>
            <TableHead className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-gray-700">
              Audience
            </TableHead>
            <TableHead className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-gray-700">
              Onboarding Stage
            </TableHead>
            <TableHead className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-gray-700">
              Updated
            </TableHead>
            <TableHead className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customPrograms.map((program) => {
            const isMulti = isCustomProgramMulti(program);
            return (
              <TableRow
                key={program.id}
                className="group border-b border-gray-100 transition-all duration-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent"
              >
                <TableCell className="px-4 py-4 font-medium">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/dashboard/treatments/custom-programs/${program.id}/builder`}
                        className="text-gray-900 font-semibold hover:text-blue-600 hover:underline flex items-center gap-1.5"
                      >
                        {program.name}
                        {isMulti && (
                          <span className="rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide bg-pink-50 text-[#9d174d] border border-pink-200">
                            Multi
                          </span>
                        )}
                      </Link>
                      <RuntimeReadinessBadge state={program.assignmentRuntimeState} />
                    </div>
                    <span className="mt-1 text-xs text-gray-400 truncate max-w-[260px]">
                      {program.description}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4">
                  {isMulti ? (
                    <span className="inline-block rounded px-2 py-0.5 text-xs font-semibold bg-pink-50 text-[#9d174d] border border-pink-200">
                      Multi-treatment
                    </span>
                  ) : (
                    <span className="inline-block rounded px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                      Single treatment
                    </span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    {renderAudienceBadge(program.audience)}
                    <span className="inline-block rounded border border-gray-200 bg-white px-2 py-0.5 font-mono text-xs font-semibold text-gray-600">
                      {program.minAge}
                      {program.maxAge ? `-${program.maxAge}` : "+"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-xs text-gray-900">
                      {program.onboardingName || program.name}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {program.runtimeSummary?.status === "ready"
                        ? `${program.runtimeSummary.effectiveQuestionCount} patient steps · ${program.runtimeSummary.screeningQuestionCount} screening`
                        : program.runtimeSummary
                          ? `${program.runtimeSummary.screeningQuestionCount} screening · republish required`
                        : `${program.questionCount || 0} draft questions`}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4 text-xs text-gray-500">
                  {formatDate(program.updatedAt)}
                </TableCell>
                <TableCell className="px-4 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-gray-100"
                      title="Open Builder"
                    >
                      <Link to={`/dashboard/treatments/custom-programs/${program.id}/builder`}>
                        <GitBranch className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-gray-100"
                      title="Preview"
                      onClick={() => onPreview?.(program)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-gray-100"
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
                        className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
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
