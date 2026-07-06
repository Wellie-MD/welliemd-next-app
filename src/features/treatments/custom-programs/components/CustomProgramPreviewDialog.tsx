import { useMemo } from "react";
import { PatientPreviewDialog } from "@/features/treatments/common/components";
import { getCustomProgramEffectiveSlug } from "@/features/treatments/custom-programs/utils/customProgramSlug";
import { buildQuestionnairePreviewUrl } from "@/features/treatments/utils/previewUrl";
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
      }),
    [customProgram]
  );

  const previewName = customProgram.onboardingName || customProgram.name;

  return (
    <PatientPreviewDialog
      open={open}
      onOpenChange={onOpenChange}
      previewUrl={previewUrl}
      subtitle={`${previewName} · how patients see this intake`}
      iframeTitle={`${previewName} questionnaire preview`}
    />
  );
}
