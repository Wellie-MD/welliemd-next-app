import { useMemo } from "react";
import type {
  CustomProgram,
  CustomProgramBuilderLockedItem,
  CustomProgramBuilderStage,
  CustomProgramBuilderStageItem,
} from "@/features/treatments/types";

const toFallbackStageItem = (
  item: CustomProgram["flowItems"][number],
  locked: boolean
): CustomProgramBuilderStageItem => ({
  id: item.id,
  kind: item.kind === "routing_question" ? "question" : item.kind,
  title: item.title,
  subtitle: item.subtitle,
  source: locked ? "welliemd" : "admin",
  locked,
  required: item.locked,
  treatmentTypeKey: item.treatmentTypeKey,
  sourceId: item.sourceId,
});

const getBuilderQuestions = (customProgram: CustomProgram) => {
  if (customProgram.builderQuestions?.length) return customProgram.builderQuestions;
  return [];
};

const getBuilderTreatmentOptions = (customProgram: CustomProgram) => {
  if (customProgram.builderTreatmentOptions?.length) return customProgram.builderTreatmentOptions;
  return customProgram.flowItems
    .filter((item) => item.kind === "program")
    .map((item) => toFallbackStageItem(item, true));
};

const getBuilderConsents = (customProgram: CustomProgram) => {
  if (customProgram.builderConsents?.length) return customProgram.builderConsents;
  return customProgram.flowItems
    .filter((item) => item.kind === "consent")
    .map((item) => toFallbackStageItem(item, true));
};

export function useCustomProgramBuilderList(customProgram: CustomProgram) {
  return useMemo(() => {
    const authenticationItem: CustomProgramBuilderLockedItem = {
      id: "builder-authentication",
      kind: "authentication",
      label: "PATIENT AUTHENTICATION",
      title: "Authentication",
      subtitle: "Email lookup, existing patients log in, new patients sign up.",
      locked: true,
      required: true,
    };

    const checkoutItem: CustomProgramBuilderLockedItem = {
      id: "builder-checkout",
      kind: "checkout",
      label: "CHECKOUT",
      title: "Checkout",
      subtitle: "Patient confirms routed product, selects subscription length, completes payment. System exit point - can't be reordered.",
      locked: true,
    };

    const stages: CustomProgramBuilderStage[] = [
      {
        id: "stage-custom-questions",
        stageNumber: 1,
        title: "Custom Questions & Sections",
        tone: "question",
        items: getBuilderQuestions(customProgram),
      },
      {
        id: "stage-treatment-options",
        stageNumber: 2,
        title: "Treatment Options",
        tone: "program",
        items: getBuilderTreatmentOptions(customProgram),
      },
      {
        id: "stage-consents",
        stageNumber: 3,
        title: "Consents",
        tone: "consent",
        items: getBuilderConsents(customProgram),
      },
    ];

    const totalItemCount = stages.reduce((count, stage) => count + stage.items.length, 2);

    return {
      totalItemCount,
      authenticationItem,
      stages,
      checkoutItem,
    };
  }, [customProgram]);
}
