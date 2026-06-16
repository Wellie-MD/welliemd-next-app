import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomProgramCard } from "../components/custom-programs/CustomProgramCard";
import { EmptyStateCard, FilterToolbar, TreatmentPageHeader } from "../components/common";
import { useCustomPrograms } from "../hooks/useTreatmentLibraries";

export default function CustomProgramsPage() {
  const { data: customPrograms = [] } = useCustomPrograms();

  return (
    <div className="p-6">
      <TreatmentPageHeader
        title="Custom Programs"
        subtitle="Customized intake programs for clients: either customized single-treatment flows or multi-treatment routing forms."
        actions={
          <>
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Assign to Client
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Custom Program
            </Button>
          </>
        }
      />
      <FilterToolbar placeholder="Search custom forms by name or type" />
      <div className="grid gap-4">
        {customPrograms.length ? (
          customPrograms.map((customProgram) => (
            <CustomProgramCard key={customProgram.id} customProgram={customProgram} />
          ))
        ) : (
          <EmptyStateCard title="No custom programs yet" description="Create one to compose programs, sections, consents, and checkout." />
        )}
      </div>
    </div>
  );
}
