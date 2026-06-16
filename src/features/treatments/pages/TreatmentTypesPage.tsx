import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterToolbar, TreatmentPageHeader } from "../components/common";
import { TreatmentTypeTable } from "../components/treatment-types/TreatmentTypeTable";
import { useTreatmentTypes, useDeleteTreatmentType } from "../hooks/useTreatmentLibraries";
import { TreatmentTypeModal } from "../components/treatment-types/TreatmentTypeModal";
import { toast } from "@/components/ui/use-toast";

export default function TreatmentTypesPage() {
  const { data: treatmentTypes = [] } = useTreatmentTypes();
  const { mutate: deleteTreatmentType } = useDeleteTreatmentType();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const handleCreate = () => {
    setSelectedKey(null);
    setIsModalOpen(true);
  };

  const handleEdit = (key: string) => {
    setSelectedKey(key);
    setIsModalOpen(true);
  };

  const handleDelete = (key: string) => {
    if (confirm("Are you sure you want to delete this treatment type? This could affect linked programs.")) {
      deleteTreatmentType(key, {
        onSuccess: () => {
          toast({
            title: "Treatment Type Deleted",
            description: "Treatment type has been successfully deleted.",
          });
        },
      });
    }
  };

  return (
    <div className="p-6">
      <TreatmentPageHeader
        title="Treatment Types"
        subtitle="Catalog of treatments and their intake/follow-up visit-type identifiers for Beluga payload routing."
        actions={
          <Button onClick={handleCreate} className="bg-[#12517A] text-white hover:bg-[#12517A]/90">
            <Plus className="mr-2 h-4 w-4" />
            Create Treatment Type
          </Button>
        }
      />
      <FilterToolbar placeholder="Search treatment types" />
      <TreatmentTypeTable
        treatmentTypes={treatmentTypes}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <TreatmentTypeModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        treatmentTypeKey={selectedKey}
      />
    </div>
  );
}
