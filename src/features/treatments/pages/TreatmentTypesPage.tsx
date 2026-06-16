import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterToolbar, TreatmentPageHeader } from "../components/common";
import { TreatmentTypeTable } from "../components/treatment-types/TreatmentTypeTable";
import { useTreatmentTypes } from "../hooks/useTreatmentLibraries";

export default function TreatmentTypesPage() {
  const { data: treatmentTypes = [] } = useTreatmentTypes();

  return (
    <div className="p-6">
      <TreatmentPageHeader
        title="Treatment Types"
        subtitle="Catalog of treatments and their intake/follow-up visit-type identifiers for Beluga payload routing."
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Treatment Type
          </Button>
        }
      />
      <FilterToolbar placeholder="Search treatment types" />
      <TreatmentTypeTable treatmentTypes={treatmentTypes} />
    </div>
  );
}
