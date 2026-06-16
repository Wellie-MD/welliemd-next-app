import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterToolbar, TreatmentPageHeader } from "../components/common";
import { ProgramListTable } from "../components/programs/ProgramListTable";
import { usePrograms } from "../hooks/useTreatmentLibraries";

export default function ProgramsPage() {
  const { data: programs = [] } = usePrograms();

  return (
    <div className="p-6">
      <TreatmentPageHeader
        title="Programs"
        subtitle="Clinical questionnaires linked to specific treatments. Each treatment has an intake module and optionally one or more follow-up modules."
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Program
          </Button>
        }
      />
      <FilterToolbar placeholder="Search treatments..." />
      <ProgramListTable programs={programs} />
    </div>
  );
}
