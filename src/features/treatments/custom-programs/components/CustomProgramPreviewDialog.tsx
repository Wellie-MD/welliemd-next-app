import { useMemo } from "react";
import { QuestionnairePreviewDialog } from "@/features/treatments/preview/components/QuestionnairePreviewDialog";
import { getCustomProgramEffectiveSlug } from "@/features/treatments/custom-programs/utils/customProgramSlug";
import {
  buildQuestionnairePreviewUrl,
  getQuestionnairePreviewApiBaseUrl,
} from "@/features/treatments/utils/previewUrl";
import type { CustomProgram } from "@/features/treatments/types";

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
  const previewUrl = useMemo(
    () =>
      buildQuestionnairePreviewUrl({
        type: "custom_program",
        id: customProgram.id,
        slug: getCustomProgramEffectiveSlug(customProgram),
        apiBaseUrl: getQuestionnairePreviewApiBaseUrl(),
      }),
    [customProgram]
  );

  const previewName = customProgram.onboardingName || customProgram.name;

  return (
    <QuestionnairePreviewDialog
      open={open}
      onOpenChange={onOpenChange}
      previewUrl={previewUrl}
      subtitle={`${previewName} · how patients see this intake`}
      iframeTitle={`${previewName} questionnaire preview`}
    />
  );
}
