import type { ProgramEffectiveContent } from "@/features/treatments/api/programsApi";
import type { ProgramQuestion } from "@/features/treatments/types";

type EffectiveNode = {
  id?: string;
  source_id?: string;
  source_type?: string;
  name?: string;
  required?: boolean;
};

const sourceId = (node: EffectiveNode) => String(node.source_id || node.id || "");

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
  const addGroup = (items: EffectiveNode[], kind: "consent" | "section", sourceType: string) => {
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
  const clinical = authoredQuestions.filter(
    (question) => question.kind !== "patient_authentication" && question.kind !== "checkout",
  );

  addGroup(effectiveContent.sections.inherited_global as EffectiveNode[], "section", "global");
  addGroup(effectiveContent.sections.inherited_visit_type as EffectiveNode[], "section", "visit_type");
  addGroup(effectiveContent.sections.explicit_program as EffectiveNode[], "section", "program");
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
