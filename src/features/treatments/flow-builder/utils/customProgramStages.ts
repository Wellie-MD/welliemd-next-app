import type {
  CommonSection,
  ConsentForm,
  CustomProgram,
  CustomProgramFlowItem,
  EffectiveCustomProgramContent,
  Program,
} from "@/features/treatments/types";

export type AdminCustomProgramStageTone = "question" | "program" | "consent";

export interface AdminCustomProgramStageItem {
  id: string;
  kind: "routing_question" | "section" | "section_field" | "program" | "consent";
  title: string;
  subtitle: string;
  persistedItem?: CustomProgramFlowItem;
  derived: boolean;
  program?: Program;
  section?: CommonSection;
  consent?: ConsentForm;
  matchedProgramNames?: string[];
}

export interface AdminCustomProgramStage {
  id: string;
  stageNumber: 1 | 2 | 3;
  title: string;
  tone: AdminCustomProgramStageTone;
  items: AdminCustomProgramStageItem[];
}

export interface AdminCustomProgramStageProjection {
  authenticationItem: CustomProgramFlowItem;
  stages: AdminCustomProgramStage[];
  checkoutOverrides: CustomProgramFlowItem[];
  checkoutStage: { stageNumber: 4; title: "Checkout" };
  checkoutItem: CustomProgramFlowItem;
  totalItemCount: number;
}

const syntheticAuthentication = (): CustomProgramFlowItem => ({
  id: "builder-authentication",
  kind: "authentication",
  title: "Patient Authentication",
  subtitle: "Name, email, US phone, consent, and account entry.",
  locked: true,
  required: true,
});

const syntheticCheckout = (): CustomProgramFlowItem => ({
  id: "builder-checkout",
  kind: "checkout",
  title: "Checkout",
  subtitle:
    "Patient confirms routed product, selects subscription length, completes payment. System exit point — can't be reordered.",
  locked: true,
});

export const getCustomProgramStageNumber = (
  item: Pick<CustomProgramFlowItem, "kind">
): 1 | 2 | 3 | null => {
  if (item.kind === "routing_question" || item.kind === "section" || item.kind === "section_field") return 1;
  if (item.kind === "program") return 2;
  if (item.kind === "consent") return 3;
  return null;
};

/**
 * Normalize the persisted patient journey to the stage contract. System rows
 * are unique and terminal while persisted legacy checkout overrides stay
 * immediately before the locked checkout row for read-only visibility.
 */
export function canonicalizeCustomProgramFlowItems(
  flowItems: CustomProgramFlowItem[]
): CustomProgramFlowItem[] {
  const authentication = flowItems.find((item) => item.kind === "authentication");
  const lockedCheckout = flowItems.find((item) => item.kind === "checkout" && item.locked);

  const stageOne = flowItems
    .filter(
      (item) => item.kind === "routing_question" || item.kind === "section" || item.kind === "section_field"
    )
    .map((item) =>
      item.kind === "routing_question" && !item.sourceId
        ? { ...item, sourceId: item.id }
        : item
    );
  const stageTwo = flowItems.filter((item) => item.kind === "program");
  const stageThree = flowItems.filter((item) => item.kind === "consent");
  const checkoutOverrides = flowItems.filter(
    (item) => item.kind === "checkout" && !item.locked
  );

  return [
    { ...(authentication || syntheticAuthentication()), locked: true },
    ...stageOne,
    ...stageTwo,
    ...stageThree,
    ...checkoutOverrides,
    { ...(lockedCheckout || syntheticCheckout()), locked: true },
  ];
}

const uniqueSourceIds = (
  flowItems: CustomProgramFlowItem[],
  kind: CustomProgramFlowItem["kind"]
) =>
  Array.from(
    new Set(
      flowItems
        .filter((item) => item.kind === kind && item.sourceId)
        .map((item) => String(item.sourceId))
    )
  );

const uniqueSectionIds = (flowItems: CustomProgramFlowItem[]) =>
  Array.from(
    new Set(
      flowItems
        .filter((item) => item.kind === "section" || item.kind === "section_field")
        .map((item) => item.sourceId)
        .filter(Boolean)
        .map(String),
    ),
  );

