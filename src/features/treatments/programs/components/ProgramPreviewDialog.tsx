import { QuestionnairePreviewDialog } from "@/features/treatments/preview/components/QuestionnairePreviewDialog";
import type { Program } from "@/features/treatments/types";
import { getQuestionnairePreviewApiBaseUrl } from "@/features/treatments/utils/previewUrl";

interface ProgramPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: Program;
}

export function ProgramPreviewDialog({
  open,
  onOpenChange,
  program,
}: ProgramPreviewDialogProps) {
  return (
    <QuestionnairePreviewDialog
      open={open}
      onOpenChange={onOpenChange}
      previewContext={{
        type: "program",
        id: program.id,
        slug: program.slug,
        visitType: program.visitType,
        templateId: program.sourceQuestionnaireTemplateId,
        apiBaseUrl: getQuestionnairePreviewApiBaseUrl(),
      }}
      subtitle={`${program.name} · patient view`}
      iframeTitle={`${program.name} questionnaire preview`}
    />
  );
}
