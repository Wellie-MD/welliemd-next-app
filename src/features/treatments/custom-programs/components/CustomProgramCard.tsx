import { Sparkles, Pill } from "lucide-react";
import type { CustomProgram } from "@/features/treatments/types";
import { isCustomProgramMulti } from "@/features/treatments/custom-programs/hooks/useCustomProgramsPage";
import { cn } from "@/lib/utils";

const uniqueNonEmptyValues = (values: Array<string | undefined>) =>
  Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));

interface CustomProgramCardProps {
  customProgram: CustomProgram;
  onOpenBuilder?: (program: CustomProgram) => void;
  onPreview?: (program: CustomProgram) => void;
}

export function CustomProgramCard({ customProgram, onOpenBuilder, onPreview }: CustomProgramCardProps) {
  const isMulti = isCustomProgramMulti(customProgram);

  const renderIcon = () => {
    const iconClass = "h-[17px] w-[17px]";
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

  const builderTreatmentNames = uniqueNonEmptyValues(
    customProgram.builderTreatmentOptions?.map((item) => item.title) ?? []
  );
  const flowTreatmentNames = uniqueNonEmptyValues(
    customProgram.flowItems.filter((item) => item.kind === "program").map((item) => item.title)
  );
  const includedProgramNames = uniqueNonEmptyValues(customProgram.includedProgramIds);
  const routedTreatmentNames =
    builderTreatmentNames.length > 0
      ? builderTreatmentNames
      : flowTreatmentNames.length > 0
        ? flowTreatmentNames
        : includedProgramNames;
  const routedTreatmentCount = routedTreatmentNames.length;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border transition-all duration-150 hover:shadow-md dark:bg-[#171b27] dark:hover:shadow-none",
        isMulti
          ? "border-pink-200 bg-gradient-to-b from-pink-50/70 via-white to-white dark:border-pink-200/80"
          : "border-slate-200 bg-white dark:border-slate-700"
      )}
    >
      <div
        className={cn(
          "flex items-start justify-between gap-2.5 border-b border-slate-100 p-3.5 dark:border-slate-700",
          isMulti && "dark:border-slate-700 dark:bg-gradient-to-b dark:from-pink-100/85 dark:via-slate-400/65 dark:to-slate-500/40"
        )}
      >
        <div className={getIconFrameClass()}>
          {renderIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 font-semibold text-sm text-slate-900 leading-tight dark:text-slate-50">
            <span>{customProgram.name}</span>
            {isMulti && (
              <span className="rounded-[3px] border border-pink-200 bg-pink-50 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-[#9d174d]">
                Multi
              </span>
            )}
          </div>
          <div className="mt-1 truncate text-[11.5px] text-slate-400 leading-none dark:text-slate-500">
            {customProgram.description}
          </div>
        </div>
      </div>

      <div className="flex h-[120px] shrink-0 flex-col justify-between border-b border-slate-100 bg-white p-3.5 dark:border-slate-700 dark:bg-[#171b27]">
        <div>
          <div className="font-semibold text-[13px] text-slate-900 leading-tight dark:text-slate-50">
            {customProgram.onboardingName || customProgram.name}
          </div>
          <div className="text-[11.5px] text-slate-400 mt-1 dark:text-slate-500">
            {customProgram.runtimeSummary?.status === "ready"
              ? `${customProgram.runtimeSummary.effectiveQuestionCount} patient steps · ${customProgram.runtimeSummary.screeningQuestionCount} screening questions`
              : customProgram.runtimeSummary
                ? `${customProgram.runtimeSummary.screeningQuestionCount} screening questions · republish required`
                : `${customProgram.questionCount || 0} questions`}
            {customProgram.updatedAt && ` · updated ${formatDate(customProgram.updatedAt)}`}
          </div>
        </div>
        <div className="flex gap-1.5 mt-auto">
          <button
            onClick={() => onOpenBuilder?.(customProgram)}
            className="flex-1 inline-flex items-center justify-center text-center py-1.5 px-3 rounded-lg text-[11.5px] font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Open builder
          </button>
          <button
            onClick={() => onPreview?.(customProgram)}
            className="flex-1 inline-flex items-center justify-center text-center py-1.5 px-3 rounded-lg text-[11.5px] font-semibold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Preview
          </button>
        </div>
      </div>

      <div className="flex-1 bg-[#fafbfc] p-3.5 rounded-b-xl dark:bg-[#121620]">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Routes into · {routedTreatmentCount} {routedTreatmentCount === 1 ? "treatment" : "treatments"}
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          {routedTreatmentNames.length > 0 ? (
            routedTreatmentNames.map((name) => (
              <span
                key={name}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11.5px] font-medium text-slate-700 dark:border-slate-700 dark:bg-[#171b27] dark:text-slate-300"
              >
                {name}
              </span>
            ))
          ) : (
            <span className="text-[11.5px] italic text-slate-400 dark:text-slate-500">No routed treatments configured</span>
          )}
          {customProgram.consentIds.length > 0 && (
            <span
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11.5px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-[#171b27] dark:text-slate-300"
            >
              {customProgram.consentIds.length} universal consents
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