export function synchronizeCustomProgramStructure(
  customProgram: CustomProgram,
  flowItems: CustomProgramFlowItem[]
): CustomProgram {
  const canonicalItems = canonicalizeCustomProgramFlowItems(flowItems);
  const includedProgramIds = uniqueSourceIds(canonicalItems, "program");
  // A section field references its parent section through sourceId and its
  // concrete reusable field through mappedField. Keep the parent section in
  // the relation mirror even when an admin adds only selected fields.
  const sectionIds = uniqueSectionIds(canonicalItems);
  const consentIds = uniqueSourceIds(canonicalItems, "consent");
  const includedPrograms = new Set(includedProgramIds);

  return {
    ...customProgram,
    flowItems: canonicalItems,
    includedProgramIds,
    sectionIds,
    consentIds,
    isMulti: includedProgramIds.length > 1,
    programMatchingRules: Object.fromEntries(
      Object.entries(customProgram.programMatchingRules || {}).filter(([programId]) =>
        includedPrograms.has(programId)
      )
    ),
  };
}

const stageTitleByNumber: Record<1 | 2 | 3, string> = {
  1: "Custom Questions & Sections",
  2: "Treatment Options",
  3: "Consents",
};

/**
 * Explains why a drag-and-drop reorder would be rejected, so the UI can
 * surface a reason instead of silently reverting the drop.
 */
export function describeCustomProgramReorderBlock(
  flowItems: CustomProgramFlowItem[],
  sourceId: string,
  targetId: string
): string | null {
  const canonicalItems = canonicalizeCustomProgramFlowItems(flowItems);
  const source = canonicalItems.find((item) => item.id === sourceId);
  const target = canonicalItems.find((item) => item.id === targetId);
  if (!source || !target) return null;
  if (source.locked || target.locked) {
    return `${(source.locked ? source : target).title} is a locked system step and can't be reordered.`;
  }

  const sourceStage = getCustomProgramStageNumber(source);
  const targetStage = getCustomProgramStageNumber(target);
  const bothCheckoutOverrides = source.kind === "checkout" && target.kind === "checkout";
  if (sourceStage !== targetStage || (sourceStage === null && !bothCheckoutOverrides)) {
    const sourceStageTitle = sourceStage ? stageTitleByNumber[sourceStage] : "Checkout overrides";
    const targetStageTitle = targetStage ? stageTitleByNumber[targetStage] : "Checkout overrides";
    return `Items can only be reordered within their own stage. "${source.title}" belongs to ${sourceStageTitle}, not ${targetStageTitle}.`;
  }

  return null;
}

export function reorderCustomProgramItemWithinStage(
  flowItems: CustomProgramFlowItem[],
  sourceId: string,
  targetId: string
) {
  const canonicalItems = canonicalizeCustomProgramFlowItems(flowItems);
  const sourceIndex = canonicalItems.findIndex((item) => item.id === sourceId);
  const targetIndex = canonicalItems.findIndex((item) => item.id === targetId);
  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return canonicalItems;
  if (describeCustomProgramReorderBlock(canonicalItems, sourceId, targetId)) return canonicalItems;

  const next = [...canonicalItems];
  const [moved] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, moved);
  return canonicalizeCustomProgramFlowItems(next);
}

const persistedDisplayItem = (
  item: CustomProgramFlowItem,
  programsById: Map<string, Program>,
  sectionsById: Map<string, CommonSection>,
  consentsById: Map<string, ConsentForm>
): AdminCustomProgramStageItem => {
  const program = item.sourceId ? programsById.get(String(item.sourceId)) : undefined;
  const section = item.sourceId ? sectionsById.get(String(item.sourceId)) : undefined;
  const consent = item.sourceId ? consentsById.get(String(item.sourceId)) : undefined;
  const resolvedName = program?.name || section?.name || consent?.name;
  return {
    id: item.id,
    kind: item.kind as AdminCustomProgramStageItem["kind"],
    title: resolvedName || item.title || "Unavailable referenced block",
    subtitle: item.subtitle || (resolvedName ? `${item.kind.replace("_", " ")} block` : "This referenced block is unavailable"),
    persistedItem: item,
    derived: false,
    program,
    section,
    consent,
  };
};

