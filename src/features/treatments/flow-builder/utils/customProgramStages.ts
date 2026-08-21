import type {
  CommonSection,
  ConsentForm,
  CustomProgram,
  CustomProgramFlowItem,
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

  const stageOne = flowItems.filter(
    (item) => item.kind === "routing_question" || item.kind === "section" || item.kind === "section_field"
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

export function reorderCustomProgramItemWithinStage(
  flowItems: CustomProgramFlowItem[],
  sourceId: string,
  targetId: string
) {
  const canonicalItems = canonicalizeCustomProgramFlowItems(flowItems);
  const source = canonicalItems.find((item) => item.id === sourceId);
  const target = canonicalItems.find((item) => item.id === targetId);
  if (!source || !target || source.locked || target.locked) return canonicalItems;

  const sourceStage = getCustomProgramStageNumber(source);
  const targetStage = getCustomProgramStageNumber(target);
  const bothCheckoutOverrides = source.kind === "checkout" && target.kind === "checkout";
  if (sourceStage !== targetStage || (sourceStage === null && !bothCheckoutOverrides)) {
    return canonicalItems;
  }

  const sourceIndex = canonicalItems.findIndex((item) => item.id === sourceId);
  const targetIndex = canonicalItems.findIndex((item) => item.id === targetId);
  if (sourceIndex === targetIndex) return canonicalItems;

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
): AdminCustomProgramStageItem => ({
  id: item.id,
  kind: item.kind as AdminCustomProgramStageItem["kind"],
  title: item.title,
  subtitle: item.subtitle,
  persistedItem: item,
  derived: false,
  program: item.sourceId ? programsById.get(String(item.sourceId)) : undefined,
  section: item.sourceId ? sectionsById.get(String(item.sourceId)) : undefined,
  consent: item.sourceId ? consentsById.get(String(item.sourceId)) : undefined,
});

export function buildAdminCustomProgramStages(
  customProgram: CustomProgram,
  catalogs: {
    programs: Program[];
    sections: CommonSection[];
    consents: ConsentForm[];
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

  const explicitConsentKeys = new Set(
    persistedStageItems
      .filter((item) => item.kind === "consent")
      .flatMap((item) => [item.persistedItem?.sourceId, item.title])
      .filter(Boolean)
      .map(String)
  );
  const derivedConsents = new Map<
    string,
    { consent: ConsentForm; matchedProgramNames: string[] }
  >();

  persistedStageItems
    .filter((item) => item.kind === "program" && item.program)
    .forEach((item) => {
      const program = item.program!;
      (program.consentIds || []).forEach((consentId) => {
        const consent = consentsById.get(String(consentId));
        if (!consent || explicitConsentKeys.has(consent.id) || explicitConsentKeys.has(consent.name)) return;
        const existing = derivedConsents.get(consent.id);
        if (existing) {
          if (!existing.matchedProgramNames.includes(program.name)) {
            existing.matchedProgramNames.push(program.name);
          }
          return;
        }
        derivedConsents.set(consent.id, { consent, matchedProgramNames: [program.name] });
      });
    });

  const derivedConsentItems: AdminCustomProgramStageItem[] = Array.from(
    derivedConsents.values()
  ).map(({ consent, matchedProgramNames }) => ({
    id: `derived-consent-${consent.id}`,
    kind: "consent",
    title: consent.name,
    subtitle: "Consent form capture.",
    derived: true,
    consent,
    matchedProgramNames,
  }));

  const stages: AdminCustomProgramStage[] = [
    {
      id: "stage-custom-questions",
      stageNumber: 1,
      title: "Custom Questions & Sections",
      tone: "question",
      items: persistedStageItems.filter(
        (item) =>
          item.kind === "routing_question" ||
          item.kind === "section" ||
          item.kind === "section_field"
      ),
    },
    {
      id: "stage-treatment-options",
      stageNumber: 2,
      title: "Treatment Options",
      tone: "program",
      items: persistedStageItems.filter((item) => item.kind === "program"),
    },
    {
      id: "stage-consents",
      stageNumber: 3,
      title: "Consents",
      tone: "consent",
      items: [
        ...persistedStageItems.filter((item) => item.kind === "consent"),
        ...derivedConsentItems,
      ],
    },
  ];

  return {
    authenticationItem,
    stages,
    checkoutOverrides,
    checkoutItem,
    totalItemCount:
      2 + checkoutOverrides.length + stages.reduce((count, stage) => count + stage.items.length, 0),
  };
}
