import { QuestionnairePreviewDialog } from "@/features/treatments/preview/components/QuestionnairePreviewDialog";
import type { PreviewContext } from "@/features/treatments/types";

interface PatientFlowInlineSimulatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewContext: PreviewContext;
}

/** Route question-editor flow tests through the canonical capability preview. */
export function PatientFlowInlineSimulator({
  open,
  onOpenChange,
  previewContext,
}: PatientFlowInlineSimulatorProps) {
  return (
    <QuestionnairePreviewDialog
      open={open}
      onOpenChange={onOpenChange}
      previewContext={previewContext}
      subtitle="Capability preview in the containing Program context"
    />
  );
}