export function buildAdminCustomProgramStages(
  customProgram: CustomProgram,
  catalogs: {
    programs: Program[];
    sections: CommonSection[];
    consents: ConsentForm[];
    effectiveContent?: EffectiveCustomProgramContent;
  }
): AdminCustomProgramStageProjection {
  const canonicalItems = canonicalizeCustomProgramFlowItems(customProgram.flowItems || []);
  const programsById = new Map(catalogs.programs.map((program) => [String(program.id), program]));
  const sectionsById = new Map(catalogs.sections.map((section) => [String(section.id), section]));
  const consentsById = new Map(catalogs.consents.map((consent) => [String(consent.id), consent]));

  const authenticationItem = canonicalItems[0];
  const checkoutItem = canonicalItems[canonicalItems.length - 1];
  const checkoutOverrides = canonicalItems.filter(
    (item) => item.kind === "checkout" && !item.locked
  );
  const persistedStageItems = canonicalItems
    .filter((item) => getCustomProgramStageNumber(item) !== null)
    .map((item) => persistedDisplayItem(item, programsById, sectionsById, consentsById));

  const effective = catalogs.effectiveContent;
  const namesByProgramId = new Map(catalogs.programs.map((program) => [program.id, program.name]));
  const effectiveQuestions: AdminCustomProgramStageItem[] = (effective?.stages.stage1.questions || []).map((question) => {
    const persisted = canonicalItems.find(
      (item) => item.kind === "routing_question" && String(item.sourceId || item.id) === question.sourceId,
    );
    return {
      id: persisted?.id || question.id,
      kind: "routing_question",
      title: question.title || persisted?.title || "Question",
      subtitle: persisted?.subtitle || "Matching input",
      persistedItem: persisted,
      derived: !persisted,
    };
  });
  const effectiveSections: AdminCustomProgramStageItem[] = (effective?.stages.stage1.sections || []).map((sectionNode) => {
    const section = sectionsById.get(sectionNode.sourceId);
    const persisted = canonicalItems.find(
      (item) => (item.kind === "section" || item.kind === "section_field") && String(item.sourceId) === sectionNode.sourceId,
    );
    return {
      id: persisted?.id || `effective-section-${sectionNode.sourceId}-v${sectionNode.sourceVersion}`,
      kind: "section",
      title: sectionNode.name,
      subtitle: section?.scope === "global" ? "Universal · automatically inherited" : "Effective reusable section",
      persistedItem: persisted,
      derived: !persisted,
      section,
      matchedProgramNames: sectionNode.applicableProgramIds.map((id) => namesByProgramId.get(id) || id),
    };
  });
  const effectivePrograms: AdminCustomProgramStageItem[] = (effective?.stages.stage2.programs || []).map((row) => {
    const program = programsById.get(row.programId);
    const persisted = canonicalItems.find(
      (item) => item.kind === "program" && String(item.sourceId) === row.programId,
    );
    return {
      id: persisted?.id || row.inclusionId,
      kind: "program",
      title: row.name,
      subtitle: "Program inclusion",
      persistedItem: persisted,
      derived: false,
      program,
    };
  });
  const effectiveConsents: AdminCustomProgramStageItem[] = (effective?.stages.stage3.consents || []).map((node) => {
    const consent = consentsById.get(node.sourceId);
    const persisted = canonicalItems.find(
      (item) => item.kind === "consent" && String(item.sourceId) === node.sourceId,
    );
    return {
      id: persisted?.id || `effective-consent-${node.sourceId}-v${node.sourceVersion}`,
      kind: "consent",
      title: node.name,
      subtitle: node.sourceType === "global" ? "Universal" : "Automatically inherited",
      persistedItem: persisted,
      derived: !persisted,
      consent,
      matchedProgramNames: node.applicableProgramIds.map((id) => namesByProgramId.get(id) || id),
    };
  });

  const stages: AdminCustomProgramStage[] = [
    {
      id: "stage-custom-questions",
      stageNumber: 1,
      title: "Custom Questions & Sections",
      tone: "question",
      items: effective
        ? [...effectiveQuestions, ...effectiveSections]
        : persistedStageItems.filter((item) => item.kind === "routing_question" || item.kind === "section" || item.kind === "section_field"),
    },
    {
      id: "stage-treatment-options",
      stageNumber: 2,
      title: "Treatment Options",
      tone: "program",
      items: effective ? effectivePrograms : persistedStageItems.filter((item) => item.kind === "program"),
    },
    {
      id: "stage-consents",
      stageNumber: 3,
      title: "Consents",
      tone: "consent",
      items: effective ? effectiveConsents : persistedStageItems.filter((item) => item.kind === "consent"),
    },
  ];

  return {
    authenticationItem,
    stages,
    checkoutOverrides,
    checkoutStage: { stageNumber: 4, title: "Checkout" },
    checkoutItem,
    totalItemCount:
      2 + checkoutOverrides.length + stages.reduce((count, stage) => count + stage.items.length, 0),
  };
}
