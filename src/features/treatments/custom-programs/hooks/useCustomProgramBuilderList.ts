import { useMemo } from "react";
import type { ClientTreatmentConsent, ClientTreatmentSection } from "@/features/treatments/api/treatmentsApi";
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

const itemSourceId = (item: CustomProgramBuilderStageItem) => item.sourceId || item.id;

const formatCount = (count: number, singular: string) => `${count} ${singular}${count === 1 ? "" : "s"}`;

const enrichBuilderItem = (
  item: CustomProgramBuilderStageItem,
  catalogs: {
    programs: Program[];
    sections: ClientTreatmentSection[];
    consents: ClientTreatmentConsent[];
  },
): CustomProgramBuilderStageItem => {
  const sourceId = itemSourceId(item);
  const program = item.kind === "program"
    ? catalogs.programs.find((candidate) => String(candidate.id) === String(sourceId))
    : undefined;
  const section = item.kind === "section"
    ? catalogs.sections.find((candidate) => String(candidate.id) === String(sourceId))
    : undefined;
  const consent = item.kind === "consent"
    ? catalogs.consents.find((candidate) => String(candidate.id) === String(sourceId))
    : undefined;

  if (item.kind === "program") {
    return {
      ...item,
      title: item.title || program?.name || "Program",
      subtitle: item.subtitle || (program
        ? "Routed treatment · follow-up inherited"
        : "Routed treatment"),
      sourceId: item.sourceId || program?.id,
      treatmentTypeKey: item.treatmentTypeKey || program?.treatmentTypeKey,
    };
  }

  if (item.kind === "section") {
    return {
      ...item,
      title: item.title || section?.name || "Section",
      subtitle: item.subtitle || (section
        ? `${formatCount(section.fieldCount, "field")}, asked as one block`
        : "Reusable section fields."),
      sourceId: item.sourceId || section?.id,
    };
  }

  if (item.kind === "consent") {
    return {
      ...item,
      title: item.title || consent?.name || "Consent",
      subtitle: item.subtitle || (consent
        ? consent.scope === "global" ? "Universal" : "Treatment-specific"
        : "Consent form capture."),
      sourceId: item.sourceId || consent?.id,
    };
  }

  return item;
};

const getBuilderQuestions = (customProgram: CustomProgram) => {
  if (customProgram.builderQuestions?.length) return customProgram.builderQuestions;
  return [];
};

const getBuilderSections = (customProgram: CustomProgram, sections: ClientTreatmentSection[]) => {
  const items = customProgram.builderSections?.length
    ? customProgram.builderSections
    : customProgram.flowItems
    .filter((item) => item.kind === "section")
    .map((item) => toFallbackStageItem(item, true));
  if (items.length) return items;

  return (customProgram.sectionIds || []).flatMap((sectionId) => {
    const section = sections.find((candidate) => String(candidate.id) === String(sectionId));
    return section ? [{
      id: section.id,
      kind: "section" as const,
      title: section.name,
      source: "welliemd" as const,
      locked: true,
      required: true,
      sourceId: section.id,
    }] : [];
  });
};

const getBuilderTreatmentOptions = (customProgram: CustomProgram, programs: Program[]) => {
  const items = customProgram.builderTreatmentOptions?.length
    ? customProgram.builderTreatmentOptions
    : customProgram.flowItems
    .filter((item) => item.kind === "program")
    .map((item) => toFallbackStageItem(item, true));
  if (items.length) return items;

  return (customProgram.includedProgramIds || []).flatMap((programId) => {
    const program = programs.find((candidate) => String(candidate.id) === String(programId));
    return program ? [{
      id: program.id,
      kind: "program" as const,
      title: program.name,
      source: "welliemd" as const,
      locked: true,
      required: true,
      treatmentTypeKey: program.treatmentTypeKey,
      sourceId: program.id,
    }] : [];
  });
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
    sections?: ClientTreatmentSection[];
    consents?: ClientTreatmentConsent[];
  },
) {
  return useMemo(() => {
    const programs = options?.programs || [];
    const sections = options?.sections || [];
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
        items: [...getBuilderQuestions(customProgram), ...getBuilderSections(customProgram, sections)]
          .map((item) => enrichBuilderItem(item, { programs, sections, consents })),
      },
      {
        id: "stage-treatment-options",
        stageNumber: 2,
        title: "Treatment Options",
        tone: "program",
        items: getBuilderTreatmentOptions(customProgram, programs)
          .map((item) => enrichBuilderItem(item, { programs, sections, consents })),
      },
      {
        id: "stage-consents",
        stageNumber: 3,
        title: "Consents",
        tone: "consent",
        items: getDerivedConsentItems(customProgram, programs, consents)
          .map((item) => enrichBuilderItem(item, { programs, sections, consents })),
      },
    ];

    const totalItemCount = stages.reduce((count, stage) => count + stage.items.length, 2);

    return {
      totalItemCount,
      authenticationItem,
      stages,
      checkoutItem,
    };
  }, [customProgram, options?.programs, options?.sections, options?.consents]);
}
