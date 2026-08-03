import { QuestionnairePreviewDialog } from "@/features/treatments/preview/components/QuestionnairePreviewDialog";
import type { PreviewContext } from "@/features/treatments/types";

interface PatientFlowTestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewContext: PreviewContext;
}

/**
 * Compatibility wrapper for builder callers.
 *
 * The previous modal constructed a mutable query-string simulator URL. All
 * Program and Custom Program callers now issue an immutable preview capability
 * through the shared questionnaire dialog.
 */
export function PatientFlowTestModal({
  open,
  onOpenChange,
  previewContext,
}: PatientFlowTestModalProps) {
  return (
    <QuestionnairePreviewDialog
      open={open}
      onOpenChange={onOpenChange}
      previewContext={previewContext}
      subtitle={`Capability preview of ${previewContext.name || "the current treatment flow"}`}
    />
  );
}
