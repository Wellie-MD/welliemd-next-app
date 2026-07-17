import { useNavigate } from "react-router-dom";
import { DeleteConfirmDialog, TreatmentPageHeader } from "@/features/treatments/common/components";
import { PatientFlowTestModal } from "@/features/treatments/flow-builder/components/modals/PatientFlowTestModal";
import { CatalogConnectionsDialog } from "@/features/treatments/custom-programs/components/CatalogConnectionsDialog";
import { CustomProgramsContent } from "@/features/treatments/custom-programs/components/CustomProgramsContent";
import { CustomProgramModal } from "@/features/treatments/custom-programs/components/CustomProgramModal";
import { CustomProgramsHeaderActions, CustomProgramsToolbar } from "@/features/treatments/custom-programs/components/CustomProgramsToolbar";
import { useCustomProgramsPage } from "@/features/treatments/custom-programs/hooks/useCustomProgramsPage";
import { AssignToClientsModal } from "@/components/shared/AssignToClientsModal";

export default function CustomProgramsPage() {
  const navigate = useNavigate();
  const page = useCustomProgramsPage();

  return (
    <div className="p-6">
      <TreatmentPageHeader
        title="Custom Programs"
        subtitle={<>Customized intake programs for clients — compose programs, sections, consents, and checkout into a tailored patient experience.</>}
        actions={
          <CustomProgramsHeaderActions
            viewMode={page.viewMode}
            onViewModeChange={page.setViewMode}
            onCreate={page.handleCreate}
            onAssign={() => page.setIsAssignOpen(true)}
            onViewHistory={() => navigate("/dashboard/treatments/custom-programs/assignment-history")}
            assignDisabled={page.filteredPrograms.length === 0}
          />
        }
      />

      <CustomProgramsToolbar
        viewMode={page.viewMode}
        filter={page.filter}
        searchQuery={page.searchQuery}
        totalCount={page.customPrograms.length}
        multiCount={page.multiCount}
        singleCount={page.singleCount}
        onViewModeChange={page.setViewMode}
        onFilterChange={page.setFilter}
        onSearchQueryChange={page.setSearchQuery}
        onCreate={page.handleCreate}
      />

      <CustomProgramsContent
        customPrograms={page.customPrograms}
        filteredPrograms={page.filteredPrograms}
        groupedPrograms={page.groupedPrograms}
        viewMode={page.viewMode}
        onEdit={page.handleEdit}
        onDelete={page.handleDelete}
        onPreview={page.handlePreview}
        onViewCatalog={page.handleViewCatalog}
        onClearFilters={page.handleClearFilters}
      />

      <CustomProgramModal open={page.isModalOpen} onOpenChange={page.setIsModalOpen} onSubmit={page.handleCreateOrEditSubmit} program={page.selectedProgram} />

      {page.previewContext && <PatientFlowTestModal open={page.isPreviewOpen} onOpenChange={page.setIsPreviewOpen} previewContext={page.previewContext} />}

      <CatalogConnectionsDialog open={page.isCatalogOpen} onOpenChange={page.setIsCatalogOpen} program={page.catalogProgram} activeTab={page.catalogTab} onTabChange={page.setCatalogTab} />

      <AssignToClientsModal
        open={page.isAssignOpen}
        onOpenChange={page.setIsAssignOpen}
        items={page.assignItems}
        itemLabel="custom program"
        subtitle="Pick custom programs and the client brands that can offer them to their patients."
        onAssign={page.handleAssignCustomPrograms}
      />

      <DeleteConfirmDialog
        open={Boolean(page.deleteCustomProgramId)}
        onOpenChange={(open) => {
          if (!open) page.setDeleteCustomProgramId(null);
        }}
        title="Delete custom program?"
        description="This removes the custom program wrapper and its flow configuration from the library."
        onConfirm={page.confirmDeleteCustomProgram}
      />
    </div>
  );
}
