import DOMPurify from "dompurify";
import type { ConsentForm, ProgramQuestion } from "../../types";
const FALLBACK_BODY = "<p>Please review the terms of this consent carefully.</p>";

export interface ConsentPreviewOption {
  id: string;
  text: string;
  disqualifies: boolean;
}

export interface ConsentPreviewData {
  title: string;
  body: string;
  options: ConsentPreviewOption[];
  isLibraryReference: boolean;
  libraryConsent?: ConsentForm;
}

type QuestionConsentForm = {
  consent_text?: string;
  text?: string;
};

export const getLibraryConsentId = (question?: ProgramQuestion | null) => (
  question?.kind === "consent"
    ? String(question.elementConfig?.sourceId || "")
    : ""
);

export const isLibraryConsentReference = (question?: ProgramQuestion | null) => (
  Boolean(getLibraryConsentId(question))
);

const choiceText = (choice: unknown): string => {
  if (typeof choice === "string") return choice;
  if (!choice || typeof choice !== "object") return String(choice ?? "");
  const record = choice as Record<string, unknown>;
  return String(record.label || record.text || record.title || record.value || record.id || "");
};

const choiceId = (choice: unknown, index: number): string => {
  if (!choice || typeof choice !== "object") return choiceText(choice) || `choice-${index + 1}`;
  const record = choice as Record<string, unknown>;
  return String(record.id || record.value || record.label || record.text || `choice-${index + 1}`);
};

const inlineOptions = (question: ProgramQuestion): ConsentPreviewOption[] => (
  (question.choices || []).map((choice, index) => ({
    id: choiceId(choice, index),
    text: choiceText(choice),
    disqualifies: (question.dqChoices || []).includes(choiceText(choice)),
  })).filter((option) => option.text.trim().length > 0)
);

export const stripRepeatedHeading = (body: string, titles: string[]) => {
  let result = body;
  for (const title of Array.from(new Set(titles.filter(Boolean).map((item) => item.trim())))) {
    const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(
      new RegExp(`^<([a-z0-9]+)[^>]*>(?:<[^>]+>)*\\s*${escapedTitle}\\s*[:\\-]?\\s*(?:</[^>]+>)*</\\1>\\s*`, "i"),
      "",
    );
    result = result.replace(new RegExp(`^#{1,6}\\s*${escapedTitle}\\s*[:\\-]?\\s*(\\n|<br\\s*/?>)*`, "i"), "");
    result = result.replace(new RegExp(`^${escapedTitle}\\s*[:\\-]?\\s*(\\n+|<br\\s*/?>)+`, "i"), "");
  }
  return result.trim();
};

export const sanitizeConsentHtml = (html: string) => {
  // The admin portal is a browser-rendered Vite app. Keep the pure utility
  // usable by the node-based regression scripts without manufacturing a DOM.
  if (typeof window === "undefined") return html;

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "span",
      "blockquote",
      "a",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class"],
  });
};

export const getCleanConsentBody = (body: string, titles: string[] = []) => {
  const cleanedBody = stripRepeatedHeading(body.trim(), titles);
  return sanitizeConsentHtml(cleanedBody || FALLBACK_BODY);
};

export const getConsentPreviewData = (
  question: ProgramQuestion,
  libraryConsent?: ConsentForm,
): ConsentPreviewData => {
  const isLibraryReference = isLibraryConsentReference(question);
  const embeddedConsentForm = (question as ProgramQuestion & {
    consent_form?: QuestionConsentForm;
  }).consent_form;
  const body = libraryConsent?.text
    || embeddedConsentForm?.consent_text
    || embeddedConsentForm?.text
    || (!isLibraryReference ? question.consentText : "")
    || "";
  const cleanedBody = getCleanConsentBody(body, [question.text, question.section, libraryConsent?.name || ""]);

  return {
    title: libraryConsent?.name || question.text || "Consent",
    body: cleanedBody,
    options: libraryConsent?.options?.map((option) => ({
      id: option.id,
      text: option.text,
      disqualifies: option.disqualifies,
    })) || inlineOptions(question),
    isLibraryReference,
    libraryConsent,
  };
};
