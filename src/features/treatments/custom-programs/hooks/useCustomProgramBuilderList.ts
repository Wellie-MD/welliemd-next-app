import { useMemo } from "react";
import type { ClientTreatmentConsent } from "@/features/treatments/api/treatmentsApi";
import type {
  CustomProgram,
  CustomProgramBuilderLockedItem,
  CustomProgramBuilderStage,
  CustomProgramBuilderStageItem,
  Program,
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

const getBuilderSections = (customProgram: CustomProgram) => {
  if (customProgram.builderSections?.length) return customProgram.builderSections;
  return customProgram.flowItems
    .filter((item) => item.kind === "section")
    .map((item) => toFallbackStageItem(item, true));
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

const getDerivedConsentItems = (
  customProgram: CustomProgram,
  programs: Program[],
  consents: ClientTreatmentConsent[],
) => {
  const explicit = getBuilderConsents(customProgram);
  const explicitIds = new Set(
    explicit.flatMap((item) => [item.sourceId, item.title]).filter(Boolean).map((value) => String(value)),
  );

  const consentMap = new Map(consents.map((consent) => [consent.id, consent]));
  const includedProgramIds = new Set(customProgram.includedProgramIds || []);
  const derivedConsentIds = new Set<string>(customProgram.consentIds || []);

  programs.forEach((program) => {
    if (!includedProgramIds.has(program.id)) return;
    (program.consentIds || []).forEach((consentId) => {
      if (consentId) derivedConsentIds.add(consentId);
    });
  });

  const derivedItems: CustomProgramBuilderStageItem[] = [];
  derivedConsentIds.forEach((consentId) => {
    const consent = consentMap.get(consentId);
    if (!consent) return;
    if (explicitIds.has(consent.id) || explicitIds.has(consent.name)) return;

    derivedItems.push({
      id: `derived-consent-${consent.id}`,
      kind: "consent",
      title: consent.name,
      subtitle: "Consent form capture.",
      source: "welliemd",
      locked: true,
      required: true,
      sourceId: consent.id,
      treatmentTypeKey: consent.scope === "global" ? undefined : consent.visitTypeKeys[0],
    });
  });

  return [...explicit, ...derivedItems];
};

export function useCustomProgramBuilderList(
  customProgram: CustomProgram,
  options?: {
    programs?: Program[];
    consents?: ClientTreatmentConsent[];
  },
) {
  return useMemo(() => {
    const programs = options?.programs || [];
    const consents = options?.consents || [];
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
        items: [...getBuilderQuestions(customProgram), ...getBuilderSections(customProgram)],
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
        items: getDerivedConsentItems(customProgram, programs, consents),
      },
    ];

    const totalItemCount = stages.reduce((count, stage) => count + stage.items.length, 2);

    return {
      totalItemCount,
      authenticationItem,
      stages,
      checkoutItem,
    };
  }, [customProgram, options?.programs, options?.consents]);
}
