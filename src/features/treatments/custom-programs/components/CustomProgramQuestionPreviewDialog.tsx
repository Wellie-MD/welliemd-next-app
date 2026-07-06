import { useMemo } from "react";
import { PatientPreviewDialog } from "@/features/treatments/common/components";
import { getCustomProgramEffectiveSlug } from "@/features/treatments/custom-programs/utils/customProgramSlug";
import { buildQuestionnairePreviewUrl } from "@/features/treatments/utils/previewUrl";
import type { CustomProgram, CustomProgramBuilderStageItem } from "@/features/treatments/types";

interface CustomProgramQuestionPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customProgram: CustomProgram;
  question: CustomProgramBuilderStageItem;
  questionNumber: number;
}

export function CustomProgramQuestionPreviewDialog({
  open,
  onOpenChange,
  customProgram,
  question,
  questionNumber,
}: CustomProgramQuestionPreviewDialogProps) {
  const previewName = customProgram.onboardingName || customProgram.name;
  const previewUrl = useMemo(() => {
    const baseUrl = buildQuestionnairePreviewUrl({
      type: "custom_program",
      id: customProgram.id,
      slug: getCustomProgramEffectiveSlug(customProgram),
    });
    try {
      const url = new URL(baseUrl);
      url.searchParams.set("question_id", question.id);
      return url.toString();
    } catch {
      const separator = baseUrl.includes("?") ? "&" : "?";
      return `${baseUrl}${separator}question_id=${encodeURIComponent(question.id)}`;
    }
  }, [customProgram, question]);

  return (
    <PatientPreviewDialog
      open={open}
      onOpenChange={onOpenChange}
      previewUrl={previewUrl}
      previewTitle={`Question ${questionNumber}`}
      subtitle={`${previewName} · ${question.title}`}
      iframeTitle={`Question ${questionNumber} preview`}
    />
  );
}
