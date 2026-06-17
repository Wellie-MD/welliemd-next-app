import { Link } from "react-router-dom";
import { Sparkles, Pill, ShoppingCart, TestTube, Package, Pencil, Trash2, ArrowRight, Info, Eye } from "lucide-react";
import type { CustomProgram } from "../../types";
import { cn } from "@/lib/utils";

interface CustomProgramCardProps {
  customProgram: CustomProgram;
  onEdit?: (program: CustomProgram) => void;
  onDelete?: (id: string) => void;
  onPreview?: (program: CustomProgram) => void;
  onViewCatalog?: (program: CustomProgram, tab: "medicine" | "checkout" | "labs" | "supplies" | "hub") => void;
}

export function CustomProgramCard({ customProgram, onEdit, onDelete, onPreview, onViewCatalog }: CustomProgramCardProps) {
  const isMulti = customProgram.isMulti === true || customProgram.includedProgramIds.length > 1 || (customProgram.tags && customProgram.tags.includes("Multi-treatment"));

  const renderIcon = () => {
    const iconClass = "h-[17px] w-[17px]";
    if (customProgram.icon === "sparkles") {
      return <Sparkles className={iconClass} />;
    }
    if (customProgram.icon === "pill") {
      return <Pill className={iconClass} />;
    }
    return <Sparkles className={iconClass} />;
  };

  const getIconFrameClass = () =>
    cn(
      "flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg",
      customProgram.icon === "pill"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-pink-50 text-pink-700"
    );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      // If dateStr is already in format like '05/21/2026', return it or format it
      if (dateStr.includes("/")) return dateStr;
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Derive catalog counts based on visitType
  const getCatalogStats = () => {
    if (customProgram.visitType === "mensWellness") {
      return {
        medicine: 1,
        checkout: 0,
        labs: 0,
        supplies: 0,
      };
    }
    // Default stats
    return {
      medicine: 0,
      checkout: customProgram.checkoutOptions?.length || 0,
      labs: 0,
      supplies: 0,
    };
  };

  const stats = getCatalogStats();

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border transition-all duration-150 hover:shadow-md ${
        isMulti
          ? "border-pink-200 bg-gradient-to-b from-pink-50/70 via-white to-white"
          : "border-slate-200 bg-white"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-100 p-3.5 gap-2.5">
        <div
          className={getIconFrameClass()}
        >
          {renderIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 font-semibold text-sm text-slate-900 leading-tight">
            <span>{customProgram.name}</span>
            {isMulti && (
              <span className="rounded-[3px] border border-pink-200 bg-pink-50 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-[#9d174d]">
                Multi
              </span>
            )}
          </div>
          <div className="mt-1 truncate text-[11.5px] text-slate-400 leading-none">
            {customProgram.description}
          </div>
        </div>
        <div className="flex gap-0.5 shrink-0">
          {onEdit && (
            <button
              onClick={() => onEdit(customProgram)}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-md transition-colors"
              title="Edit Settings"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(customProgram.id)}
              className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors"
              title="Delete Program"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Onboarding Phase details */}
      <div className="h-[120px] shrink-0 bg-white p-3.5 flex flex-col justify-between border-b border-slate-100">
        <div>
          <div className="font-semibold text-[13px] text-slate-900 leading-tight">
            {customProgram.onboardingName || customProgram.name}
          </div>
          <div className="text-[11.5px] text-slate-400 mt-1">
            {customProgram.questionCount || 0} questions
            {customProgram.updatedAt && ` · updated ${formatDate(customProgram.updatedAt)}`}
          </div>
        </div>
        <div className="flex gap-1.5 mt-auto">
          <Link
            to={`/dashboard/treatments/custom-programs/${customProgram.id}/builder`}
            className="flex-1 inline-flex items-center justify-center text-center py-1.5 px-3 rounded-lg text-[11.5px] font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Open builder
          </Link>
          <button
            onClick={() => onPreview?.(customProgram)}
            className="flex-1 inline-flex items-center justify-center text-center py-1.5 px-3 rounded-lg text-[11.5px] font-semibold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
          >
            Preview
          </button>
        </div>
      </div>

      {/* Connected Catalog Footer */}
      {!customProgram.visitType ? (
        <div className="flex-1 flex items-center gap-1.5 bg-[#fafbfc] px-3.5 py-2.5 text-[11.5px] text-slate-400 italic rounded-b-xl">
          <Info className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span>Routes to multiple visit types — see destinations</span>
        </div>
      ) : (
        <div className="flex-1 bg-[#fafbfc] p-3.5 rounded-b-xl">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Connected catalog
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            {/* Medicine Chip */}
            <button
              onClick={() => onViewCatalog?.(customProgram, "medicine")}
              className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-200 rounded-md text-[11.5px] text-slate-600 bg-white hover:border-slate-300 hover:text-slate-900 transition-colors"
              title="View medicine for this visit type"
            >
              <Pill className="h-3 w-3 text-slate-400" />
              <span className="font-semibold text-slate-900 font-mono">{stats.medicine}</span>
              <span>Medicine</span>
            </button>

            {/* Checkout Qs Chip */}
            <button
              onClick={() => onViewCatalog?.(customProgram, "checkout")}
              className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-200 rounded-md text-[11.5px] text-slate-600 bg-white hover:border-slate-300 hover:text-slate-900 transition-colors"
              title="Checkout questions"
            >
              <ShoppingCart className="h-3 w-3 text-slate-400" />
              <span className="font-semibold text-slate-900 font-mono">{stats.checkout}</span>
              <span>
                Checkout Qs{" "}
                {stats.checkout === 0 && (
                  <span className="text-red-500 font-semibold">(none configured)</span>
                )}
              </span>
            </button>

            {/* Labs Chip */}
            <button
              onClick={() => onViewCatalog?.(customProgram, "labs")}
              className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-200 rounded-md text-[11.5px] text-slate-600 bg-white hover:border-slate-300 hover:text-slate-900 transition-colors"
              title="View labs"
            >
              <TestTube className="h-3 w-3 text-slate-400" />
              <span className="font-semibold text-slate-900 font-mono">{stats.labs}</span>
              <span>Labs</span>
            </button>

            {/* Supplies Chip */}
            <button
              onClick={() => onViewCatalog?.(customProgram, "supplies")}
              className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-200 rounded-md text-[11.5px] text-slate-600 bg-white hover:border-slate-300 hover:text-slate-900 transition-colors"
              title="View supplies"
            >
              <Package className="h-3 w-3 text-slate-400" />
              <span className="font-semibold text-slate-900 font-mono">{stats.supplies}</span>
              <span>Supplies</span>
            </button>

            {/* Open Hub Link */}
            <button
              onClick={() => onViewCatalog?.(customProgram, "hub")}
              className="ml-auto inline-flex items-center gap-0.5 px-2 py-1 rounded text-[11px] font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <span>Open hub</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
