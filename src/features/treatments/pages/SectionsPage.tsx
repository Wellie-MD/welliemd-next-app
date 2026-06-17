import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog, FilterToolbar, TreatmentPageHeader } from "../components/common";
import { SectionListTable } from "../components/sections/SectionListTable";
import { SectionModal } from "../components/sections/SectionModal";
import { useSections, useDeleteSection } from "../hooks/useTreatmentLibraries";
import { toast } from "@/components/ui/use-toast";
import type { CommonSection } from "../types";

export default function SectionsPage() {
  const { data: sections = [] } = useSections();
  const { mutate: deleteSection } = useDeleteSection();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<CommonSection | null>(null);
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);

  const handleEdit = (section: CommonSection) => {
    setSelectedSection(section);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteSectionId(id);
  };

  const confirmDeleteSection = () => {
    if (!deleteSectionId) return;
    deleteSection(deleteSectionId, {
      onSuccess: () => {
        toast({
          title: "Section Deleted",
          description: "Section has been successfully deleted.",
        });
        setDeleteSectionId(null);
      },
    });
  };

  return (
    <div className="p-6">
      <TreatmentPageHeader
        title="Common Sections"
        subtitle="Reusable patient data sections referenced across custom forms."
        actions={
          <Button
            onClick={() => {
              setSelectedSection(null);
              setIsModalOpen(true);
            }}
            className="bg-[#12517A] text-white hover:bg-[#12517A]/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Section
          </Button>
        }
      />
      <FilterToolbar placeholder="Search sections by name or scope" />
      <SectionListTable
        sections={sections}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <SectionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        section={selectedSection}
      />
      <DeleteConfirmDialog
        open={Boolean(deleteSectionId)}
        onOpenChange={(open) => {
          if (!open) setDeleteSectionId(null);
        }}
        title="Delete section?"
        description="This removes the common section from the library. Custom programs using it may need review."
        onConfirm={confirmDeleteSection}
      />
    </div>
  );
}
