import type { EffectiveSectionItem, ProgramEffectiveContent } from "@/features/treatments/api/programsApi";
import type { ProgramQuestion } from "@/features/treatments/types";

type EffectiveConsent = {
  id?: string;
  source_id?: string;
  name?: string;
  required?: boolean;
  library_scope?: "global" | "visit_type";
};
const sourceId = (node: { id?: string; source_id?: string }) => String(node.source_id || node.id || "");

function explicitSectionRow(section: EffectiveSectionItem): ProgramQuestion {
  const id = sourceId(section);
  const fieldCount = section.fields?.length || 0;
  const scope = section.section_scope === "global" ? "Universal" : "Treatment specific";
  return {
    id: `effective-section:program:${id}`,
    order: 0,
    text: section.name || "Common Section",
    kind: "section",
    section: "Common Sections",
    required: section.fields?.some((field) => field.required !== false) ?? true,
    elementConfig: {
      sourceId: id,
      sourceSectionId: id,
      sourceSectionName: section.name,
      sourceSectionVersion: section.source_version || section.version || 1,
      sourceSectionScope: section.section_scope,
      sourceType: "program",
      effective: true,
      locked: true,
      fieldCount,
      description: `${fieldCount} ${fieldCount === 1 ? "field" : "fields"} · Reusable from library · ${scope}`,
    },
  };
}

function explicitConsentRow(consent: EffectiveConsent, sourceType: "program" | "inline"): ProgramQuestion {
  const id = sourceId(consent);
  const libraryScope = consent.library_scope === "global" ? "Global" : "Visit Type";
  return {
    id: `effective-consent:${sourceType}:${id}`,
    order: 0,
    text: consent.name || "Consent",
    kind: "consent",
    section: "Consents",
    required: consent.required !== false,
    elementConfig: {
      sourceId: id,
      sourceType,
      effective: true,
      locked: true,
      description: sourceType === "inline" ? "Inline Consent · Conditional" : `Library Consent · ${libraryScope}`,
    },
  };
}

function annotateAuthoredConsent(
  question: ProgramQuestion,
  explicitBySourceId: Map<string, EffectiveConsent>,
): ProgramQuestion {
  const linkedSourceId = String(question.elementConfig?.sourceId || "");
  if (!linkedSourceId) {
    return {
      ...question,
      elementConfig: {
        ...(question.elementConfig || {}),
        consentProvenance: "inline",
        description: "Inline Consent · Conditional",
      },
    };
  }
  const libraryConsent = explicitBySourceId.get(linkedSourceId);
  const libraryScope = libraryConsent?.library_scope === "global" ? "Global" : "Visit Type";
  return {
    ...question,
    elementConfig: {
      ...(question.elementConfig || {}),
      consentProvenance: "library",
      libraryScope: libraryConsent?.library_scope,
      description: `Library Consent · ${libraryScope}`,
    },
  };
}

/** Library scope validates compatibility; only explicit placements render. */
export function projectEffectiveProgramFlow(
  authoredQuestions: ProgramQuestion[],
  effectiveContent?: ProgramEffectiveContent,
): ProgramQuestion[] {
  if (!effectiveContent) {
    const labCheckout = authoredQuestions.filter((item) => item.kind === "checkout" && item.elementConfig?.labCheckout === true);
    const medicineCheckout = authoredQuestions.filter((item) => item.kind === "checkout" && item.elementConfig?.labCheckout !== true);
    const consents = authoredQuestions.filter((item) => item.kind === "consent");
    const nonConsentFlow = authoredQuestions.filter((item) => item.kind !== "checkout" && item.kind !== "consent");
    return [...nonConsentFlow, ...labCheckout, ...consents, ...medicineCheckout]
      .map((item, index) => ({ ...item, order: index + 1 }));
  }
  const authoredIds = new Set(
    authoredQuestions.flatMap((question) => [
      question.id,
      question.elementConfig?.sourceId,
      question.elementConfig?.sourceSectionId,
    ]).filter(Boolean).map(String),
  );
  const authentication = authoredQuestions.filter((item) => item.kind === "patient_authentication");
  const labCheckout = authoredQuestions.filter((item) => item.kind === "checkout" && item.elementConfig?.labCheckout === true);
  const checkout = authoredQuestions.filter((item) => item.kind === "checkout" && item.elementConfig?.labCheckout !== true);
  const explicitBySourceId = new Map(
    effectiveContent.consents.explicit_program.map((consent) => [sourceId(consent), consent]),
  );
  const authoredConsents = authoredQuestions
    .filter((item) => item.kind === "consent")
    .map((item) => annotateAuthoredConsent(item, explicitBySourceId));
  const clinical = authoredQuestions.filter(
    (item) => !["patient_authentication", "checkout", "consent"].includes(item.kind),
  );
  const sections = effectiveContent.sections.explicit_program
    .filter((section) => !authoredIds.has(sourceId(section)))
    .map(explicitSectionRow);
  const consents = [
    ...effectiveContent.consents.explicit_program.map((item) => explicitConsentRow(item, "program")),
    ...effectiveContent.consents.inline_conditional.map((item) => explicitConsentRow(item, "inline")),
  ].filter((item) => !authoredIds.has(String(item.elementConfig?.sourceId || "")));
  return [...authentication, ...clinical, ...sections, ...labCheckout, ...authoredConsents, ...consents, ...checkout]
    .map((item, index) => ({ ...item, order: index + 1 }));
}
