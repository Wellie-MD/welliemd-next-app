import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsentListTable } from "@/features/treatments/libraries/consents/components/ConsentListTable";
import {
  ConsentsToolbar,
  type ConsentScopeFilter,
} from "@/features/treatments/libraries/consents/components/ConsentsToolbar";
import { DeleteConfirmDialog, TreatmentPageHeader } from "@/features/treatments/common/components";
import { useConsents, useDeleteConsent, useArchiveConsent } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { ConsentEditModal } from "@/features/treatments/libraries/consents/components/ConsentEditModal";
import { ConsentDetailModal } from "@/features/treatments/libraries/consents/components/ConsentDetailModal";
import { ConsentPatientPreviewModal } from "@/features/treatments/libraries/consents/components/ConsentPatientPreviewModal";
import { formatScope } from "@/features/treatments/utils/labels";
import { exportToCSV } from "@/utils/exportUtils";
import { toast } from "@/components/ui/use-toast";

export default function ConsentsPage() {
  const { data: consents = [] } = useConsents();
  const { mutate: deleteConsent } = useDeleteConsent();
  const { mutate: archiveConsent } = useArchiveConsent();

  const [scopeFilter, setScopeFilter] = useState<ConsentScopeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedConsentId, setSelectedConsentId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailConsentId, setDetailConsentId] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewConsentId, setPreviewConsentId] = useState<string | null>(null);
  const [deleteConsentId, setDeleteConsentId] = useState<string | null>(null);

  const filteredConsents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return consents.filter((consent) => {
      if (consent.isArchived) return false;

      const matchesScope =
        scopeFilter === "all" ||
        (scopeFilter === "global" && consent.scope === "global") ||
        (scopeFilter === "treatment" && consent.scope !== "global");

      if (!matchesScope) return false;
      if (!query) return true;

      const haystack = [
        consent.name,
        formatScope(consent.scope),
        ...consent.visitTypeKeys,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [consents, scopeFilter, searchQuery]);

  const handleCreate = () => {
    setSelectedConsentId(null);
    setIsEditModalOpen(true);
  };

  const handleEdit = (id: string) => {
    setSelectedConsentId(id);
    setIsEditModalOpen(true);
  };

  const handleViewDetail = (id: string) => {
    setDetailConsentId(id);
    setIsDetailModalOpen(true);
  };

  const handlePatientPreview = (id: string) => {
    setPreviewConsentId(id);
    setIsPreviewModalOpen(true);
  };

  const handleResetFilters = () => {
    setScopeFilter("all");
    setSearchQuery("");
  };

  const handleExport = () => {
    if (filteredConsents.length === 0) return;
    exportToCSV(
      filteredConsents.map((consent) => ({
        name: consent.name,
        scope: formatScope(consent.scope),
        visitTypes: consent.visitTypeKeys.length ? consent.visitTypeKeys.join(" | ") : "All",
        updatedAt: consent.updatedAt,
      })),
      [
        { key: "name", label: "Name" },
        { key: "scope", label: "Scope" },
        { key: "visitTypes", label: "Visit Type" },
        { key: "updatedAt", label: "Last Updated" },
      ],
      "consent_forms"
    );
    toast({
      title: "Export started",
      description: `Exporting ${filteredConsents.length} consent form${filteredConsents.length === 1 ? "" : "s"} to CSV.`,
    });
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

  const handleArchive = (id: string) => {
    const consent = consents.find((c) => c.id === id);
    archiveConsent(id, {
      onSuccess: () => {
        toast({
          title: "Consent Archived",
          description: consent ? `"${consent.name}" has been archived.` : "Consent has been archived.",
        });
      },
      onError: (error: unknown) => {
        const message =
          (error as any)?.response?.data?.detail ||
          (error as any)?.response?.data?.error ||
          (error as any)?.message ||
          "Failed to archive consent";
        toast({
          title: "Cannot Archive",
          description: message,
          variant: "destructive",
        });
      },
    });
  };

  const activeDetailConsent = consents.find((c) => c.id === detailConsentId);
  const activePreviewConsent = consents.find((c) => c.id === previewConsentId);

  return (
    <div className="p-6">
      <TreatmentPageHeader
        title="Consent Forms"
        subtitle="Legal documents shown to patients. Global consents appear on every visit; Treatment Specific consents are conditionally shown."
        actions={
          <Button onClick={handleCreate} className="bg-[#12517A] text-white hover:bg-[#12517A]/90" data-testid="create-consent">
            <Plus className="mr-2 h-4 w-4" />
            Create Consent
          </Button>
        }
      />

      <ConsentsToolbar
        scopeFilter={scopeFilter}
        onScopeFilterChange={setScopeFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onReset={handleResetFilters}
        onExport={handleExport}
        resultCount={filteredConsents.length}
      />

      <ConsentListTable
        consents={filteredConsents}
        onEdit={handleEdit}
        onViewDetail={handleViewDetail}
        onPatientPreview={handlePatientPreview}
        onDelete={setDeleteConsentId}
        onArchive={handleArchive}
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

      <ConsentPatientPreviewModal
        open={isPreviewModalOpen}
        onOpenChange={setIsPreviewModalOpen}
        consent={activePreviewConsent}
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
