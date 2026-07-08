import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { showFloatingToast } from "@/components/ui/floating-toast";
import { TreatmentPageHeader } from "@/features/treatments/common/components";
import { getTreatmentApiErrorMessage } from "@/features/treatments/common/utils/apiError";
import { CustomProgramsContent } from "@/features/treatments/custom-programs/components/CustomProgramsContent";
import { CustomProgramPreviewDialog } from "@/features/treatments/custom-programs/components/CustomProgramPreviewDialog";
import { CustomProgramsToolbar } from "@/features/treatments/custom-programs/components/CustomProgramsToolbar";
import { useCustomProgramsPage } from "@/features/treatments/custom-programs/hooks/useCustomProgramsPage";
import { getCustomProgramEffectiveSlug } from "@/features/treatments/custom-programs/utils/customProgramSlug";
import { useUpdateCustomProgramSlugOverride } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import type { CustomProgram } from "@/features/treatments/types";

export default function CustomProgramsPage() {
  const navigate = useNavigate();
  const page = useCustomProgramsPage();
  const updateSlugMutation = useUpdateCustomProgramSlugOverride();
  const [previewProgram, setPreviewProgram] = useState<CustomProgram | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleOpenBuilder = (program: CustomProgram) => {
    navigate(`/dashboard/treatments/custom-programs/${program.id}/builder`);
  };

  const handlePreview = (program: CustomProgram) => {
    setPreviewProgram(program);
    setIsPreviewOpen(true);
  };

  const handlePreviewOpenChange = (open: boolean) => {
    setIsPreviewOpen(open);
    if (!open) setPreviewProgram(null);
  };

  const handleCopyStartUrl = async (program: CustomProgram) => {
    const startUrl = `welliemd.com/start/${getCustomProgramEffectiveSlug(program)}`;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(startUrl);
    }
  };

  const handleSaveSlug = async (program: CustomProgram, slugOverride: string) => {
    try {
      await updateSlugMutation.mutateAsync({
        customProgramId: program.id,
        slugOverride: slugOverride || getCustomProgramEffectiveSlug(program),
      });
      showFloatingToast({ title: "Slug Updated" });
    } catch (error) {
      showFloatingToast({
        title: getTreatmentApiErrorMessage(error, "Slug could not be updated"),
      });
      throw error;
    }
  };

  return (
    <div className="min-h-full bg-[#f8fafc] p-6 dark:bg-[#0f1117]">
      <TreatmentPageHeader
        title="Custom Programs"
        subtitle={
          <>
            Custom intake programs WellieMD built and assigned to your brand — multi-treatment routing forms that
            compose treatments into a tailored patient experience. Treatments themselves live in <span className="font-semibold">Programs</span>; you can add your own questions to the intake.
          </>
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
      />

      <CustomProgramsContent
        customPrograms={page.customPrograms}
        filteredPrograms={page.filteredPrograms}
        groupedPrograms={page.groupedPrograms}
        viewMode={page.viewMode}
        onOpenBuilder={handleOpenBuilder}
        onPreview={handlePreview}
        onCopyStartUrl={handleCopyStartUrl}
        onSaveSlug={handleSaveSlug}
        onClearFilters={page.handleClearFilters}
      />

      {previewProgram && (
        <CustomProgramPreviewDialog
          open={isPreviewOpen}
          onOpenChange={handlePreviewOpenChange}
          customProgram={previewProgram}
        />
      )}
    </div>
  );
}
