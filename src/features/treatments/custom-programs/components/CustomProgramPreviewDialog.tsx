import { QuestionnairePreviewDialog } from "@/features/treatments/preview/components/QuestionnairePreviewDialog";
import { getCustomProgramEffectiveSlug } from "@/features/treatments/custom-programs/utils/customProgramSlug";
import { getQuestionnairePreviewApiBaseUrl } from "@/features/treatments/utils/previewUrl";
import type { CustomProgram } from "@/features/treatments/types";
import { useBranding } from "@/contexts/BrandingContext";

interface CustomProgramPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customProgram: CustomProgram;
}

export function CustomProgramPreviewDialog({
  open,
  onOpenChange,
  customProgram,
}: CustomProgramPreviewDialogProps) {
  const { brandSettings } = useBranding();
  const previewName = customProgram.onboardingName || customProgram.name;

  return (
    <QuestionnairePreviewDialog
      open={open}
      onOpenChange={onOpenChange}
      previewContext={{
        type: "custom_program",
        id: customProgram.id,
        slug: getCustomProgramEffectiveSlug(customProgram),
        apiBaseUrl: getQuestionnairePreviewApiBaseUrl(),
        clientId: brandSettings?.clientId,
        clientName: brandSettings?.clientName,
      }}
      subtitle={`${previewName} · how patients see this intake`}
      iframeTitle={`${previewName} questionnaire preview`}
    />
  );
}
