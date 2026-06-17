import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog, FilterToolbar, TreatmentPageHeader } from "../components/common";
import { TreatmentTypeTable } from "../components/treatment-types/TreatmentTypeTable";
import { useTreatmentTypes, useDeleteTreatmentType } from "../hooks/useTreatmentLibraries";
import { TreatmentTypeModal } from "../components/treatment-types/TreatmentTypeModal";
import { toast } from "@/components/ui/use-toast";

export default function TreatmentTypesPage() {
  const { data: treatmentTypes = [] } = useTreatmentTypes();
  const { mutate: deleteTreatmentType } = useDeleteTreatmentType();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [deleteTreatmentTypeKey, setDeleteTreatmentTypeKey] = useState<string | null>(null);

  const handleCreate = () => {
    setSelectedKey(null);
    setIsModalOpen(true);
  };

  const handleEdit = (key: string) => {
    setSelectedKey(key);
    setIsModalOpen(true);
  };

  const handleDelete = (key: string) => {
    setDeleteTreatmentTypeKey(key);
  };

  const confirmDeleteTreatmentType = () => {
    if (!deleteTreatmentTypeKey) return;
    deleteTreatmentType(deleteTreatmentTypeKey, {
      onSuccess: () => {
        toast({
          title: "Treatment Type Deleted",
          description: "Treatment type has been successfully deleted.",
        });
        setDeleteTreatmentTypeKey(null);
      },
    });
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
      <DeleteConfirmDialog
        open={Boolean(deleteTreatmentTypeKey)}
        onOpenChange={(open) => {
          if (!open) setDeleteTreatmentTypeKey(null);
        }}
        title="Delete treatment type?"
        description="This can affect linked programs, products, and Beluga routing configuration."
        onConfirm={confirmDeleteTreatmentType}
      />
    </div>
  );
}
