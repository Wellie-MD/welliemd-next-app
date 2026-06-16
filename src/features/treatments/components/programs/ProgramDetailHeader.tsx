import { Link } from "react-router-dom";
import type React from "react";
import {
  ArrowLeft,
  ChevronDown,
  FileText,
  GitBranch,
  LayoutGrid,
  LayoutTemplate,
  List as ListIcon,
  MessageSquare,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusPill } from "../common";
import type { Program, QuestionKind } from "../../types";
import { formatProgramStage } from "../../utils/labels";

interface ProgramDetailHeaderProps {
  program: Program;
  viewMode: "list" | "flow";
  isReordering: boolean;
  onViewModeChange: (mode: "list" | "flow") => void;
  onReorderingChange: (isReordering: boolean) => void;
  onAddElement: (kind: QuestionKind) => void;
}

const addElementOptions: Array<{
  kind: QuestionKind;
  label: string;
  description: string;
  icon: React.ReactNode;
  iconClassName: string;
}> = [
  {
    kind: "text",
    label: "Question",
    description: "Ask the patient something — text, choice, file, etc.",
    icon: <MessageSquare className="h-4 w-4" />,
    iconClassName: "bg-blue-50 text-blue-600",
  },
  {
    kind: "personal_details",
    label: "Patient Authentication",
    description: "Email, SMS code, photo ID, or account creation requirements.",
    icon: <ShieldCheck className="h-4 w-4" />,
    iconClassName: "bg-indigo-50 text-indigo-600",
  },
  {
    kind: "medical_conditions",
    label: "Section",
    description: "Insert a reusable Common Section.",
    icon: <LayoutTemplate className="h-4 w-4" />,
    iconClassName: "bg-emerald-50 text-emerald-600",
  },
  {
    kind: "consent",
    label: "Consent",
    description: "Attach a legal consent the patient must acknowledge.",
    icon: <FileText className="h-4 w-4" />,
    iconClassName: "bg-amber-50 text-amber-600",
  },
  {
    kind: "checkout",
    label: "Checkout",
    description: "Show the patient available products and let them pick.",
    icon: <ShoppingCart className="h-4 w-4" />,
    iconClassName: "bg-rose-50 text-rose-600",
  },
];

export function ProgramDetailHeader({
  program,
  viewMode,
  isReordering,
  onViewModeChange,
  onReorderingChange,
  onAddElement,
}: ProgramDetailHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex gap-3">
        <Button asChild variant="outline" size="icon" className="h-9 w-9 shrink-0">
          <Link to="/dashboard/treatments/programs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Program</div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">{program.name}</h1>
            <StatusPill tone={program.status === "published" ? "green" : "yellow"}>{program.status}</StatusPill>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <span>{formatProgramStage(program.stage)}</span>
            <span className="text-slate-300">•</span>
            <span>{program.treatmentTypeKey}</span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1.5">
              Beluga visit type:
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700">
                {program.visitType}
              </code>
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-2 hidden items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm sm:flex">
          <button
            onClick={() => onViewModeChange("list")}
            className={`flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === "list" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <ListIcon className="mr-2 h-4 w-4" />
            List
          </button>
          <button
            onClick={() => onViewModeChange("flow")}
            className={`flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === "flow" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="mr-2 h-4 w-4" />
            Flow
          </button>
        </div>

        <Button
          variant={isReordering ? "default" : "outline"}
          onClick={() => onReorderingChange(!isReordering)}
          className={isReordering ? "bg-[#12517A] text-white hover:bg-[#12517A]/90" : ""}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {isReordering ? "Done Reordering" : "Reorder"}
        </Button>
        <Button variant="outline" asChild>
          <Link to={`/dashboard/treatments/programs/${program.id}/flow`}>
            <GitBranch className="mr-2 h-4 w-4" />
            Flow Builder
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-[#12517A] hover:bg-[#12517A]/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Element
              <ChevronDown className="ml-2 h-3 w-3 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2 shadow-xl">
            {addElementOptions.map((option) => (
              <DropdownMenuItem
                key={option.kind}
                onClick={() => onAddElement(option.kind)}
                className="cursor-pointer rounded-lg p-3 hover:bg-slate-50"
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 rounded-full p-2 ${option.iconClassName}`}>{option.icon}</div>
                  <div>
                    <div className="font-semibold text-slate-900">{option.label}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{option.description}</div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
