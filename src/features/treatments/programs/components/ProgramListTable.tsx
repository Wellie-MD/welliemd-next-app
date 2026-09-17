import { Link } from "react-router-dom";
import { Check, ChevronDown, Copy, Eye, Pencil, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Program, ProgramStatus } from "@/features/treatments/types";
import { formatProgramStage } from "@/features/treatments/utils/labels";
import { cn } from "@/lib/utils";
import { CLIENT_TREATMENT_ROUTES } from "@/features/treatments/navigation/routes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  treatmentNameByKey: Record<string, string>;
  onEditSlug: (program: Program) => void;
  onPreviewProgram: (program: Program) => void;
  onStatusChange: (program: Program, status: ProgramStatus) => void | Promise<void>;
  onCopyUrl: (program: Program) => void | Promise<void>;
}

const stagePillClasses: Record<Program["stage"], string> = {
  intake: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-200",
  follow_up: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200",
};

const statusTriggerClasses: Record<ProgramStatus, string> = {
  published: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/10",
  draft: "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-800",
  archived: "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-800",
};

const formatStatusLabel = (status: ProgramStatus) =>
  status.charAt(0).toUpperCase() + status.slice(1);

const formatRelativeUpdatedAt = (value: string) => {
  const updatedAt = new Date(value);
  if (Number.isNaN(updatedAt.getTime())) return value;

  const diffDays = Math.max(0, Math.floor((Date.now() - updatedAt.getTime()) / 86400000));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
};

export function ProgramListTable({
  programs,
  treatmentNameByKey,
  onEditSlug,
  onPreviewProgram,
  onStatusChange,
  onCopyUrl,
}: ProgramListTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#171b27] dark:shadow-none">
      <Table>
        <TableHeader className="bg-slate-50 dark:bg-[#121620]">
          <TableRow>
            <TableHead className="w-[250px] text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Name</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Type</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Treatment Type</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Visit Type</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Slug</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Questions</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Last Updated</TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {programs.map((program) => (
            <TableRow key={program.id} className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
              <TableCell className="font-medium">
                <Link
                  to={CLIENT_TREATMENT_ROUTES.programQuestions(program.id)}
                  className="font-semibold text-[#4f00ff] transition-colors hover:text-[#3f00cc] hover:underline dark:text-blue-300 dark:hover:text-blue-200"
                >
                  {program.name}
                </Link>
              </TableCell>
              <TableCell>
                <span className={cn("inline-flex rounded-md border px-2.5 py-1 text-xs font-bold", stagePillClasses[program.stage])}>
                  {formatProgramStage(program.stage) === "Intake" ? "Onboarding" : "Follow-up"}
                </span>
              </TableCell>
              <TableCell className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {treatmentNameByKey[program.treatmentTypeKey] ?? program.treatmentTypeKey}
              </TableCell>
              <TableCell>
                <code className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-[#0f1117] dark:text-slate-200">
                  {program.visitType}
                </code>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <code className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-[#0f1117] dark:text-slate-200">
                    {program.slug}
                  </code>
                  <button
                    type="button"
                    onClick={() => onEditSlug(program)}
                    className="inline-flex text-slate-400 transition-colors hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-300"
                    aria-label={`Edit ${program.name} slug`}
                  >
                    <SquarePen className="h-3.5 w-3.5" />
                  </button>
                </div>
              </TableCell>
              <TableCell className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {program.questionCount}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "inline-flex h-7 min-w-[108px] items-center justify-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#171b27]",
                        statusTriggerClasses[program.status]
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", program.status === "published" ? "bg-emerald-500" : "bg-slate-400")} />
                      {formatStatusLabel(program.status)}
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[108px] border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-[#171b27]">
                    {(["published", "draft"] as ProgramStatus[]).map((status) => (
                      <DropdownMenuItem
                        key={status}
                        onClick={() => onStatusChange(program, status)}
                        className="flex cursor-pointer items-center gap-2 text-xs font-semibold"
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", status === "published" ? "bg-emerald-500" : "bg-slate-400")} />
                        {formatStatusLabel(status)}
                        {program.status === status ? <Check className="ml-auto h-3.5 w-3.5" /> : null}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
              <TableCell className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {formatRelativeUpdatedAt(program.updatedAt)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onPreviewProgram(program)}
                    className="h-8 w-8 text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-300"
                    title="Preview"
                    aria-label={`Preview ${program.name}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-300" title="Open">
                    <Link to={CLIENT_TREATMENT_ROUTES.programQuestions(program.id)} aria-label={`Open ${program.name}`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => void onCopyUrl(program)}
                    className="h-8 w-8 text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-300"
                    title="Copy intake URL"
                    aria-label={`Copy ${program.name} intake URL`}
                  >
                    <Copy className="h-4 w-4" />
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
