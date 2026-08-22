import type { ProgramEffectiveContent } from "@/features/treatments/api/programsApi";
import type { ProgramQuestion, QuestionKind } from "@/features/treatments/types";
import type { EffectiveSectionItem } from "@/features/treatments/api/programsApi";

type EffectiveNode = {
  id?: string;
  source_id?: string;
  source_type?: string;
  name?: string;
  required?: boolean;
};

const sourceId = (node: EffectiveNode) => String(node.source_id || node.id || "");

const canonicalKinds = new Set<QuestionKind>([
  "text", "textarea", "number", "date", "email", "phone", "zip",
  "single_choice", "multiple_choice", "yes_no", "height_weight", "consent",
  "file_upload", "state_routing", "medication_dose", "pharmacy",
  "personal_details", "shipping_address", "sex", "medical_conditions",
  "self_reported_meds", "allergies", "labs_preference", "checkout", "bmi",
]);

const normalizeFieldKind = (kind: string): QuestionKind => {
  const aliases: Record<string, QuestionKind> = {
    single: "single_choice",
    multiple: "multiple_choice",
    multi: "multiple_choice",
    file: "file_upload",
    address: "shipping_address",
    state: "state_routing",
  };
  const normalized = aliases[kind] || kind;
  return canonicalKinds.has(normalized as QuestionKind)
    ? normalized as QuestionKind
    : "text";
};

const provenanceLabel = (kind: "consent" | "section", sourceType: string, visitType: string) => {
  if (sourceType === "global") return "Inherited — Global";
  if (sourceType === "visit_type") return `Inherited — Visit Type · ${visitType}`;
  if (sourceType === "inline") return "Inline — Conditional";
  return kind === "consent" ? "Explicit — Program" : "Program-specific Section";
};

function effectiveQuestion(
  node: EffectiveNode,
  kind: "consent" | "section",
  sourceType: string,
  visitType: string,
): ProgramQuestion {
  const canonicalId = sourceId(node);
  return {
    id: `effective-${kind}:${sourceType}:${canonicalId}`,
    order: 0,
    text: node.name || (kind === "consent" ? "Consent" : "Section"),
    kind,
    section: kind === "consent" ? "Effective Consents" : "Effective Sections",
    required: node.required !== false,
    elementConfig: {
      sourceId: canonicalId,
      ...(kind === "section" ? { sourceSectionId: canonicalId } : {}),
      system: true,
      locked: true,
      effective: true,
      sourceType,
      description: provenanceLabel(kind, sourceType, visitType),
    },
  };
}

function effectiveSectionFields(
  section: EffectiveSectionItem,
  sourceType: string,
  visitType: string,
): ProgramQuestion[] {
  const sectionId = sourceId(section);
  return [...(section.fields || [])]
    .sort((left, right) => (left.order || 0) - (right.order || 0))
    .map((field) => {
      const fieldId = String(field.source_field_id || field.source_id || field.id || "");
      const configuration = field.configuration || {};
      return {
        id: `effective-section-field:${sectionId}:v${section.source_version || section.version || 1}:${fieldId}`,
        order: 0,
        text: field.label || "Section field",
        kind: normalizeFieldKind(String(field.kind || "text")),
        section: section.name,
        required: field.required !== false,
        choices: Array.isArray(configuration.choices)
          ? configuration.choices.map(String)
          : undefined,
        elementConfig: {
          ...configuration,
          sourceId: fieldId,
          sourceFieldId: fieldId,
          sourceSectionId: sectionId,
          sourceSectionName: section.name,
          sourceSectionVersion: section.source_version || section.version || 1,
          sourceSectionScope: section.scope,
          sourceType,
          sourceVisitType: sourceType === "visit_type" ? visitType : undefined,
          mappedField: field.mapped_field || "",
          system: true,
          effective: true,
          locked: true,
          effectiveSectionField: true,
          originalFieldKind: field.kind,
          description: `${provenanceLabel("section", sourceType, visitType)} · ${section.name}`,
        },
      };
    })
    .filter((question) => Boolean(question.elementConfig?.sourceFieldId));
}

type SectionProjection = {
  clinical: ProgramQuestion[];
  consents: ProgramQuestion[];
  checkout: ProgramQuestion[];
};

