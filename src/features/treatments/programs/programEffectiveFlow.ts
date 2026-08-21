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
          sourceType,
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
  const sectionFieldKeys = new Set<string>();
  const addSections = (items: EffectiveSectionItem[], sourceType: string) => {
    items.forEach((section) => {
      effectiveSectionFields(section, sourceType, effectiveContent.visit_type).forEach((question) => {
        const fieldId = String(question.elementConfig?.sourceFieldId || "");
        const key = `${sourceId(section)}:v${section.source_version || section.version || 1}:${fieldId}`;
        if (!fieldId || sectionFieldKeys.has(key) || seen.has(fieldId)) return;
        sectionFieldKeys.add(key);
        seen.add(fieldId);
        nodes.push(question);
      });
    });
  };

  // Authentication remains the outer boundary. Shared Sections precede
  // clinical questions; effective Consents follow screening before Checkout.
  const authentication = authoredQuestions.filter((question) => question.kind === "patient_authentication");
  const checkout = authoredQuestions.filter((question) => question.kind === "checkout");
  const clinical = authoredQuestions.filter(
    (question) => question.kind !== "patient_authentication" && question.kind !== "checkout",
  );

  addSections(effectiveContent.sections.inherited_global, "global");
  addSections(effectiveContent.sections.inherited_visit_type, "visit_type");
  addSections(effectiveContent.sections.explicit_program, "program");
  const sections = [...nodes];
  nodes.length = 0;
  addGroup(effectiveContent.consents.inherited_global as EffectiveNode[], "consent", "global");
  addGroup(effectiveContent.consents.inherited_visit_type as EffectiveNode[], "consent", "visit_type");
  addGroup(effectiveContent.consents.explicit_program as EffectiveNode[], "consent", "program");
  addGroup(effectiveContent.consents.inline_conditional as EffectiveNode[], "consent", "inline");

  return [...authentication, ...sections, ...clinical, ...nodes, ...checkout].map(
    (question, index) => ({ ...question, order: index + 1 }),
  );
}
