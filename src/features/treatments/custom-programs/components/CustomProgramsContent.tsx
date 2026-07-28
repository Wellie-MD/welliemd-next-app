import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyStateCard } from "@/features/treatments/common/components";
import type { CustomProgram } from "@/features/treatments/types";
import type { CustomProgramsViewMode } from "@/features/treatments/custom-programs/hooks/useCustomProgramsPage";
import { CustomProgramCard } from "./CustomProgramCard";
import { CustomProgramTable } from "./CustomProgramTable";

interface CustomProgramsContentProps {
  customPrograms: CustomProgram[];
  filteredPrograms: CustomProgram[];
  groupedPrograms: { multi: CustomProgram[]; single: CustomProgram[] };
  viewMode: CustomProgramsViewMode;
  onOpenBuilder?: (program: CustomProgram) => void;
  onPreview?: (program: CustomProgram) => void;
  onCopyStartUrl?: (program: CustomProgram) => void;
  onSaveSlug?: (program: CustomProgram, slugOverride: string) => Promise<void> | void;
  onClearFilters: () => void;
}

function ProgramGroup({
  title,
  description,
  programs,
  onOpenBuilder,
  onPreview,
}: {
  title: string;
  description: string;
  programs: CustomProgram[];
  onOpenBuilder?: (program: CustomProgram) => void;
  onPreview?: (program: CustomProgram) => void;
}) {
  if (programs.length === 0) return null;
  return (
    <div>
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-50">
          {title}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">{programs.length}</span>
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {programs.map((customProgram) => (
          <CustomProgramCard
            key={customProgram.id}
            customProgram={customProgram}
            onOpenBuilder={onOpenBuilder}
            onPreview={onPreview}
          />
        ))}
      </div>
    </div>
  );
}

export function CustomProgramsContent({
  customPrograms,
  filteredPrograms,
  groupedPrograms,
  viewMode,
  onOpenBuilder,
  onPreview,
  onCopyStartUrl,
  onSaveSlug,
  onClearFilters,
}: CustomProgramsContentProps) {
  if (customPrograms.length === 0) {
    return <EmptyStateCard title="No custom programs yet" description="Customize intake programs for clients." />;
  }

  if (filteredPrograms.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-16 text-center shadow-sm dark:border-slate-700 dark:bg-[#171b27] dark:shadow-none">
        <Search className="mx-auto h-8 w-8 text-slate-400 opacity-60" />
        <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">No custom forms match.</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Refine your search queries or filter selections.</p>
        <Button onClick={onClearFilters} variant="outline" className="mt-4 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800" data-testid="clear-custom-program-filters">
          Clear filters
        </Button>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <CustomProgramTable
        customPrograms={filteredPrograms}
        onOpenBuilder={onOpenBuilder}
        onPreview={onPreview}
        onCopyStartUrl={onCopyStartUrl}
        onSaveSlug={onSaveSlug}
      />
    );
  }

  return (
    <div className="space-y-8">
      <ProgramGroup
        title="Multi-treatment forms"
        description="Route patients to one or more treatments based on their answers"
        programs={groupedPrograms.multi}
        onOpenBuilder={onOpenBuilder}
        onPreview={onPreview}
      />
      <ProgramGroup
        title="Single-treatment forms"
        description="Each form customizes one treatment with its own eligibility screening"
        programs={groupedPrograms.single}
        onOpenBuilder={onOpenBuilder}
        onPreview={onPreview}
      />
    </div>
  );
}
