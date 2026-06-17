import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsentListTable } from "../components/consents/ConsentListTable";
import { DeleteConfirmDialog, FilterToolbar, TreatmentPageHeader } from "../components/common";
import { useConsents, useDeleteConsent } from "../hooks/useTreatmentLibraries";
import { ConsentEditModal } from "../components/consents/ConsentEditModal";
import { ConsentDetailModal } from "../components/consents/ConsentDetailModal";
import { toast } from "@/components/ui/use-toast";

export default function ConsentsPage() {
  const { data: consents = [] } = useConsents();
  const { mutate: deleteConsent } = useDeleteConsent();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedConsentId, setSelectedConsentId] = useState<string | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailConsentId, setDetailConsentId] = useState<string | null>(null);
  const [deleteConsentId, setDeleteConsentId] = useState<string | null>(null);

  const handleCreate = () => {
    setSelectedConsentId(null);
    setIsEditModalOpen(true);
  };

  const handleEdit = (id: string) => {
    setSelectedConsentId(id);
    setIsEditModalOpen(true);
  };

  const handlePreview = (id: string) => {
    setDetailConsentId(id);
    setIsDetailModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConsentId(id);
  };

  const confirmDeleteConsent = () => {
    if (!deleteConsentId) return;
    deleteConsent(deleteConsentId, {
      onSuccess: () => {
        toast({
          title: "Consent Deleted",
          description: "Consent form has been successfully deleted.",
        });
        setDeleteConsentId(null);
      },
    });
  };

  const activeDetailConsent = consents.find(c => c.id === detailConsentId);

  return (
    <div className="p-6">
      <TreatmentPageHeader
        title="Consent Forms"
        subtitle="Global and treatment-specific consent forms used across Programs and Custom Programs."
        actions={
          <Button onClick={handleCreate} className="bg-[#12517A] text-white hover:bg-[#12517A]/90">
            <Plus className="mr-2 h-4 w-4" />
            Create Consent
          </Button>
        }
      />
      <FilterToolbar placeholder="Search consents by name or scope" />
      <ConsentListTable
        consents={consents}
        onEdit={handleEdit}
        onPreview={handlePreview}
        onDelete={handleDelete}
      />

      <ConsentEditModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        consentId={selectedConsentId}
      />

      <ConsentDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        consent={activeDetailConsent}
        onEdit={handleEdit}
      />
      <DeleteConfirmDialog
        open={Boolean(deleteConsentId)}
        onOpenChange={(open) => {
          if (!open) setDeleteConsentId(null);
        }}
        title="Delete consent form?"
        description="This removes the consent from the library. Programs and custom programs using it may need review."
        onConfirm={confirmDeleteConsent}
      />
    </div>
  );
}
