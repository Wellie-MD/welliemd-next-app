import { AlertCircle, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyStateCard } from "@/features/treatments/common/components";
import type { CustomProgram } from "@/features/treatments/types";
import type { CatalogTab, CustomProgramsViewMode } from "@/features/treatments/custom-programs/hooks/useCustomProgramsPage";
import { CustomProgramCard } from "./CustomProgramCard";
import { CustomProgramTable } from "./CustomProgramTable";

interface CustomProgramsContentProps {
  customPrograms: CustomProgram[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  filteredPrograms: CustomProgram[];
  groupedPrograms: { multi: CustomProgram[]; single: CustomProgram[] };
  viewMode: CustomProgramsViewMode;
  onEdit: (program: CustomProgram) => void;
  onDelete: (id: string) => void;
  onPreview: (program: CustomProgram) => void;
  onViewCatalog: (program: CustomProgram, tab: CatalogTab) => void;
  onClearFilters: () => void;
}

function ProgramGroup({
  title,
  description,
  programs,
  onEdit,
  onDelete,
  onPreview,
  onViewCatalog,
}: {
  title: string;
  description: string;
  programs: CustomProgram[];
  onEdit: (program: CustomProgram) => void;
  onDelete: (id: string) => void;
  onPreview: (program: CustomProgram) => void;
  onViewCatalog: (program: CustomProgram, tab: CatalogTab) => void;
}) {
  if (programs.length === 0) return null;
  return (
    <div>
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          {title}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-600">{programs.length}</span>
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {programs.map((customProgram) => (
          <CustomProgramCard key={customProgram.id} customProgram={customProgram} onEdit={onEdit} onDelete={onDelete} onPreview={onPreview} onViewCatalog={onViewCatalog} />
        ))}
      </div>
    </div>
  );
}

export function CustomProgramsContent({
  customPrograms,
  isLoading,
  isError,
  error,
  onRetry,
  filteredPrograms,
  groupedPrograms,
  viewMode,
  onEdit,
  onDelete,
  onPreview,
  onViewCatalog,
  onClearFilters,
}: CustomProgramsContentProps) {
  if (isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-xl border border-slate-200 bg-white">
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-slate-500" />
        <span className="text-sm text-slate-600">Loading custom programs...</span>
      </div>
    );
  }

  if (isError) {
    const message = error instanceof Error ? error.message : "The custom-program library could not be loaded.";
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
        <h3 className="mt-3 text-sm font-semibold text-red-900">Custom programs failed to load</h3>
        <p className="mt-1 text-xs text-red-700">{message}</p>
        <Button onClick={onRetry} variant="outline" className="mt-4 bg-white text-xs">
          Try again
        </Button>
      </div>
    );
  }

  if (customPrograms.length === 0) {
    return <EmptyStateCard title="No custom programs yet" description="Create one to compose programs, sections, consents, and checkout." />;
  }

  if (filteredPrograms.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-16 text-center shadow-sm">
        <Search className="mx-auto h-8 w-8 text-slate-400 opacity-60" />
        <h3 className="mt-4 text-sm font-semibold text-slate-900">No custom forms match.</h3>
        <p className="mt-1 text-xs text-slate-500">Refine your search queries or filter selections.</p>
        <Button onClick={onClearFilters} variant="outline" className="mt-4 text-xs" data-testid="clear-custom-program-filters">
          Clear filters
        </Button>
      </div>
    );
  }

  if (viewMode === "list") {
    return <CustomProgramTable customPrograms={filteredPrograms} onEdit={onEdit} onDelete={onDelete} onPreview={onPreview} />;
  }

  return (
    <div className="space-y-8">
      <ProgramGroup
        title="Multi-treatment forms"
        description="Route patients to one or more treatments based on their answers"
        programs={groupedPrograms.multi}
        onEdit={onEdit}
        onDelete={onDelete}
        onPreview={onPreview}
        onViewCatalog={onViewCatalog}
      />
      <ProgramGroup
        title="Single-treatment forms"
        description="Each form customizes one treatment with its own eligibility screening"
        programs={groupedPrograms.single}
        onEdit={onEdit}
        onDelete={onDelete}
        onPreview={onPreview}
        onViewCatalog={onViewCatalog}
      />
    </div>
  );
}
