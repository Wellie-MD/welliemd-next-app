import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyStateCard } from "../common";
import type { CustomProgram } from "../../types";
import type { CatalogTab, CustomProgramsViewMode } from "../../hooks/useCustomProgramsPage";
import { CustomProgramCard } from "./CustomProgramCard";
import { CustomProgramTable } from "./CustomProgramTable";

interface CustomProgramsContentProps {
  customPrograms: CustomProgram[];
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
  filteredPrograms,
  groupedPrograms,
  viewMode,
  onEdit,
  onDelete,
  onPreview,
  onViewCatalog,
  onClearFilters,
}: CustomProgramsContentProps) {
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
