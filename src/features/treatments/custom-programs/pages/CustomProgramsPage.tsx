import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { showFloatingToast } from "@/components/ui/floating-toast";
import { TreatmentPageHeader } from "@/features/treatments/common/components";
import { getTreatmentApiErrorMessage } from "@/features/treatments/common/utils/apiError";
import { isDuplicateSlugError, showDuplicateSlugToast } from "@/features/treatments/common/utils/slugError";
import { CustomProgramsContent } from "@/features/treatments/custom-programs/components/CustomProgramsContent";
import { CustomProgramPreviewDialog } from "@/features/treatments/custom-programs/components/CustomProgramPreviewDialog";
import { CustomProgramsToolbar } from "@/features/treatments/custom-programs/components/CustomProgramsToolbar";
import { useCustomProgramsPage } from "@/features/treatments/custom-programs/hooks/useCustomProgramsPage";
import {
  getCustomProgramEffectiveSlug,
  normalizeCustomProgramSlug,
} from "@/features/treatments/custom-programs/utils/customProgramSlug";
import { usePrograms, useUpdateCustomProgramSlugOverride } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { useClients } from "@/hooks/useClients";
import type { CustomProgram } from "@/features/treatments/types";
import { buildQuestionnaireRuntimeUrl } from "@/features/treatments/utils/questionnaireRuntimeUrl";

export default function CustomProgramsPage() {
  const navigate = useNavigate();
  const page = useCustomProgramsPage();
  const { currentClient } = useClients();
  const { data: programs = [] } = usePrograms();
  const updateSlugMutation = useUpdateCustomProgramSlugOverride();
  const [previewProgram, setPreviewProgram] = useState<CustomProgram | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const questionnaireBaseUrl = useMemo(() => {
    const base = currentClient?.resolved_questionnaire_url || currentClient?.questionnaire_url;
    return base ? base.replace(/\/+$/, "") : "";
  }, [currentClient]);

  if (page.isLoading && page.customPrograms.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin mr-2 text-slate-500" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading custom programs and page data...</p>
        </div>
      </div>
    );
  }

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
    if (!questionnaireBaseUrl) {
      showFloatingToast({ title: "Questionnaire URL is not configured for this client" });
      return;
    }
    const startUrl = buildQuestionnaireRuntimeUrl({
      baseUrl: questionnaireBaseUrl,
      platformClientId: currentClient?.platform_client_id,
      route: "start",
      slug: getCustomProgramEffectiveSlug(program),
    });
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(startUrl);
      showFloatingToast({ title: "Intake URL Copied" });
    }
  };

  const handleSaveSlug = async (program: CustomProgram, slugOverride: string) => {
    const nextSlug = normalizeCustomProgramSlug(slugOverride || getCustomProgramEffectiveSlug(program));

    try {
      await updateSlugMutation.mutateAsync({
        customProgramId: program.id,
        slugOverride: nextSlug,
      });
      showFloatingToast({ title: "Slug Updated" });
    } catch (error) {
      if (isDuplicateSlugError(error)) {
        showDuplicateSlugToast();
      } else {
        showFloatingToast({
          title: getTreatmentApiErrorMessage(error, "Slug could not be updated"),
        });
      }
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
        programs={programs}
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
