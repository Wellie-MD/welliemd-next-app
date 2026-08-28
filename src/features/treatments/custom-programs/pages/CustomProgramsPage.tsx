import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog, TreatmentPageHeader } from "@/features/treatments/common/components";
import { QuestionnairePreviewDialog } from "@/features/treatments/preview/components/QuestionnairePreviewDialog";
import { CatalogConnectionsDialog } from "@/features/treatments/custom-programs/components/CatalogConnectionsDialog";
import { CustomProgramsContent } from "@/features/treatments/custom-programs/components/CustomProgramsContent";
import { CustomProgramModal } from "@/features/treatments/custom-programs/components/CustomProgramModal";
import { CustomProgramsHeaderActions, CustomProgramsToolbar } from "@/features/treatments/custom-programs/components/CustomProgramsToolbar";
import { useCustomProgramsPage } from "@/features/treatments/custom-programs/hooks/useCustomProgramsPage";
import { TreatmentAssignmentModal } from "@/features/treatments/assignment/components/TreatmentAssignmentModal";
import { ASSIGNMENT_SOURCE } from "@/features/treatments/assignment/constants";

export default function CustomProgramsPage() {
  const navigate = useNavigate();
  const page = useCustomProgramsPage();

  if (page.isLoading && page.customPrograms.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin mr-2 text-slate-500" />
          <p className="text-sm text-slate-600">Loading custom programs and page data...</p>
        </div>
      </div>
    );
  }

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
        isLoading={page.isLoading}
        isError={page.isError}
        error={page.error}
        onRetry={() => void page.refetch()}
        filteredPrograms={page.filteredPrograms}
        pagedPrograms={page.pagedPrograms}
        pagedGroupedPrograms={page.pagedGroupedPrograms}
        viewMode={page.viewMode}
        onEdit={page.handleEdit}
        onDelete={page.handleDelete}
        onPreview={page.handlePreview}
        onViewCatalog={page.handleViewCatalog}
        onClearFilters={page.handleClearFilters}
      />

      {page.filteredPrograms.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            Showing {(page.page - 1) * page.pageSize + 1}–{Math.min(page.page * page.pageSize, page.filteredPrograms.length)} of{" "}
            {page.filteredPrograms.length} custom programs
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => page.setPage((current) => Math.max(1, current - 1))}
              disabled={page.page === 1}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <span className="min-w-24 text-center text-sm text-slate-600">
              Page {page.page} of {page.totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => page.setPage((current) => Math.min(page.totalPages, current + 1))}
              disabled={page.page === page.totalPages}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <CustomProgramModal open={page.isModalOpen} onOpenChange={page.setIsModalOpen} onSubmit={page.handleCreateOrEditSubmit} program={page.selectedProgram} />

      {page.previewContext && (
        <QuestionnairePreviewDialog
          open={page.isPreviewOpen}
          onOpenChange={page.setIsPreviewOpen}
          previewContext={page.previewContext}
          subtitle={`Patient view of "${page.previewContext.name || page.previewContext.slug}"`}
        />
      )}

      <CatalogConnectionsDialog open={page.isCatalogOpen} onOpenChange={page.setIsCatalogOpen} program={page.catalogProgram} activeTab={page.catalogTab} onTabChange={page.setCatalogTab} />

      <TreatmentAssignmentModal
        open={page.isAssignOpen}
        onOpenChange={page.setIsAssignOpen}
        items={page.assignItems}
        itemLabel="custom program"
        sourceKind={ASSIGNMENT_SOURCE.customProgram}
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
