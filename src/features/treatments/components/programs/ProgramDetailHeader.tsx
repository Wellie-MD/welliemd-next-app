import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Copy, Edit, Link as LinkIcon, Play, List, GitBranch, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProgramDetailHeaderProps {
  programName: string;
  programStatus: string;
  programStage: string;
  visitType: string;
  slug: string;
  viewMode: "list" | "flow";
  onViewModeChange: (mode: "list" | "flow") => void;
  onPublishToggle: () => void;
  onSimulate: () => void;
  onCopySlug: () => void;
  onSaveSlug: (newSlug: string) => void;
}

export function ProgramDetailHeader({
  programName,
  programStatus,
  programStage,
  visitType,
  slug,
  viewMode,
  onViewModeChange,
  onPublishToggle,
  onSimulate,
  onCopySlug,
  onSaveSlug,
}: ProgramDetailHeaderProps) {
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [tempSlug, setTempSlug] = useState(slug);

  useEffect(() => {
    setTempSlug(slug);
  }, [slug]);

  const handleSave = () => {
    const formatted = tempSlug
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "")
      .trim();
    if (formatted) {
      onSaveSlug(formatted);
    }
    setIsEditingSlug(false);
  };

  const isPublished = programStatus === "published";
  const isIntake = programStage === "intake";

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
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
        </Button>

        <div>
          {/* Super title */}
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">
            PROGRAM
          </div>

          {/* Title Row */}
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-none">
              {programName}
            </h1>
            
            {/* Badges */}
            <div className="flex items-center gap-1.5">
              {isIntake ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  Intake
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                  Follow-up
                </span>
              )}

              {isPublished ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-100 uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  PUBLISHED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                  DRAFT
                </span>
              )}
            </div>
          </div>

          {/* Subtitle */}
          <div className="text-xs text-slate-400 mt-2 font-medium leading-none">
            - {visitType || "weightloss"} screening questions
          </div>

          {/* Link Row */}
          <div className="mt-3 flex items-center gap-2">
            {isEditingSlug ? (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md p-1 shadow-sm h-8">
                <span className="text-[11px] text-slate-400 px-1.5">welliemd.com/intake/</span>
                <input
                  value={tempSlug}
                  onChange={(e) => setTempSlug(e.target.value)}
                  className="w-40 text-xs font-bold text-slate-800 focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") setIsEditingSlug(false);
                  }}
                />
                <button
                  onClick={handleSave}
                  className="p-1 hover:bg-slate-50 text-green-600 rounded"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setIsEditingSlug(false)}
                  className="p-1 hover:bg-slate-50 text-slate-400 rounded"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 bg-[#fdfcff] border border-[#f0ebfb] rounded-md px-3 py-1.5 shadow-sm text-xs font-medium h-8">
                  <LinkIcon className="h-3.5 w-3.5 text-[#a855f7]" />
                  <span className="text-slate-400">welliemd.com/intake/</span>
                  <span className="text-[#9333ea] font-bold">{slug}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingSlug(true)}
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {isPublished ? (
          <Button
            onClick={onPublishToggle}
            variant="outline"
            className="h-10 text-[13px] font-bold px-6 rounded-lg shadow-sm border-red-200 text-red-600 bg-white hover:bg-red-50/50"
          >
            Unpublish
          </Button>
        ) : (
          <Button
            onClick={onPublishToggle}
            className="h-10 text-[13px] font-bold px-6 rounded-lg shadow-sm bg-blue-600 hover:bg-blue-700 text-white"
          >
            Publish
          </Button>
        )}

        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50/80 p-1 shadow-sm h-10">
          <button
            onClick={() => onViewModeChange("list")}
            className={`flex items-center gap-1.5 rounded-md px-3.5 py-1 text-[12px] font-bold transition-all h-8 ${
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
            className={`flex items-center gap-1.5 rounded-md px-3.5 py-1 text-[12px] font-bold transition-all h-8 ${
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
