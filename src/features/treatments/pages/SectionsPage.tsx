import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterToolbar, TreatmentPageHeader } from "../components/common";
import { SectionListTable } from "../components/sections/SectionListTable";
import { useSections } from "../hooks/useTreatmentLibraries";

export default function SectionsPage() {
  const { data: sections = [] } = useSections();

  return (
    <div className="p-6">
      <TreatmentPageHeader
        title="Common Sections"
        subtitle="Reusable patient data sections referenced across custom forms."
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Section
          </Button>
        }
      />
      <FilterToolbar placeholder="Search sections by name or scope" />
      <SectionListTable sections={sections} />
    </div>
  );
}
