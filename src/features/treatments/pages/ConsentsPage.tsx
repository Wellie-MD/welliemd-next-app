import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsentListTable } from "../components/consents/ConsentListTable";
import { FilterToolbar, TreatmentPageHeader } from "../components/common";
import { useConsents } from "../hooks/useTreatmentLibraries";

export default function ConsentsPage() {
  const { data: consents = [] } = useConsents();

  return (
    <div className="p-6">
      <TreatmentPageHeader
        title="Consent Forms"
        subtitle="Global and treatment-specific consent forms used across Programs and Custom Programs."
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Consent
          </Button>
        }
      />
      <FilterToolbar placeholder="Search consents by name or scope" />
      <ConsentListTable consents={consents} />
    </div>
  );
}
