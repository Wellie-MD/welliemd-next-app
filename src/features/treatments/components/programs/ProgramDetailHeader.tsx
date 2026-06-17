import { Link } from "react-router-dom";
import { ArrowLeft, Copy, Edit, Link as LinkIcon, Play, List, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProgramDetailHeaderProps {
  programName: string;
  programStatus: string;
  visitType: string;
  slug: string;
  viewMode: "list" | "flow";
  onViewModeChange: (mode: "list" | "flow") => void;
  onPublishToggle: () => void;
  onSimulate: () => void;
  onCopySlug: () => void;
}

export function ProgramDetailHeader({
  programName,
  programStatus,
  visitType,
  slug,
  viewMode,
  onViewModeChange,
  onPublishToggle,
  onSimulate,
  onCopySlug,
}: ProgramDetailHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-6">
      <div className="flex gap-4">
        {/* Back Button */}
        <Button
          asChild
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0 border-slate-200 bg-white rounded-xl shadow-sm hover:bg-slate-50 mt-1"
        >
          <Link to="/dashboard/treatments/programs">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Link>
        </Button>

        <div>
          {/* Super title */}
          <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-1">
            Program
          </div>

          {/* Title Row */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {programName}
            </h1>
            
            {/* Badges */}
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#eefcf3] text-[#1e8a4a] border border-[#d1f4e0]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1e8a4a]"></span>
                INTAKE
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${
                  programStatus === "published"
                    ? "bg-[#eff6ff] text-[#1d4ed8] border-[#dbeafe]"
                    : "bg-[#f8fafc] text-[#64748b] border-[#e2e8f0]"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    programStatus === "published" ? "bg-[#1d4ed8]" : "bg-[#94a3b8]"
                  }`}
                ></span>
                {programStatus}
              </span>
            </div>
          </div>

          {/* Subtitle */}
          <div className="text-[13px] text-slate-400 mt-2 font-medium">
            - {visitType || "weightloss"} screening questions
          </div>

          {/* Link Row */}
          <div className="mt-3 flex items-center gap-2">
            <div className="inline-flex items-center gap-2 bg-[#fdfcff] border border-[#f0ebfb] rounded-md px-3 py-1.5 shadow-sm text-xs font-medium">
              <LinkIcon className="h-3.5 w-3.5 text-[#a855f7]" />
              <span className="text-slate-400">welliemd.com/intake/</span>
              <span className="text-[#9333ea] font-bold">{slug}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-slate-200 hover:bg-slate-50 px-3 font-semibold text-slate-600 rounded-md shadow-sm"
            >
              <Edit className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onCopySlug}
              className="h-8 w-8 border-slate-200 hover:bg-slate-50 text-slate-400 rounded-md shadow-sm"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={onPublishToggle}
          className={`h-10 text-[13px] font-bold px-6 rounded-lg shadow-sm ${
            programStatus === "published"
              ? "bg-slate-700 hover:bg-slate-800 text-white"
              : "bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
          }`}
        >
          Publish
        </Button>

        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50/80 p-1 shadow-sm h-10">
          <button
            onClick={() => onViewModeChange("list")}
            className={`flex items-center gap-1.5 rounded-md px-3.5 py-1 text-[12px] font-bold transition-all ${
              viewMode === "list"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            List
          </button>
          <button
            onClick={() => onViewModeChange("flow")}
            className={`flex items-center gap-1.5 rounded-md px-3.5 py-1 text-[12px] font-bold transition-all ${
              viewMode === "flow"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            <GitBranch className="h-3.5 w-3.5" />
            Flow
          </button>
        </div>

        <Button
          onClick={onSimulate}
          className="h-10 text-[13px] font-bold bg-[#0f766e] hover:bg-[#0d655e] text-white px-5 rounded-lg shadow-sm"
        >
          <Play className="h-4 w-4 mr-2 fill-white" />
          Simulate
        </Button>
      </div>
    </div>
  );
}