function projectEffectiveSectionFields(
  sections: Array<{ section: EffectiveSectionItem; sourceType: string }>,
  visitType: string,
  authoredSourceIds: Set<string>,
): SectionProjection {
  const projection: SectionProjection = { clinical: [], consents: [], checkout: [] };
  const byId = new Map(sections.map((entry) => [sourceId(entry.section), entry]));
  const referencedIds = new Set<string>();
  sections.forEach(({ section }) => {
    (section.fields || []).forEach((field) => {
      if (String(field.kind || "").toLowerCase() !== "section") return;
      const configuration = field.configuration || {};
      const reference = String(configuration.sourceSectionId || configuration.sourceId || "");
      if (reference) referencedIds.add(reference);
    });
  });

  const emittedFields = new Set<string>();
  const expandedSections = new Set<string>();
  const expand = (entry: { section: EffectiveSectionItem; sourceType: string }, ancestors: Set<string>) => {
    const sectionKey = `${sourceId(entry.section)}:v${entry.section.source_version || entry.section.version || 1}`;
    if (ancestors.has(sectionKey) || expandedSections.has(sectionKey)) return;
    const nextAncestors = new Set(ancestors).add(sectionKey);
    expandedSections.add(sectionKey);

    [...(entry.section.fields || [])]
      .sort((left, right) => (left.order || 0) - (right.order || 0))
      .forEach((field) => {
        const configuration = field.configuration || {};
        if (String(field.kind || "").toLowerCase() === "section") {
          const reference = String(configuration.sourceSectionId || configuration.sourceId || "");
          const target = byId.get(reference);
          if (target) expand(target, nextAncestors);
          return;
        }
        const [question] = effectiveSectionFields(
          { ...entry.section, fields: [field] },
          entry.sourceType,
          visitType,
        );
        const fieldId = String(question?.elementConfig?.sourceFieldId || "");
        const fieldKey = `${sectionKey}:${fieldId}`;
        if (!question || !fieldId || authoredSourceIds.has(fieldId) || emittedFields.has(fieldKey)) return;
        emittedFields.add(fieldKey);
        if (question.kind === "consent") projection.consents.push(question);
        else if (question.kind === "checkout") projection.checkout.push(question);
        else projection.clinical.push(question);
      });
  };

  const roots = sections.filter(({ section }) => !referencedIds.has(sourceId(section)));
  (roots.length ? roots : sections).forEach((entry) => expand(entry, new Set()));
  return projection;
}

/**
 * Project resolver-owned inherited content into the authoring list without
 * creating ProgramQuestion, ProgramConsent, or ProgramSection rows.
 */
export function projectEffectiveProgramFlow(
  authoredQuestions: ProgramQuestion[],
  effectiveContent?: ProgramEffectiveContent,
): ProgramQuestion[] {
  if (!effectiveContent) return authoredQuestions;

  const authoredSourceIds = new Set(
    authoredQuestions.flatMap((question) => {
      const ids = [question.elementConfig?.sourceId];
      if (question.kind === "section") ids.push(question.elementConfig?.sourceSectionId);
      return ids.filter((id): id is string => Boolean(id)).map(String);
    }),
  );
  const seen = new Set(authoredSourceIds);
  const nodes: ProgramQuestion[] = [];
  const addGroup = (items: EffectiveNode[], kind: "consent", sourceType: string) => {
    items.forEach((item) => {
      const canonicalId = sourceId(item);
      if (!canonicalId || seen.has(canonicalId)) return;
      seen.add(canonicalId);
      nodes.push(effectiveQuestion(item, kind, sourceType, effectiveContent.visit_type));
    });
  };

  // Authentication remains the outer boundary. Shared Sections precede
  // clinical questions; effective Consents follow screening before Checkout.
  const authentication = authoredQuestions.filter((question) => question.kind === "patient_authentication");
  const checkout = authoredQuestions.filter((question) => question.kind === "checkout");
  const authoredConsents = authoredQuestions.filter((question) => question.kind === "consent");
  const clinical = authoredQuestions.filter(
    (question) => question.kind !== "patient_authentication" && question.kind !== "checkout" && question.kind !== "consent",
  );

  const sectionProjection = projectEffectiveSectionFields([
    ...effectiveContent.sections.inherited_global.map((section) => ({ section, sourceType: "global" })),
    ...effectiveContent.sections.inherited_visit_type.map((section) => ({ section, sourceType: "visit_type" })),
    ...effectiveContent.sections.explicit_program.map((section) => ({ section, sourceType: "program" })),
  ], effectiveContent.visit_type, seen);
  addGroup(effectiveContent.consents.inherited_global as EffectiveNode[], "consent", "global");
  addGroup(effectiveContent.consents.inherited_visit_type as EffectiveNode[], "consent", "visit_type");
  addGroup(effectiveContent.consents.explicit_program as EffectiveNode[], "consent", "program");
  addGroup(effectiveContent.consents.inline_conditional as EffectiveNode[], "consent", "inline");

  return [
    ...authentication,
    ...sectionProjection.clinical,
    ...clinical,
    ...sectionProjection.consents,
    ...authoredConsents,
    ...nodes,
    ...sectionProjection.checkout,
    ...checkout,
  ].map(
    (question, index) => ({ ...question, order: index + 1 }),
  );
}
