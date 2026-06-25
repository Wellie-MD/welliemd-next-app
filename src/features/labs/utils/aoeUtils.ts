/**
 * Admin-side AOE ("Ask on Order Entry") display helpers.
 *
 * The backend returns normalized AOE questions (apps/labs/junction/aoe.py).
 * These helpers adapt that shape for admin modals: friendly labels, helper
 * text, counts, and a human-readable summary. Options are only meaningful for
 * choice / multi_choice questions.
 */

export interface RawAoeQuestion {
  marker_id?: string;
  provider_id?: string;
  biomarker_id?: string;
  biomarker_name?: string;
  question_id: string;
  label?: string;
  raw_label?: string;
  code?: string;
  type?: string;
  required?: boolean;
  sequence?: number;
  constraint?: string | null;
  default?: string | null;
  options?: Array<{ code: string; value: string }>;
  is_fasting_duplicate?: boolean;
}

export interface NormalizedAoeQuestion {
  questionId: string;
  markerId: string;
  biomarkerName: string;
  label: string;
  rawLabel: string;
  helperText: string;
  code: string;
  type: string;
  typeLabel: string;
  required: boolean;
  sequence: number;
  constraint: string | null;
  defaultValue: string | null;
  options: Array<{ code: string; value: string }>;
  isChoice: boolean;
  isMultiChoice: boolean;
  isFastingDuplicate: boolean;
}

export interface AoeCounts {
  required: number;
  optional: number;
}

const SPECIMEN_SOURCE_HELPER = "Enter the specimen source, such as Blood, Serum, or Urine.";

const AOE_TYPE_LABELS: Record<string, string> = {
  text: "Text",
  numeric: "Numeric",
  choice: "Choice",
  multi_choice: "Multiple choice",
};

function aoeTypeLabel(type: string): string {
  return AOE_TYPE_LABELS[type] || (type ? type.charAt(0).toUpperCase() + type.slice(1) : "Text");
}

function isSpecimenSource(raw: RawAoeQuestion): boolean {
  const code = String(raw.code || "").trim();
  const rawLabel = String(raw.raw_label || raw.label || "").trim().toLowerCase();
  return code === "O006" || rawLabel === "source";
}

export function normalizeAoeQuestion(raw: RawAoeQuestion): NormalizedAoeQuestion {
  const type = String(raw.type || "text").toLowerCase();
  const isChoice = type === "choice";
  const isMultiChoice = type === "multi_choice";
  const specimen = isSpecimenSource(raw);
  const backendLabel = raw.label || raw.raw_label || raw.code || raw.question_id;

  return {
    questionId: String(raw.question_id),
    markerId: String(raw.marker_id || ""),
    biomarkerName: raw.biomarker_name || "",
    label: specimen ? "Specimen source" : String(backendLabel),
    rawLabel: String(raw.raw_label || raw.label || ""),
    helperText: specimen ? SPECIMEN_SOURCE_HELPER : "",
    code: String(raw.code || ""),
    type,
    typeLabel: aoeTypeLabel(type),
    required: raw.required !== false,
    sequence: typeof raw.sequence === "number" ? raw.sequence : 0,
    constraint: raw.constraint ?? null,
    defaultValue: raw.default ?? null,
    options: isChoice || isMultiChoice ? (raw.options || []) : [],
    isChoice,
    isMultiChoice,
    isFastingDuplicate: Boolean(raw.is_fasting_duplicate),
  };
}

/** Count required/optional questions, ignoring fasting duplicates. */
export function countAoeQuestions(questions: RawAoeQuestion[] | undefined | null): AoeCounts {
  const list = Array.isArray(questions) ? questions : [];
  let required = 0;
  let optional = 0;
  for (const q of list) {
    if (q.is_fasting_duplicate) continue;
    if (q.required !== false) required += 1;
    else optional += 1;
  }
  return { required, optional };
}

/** Human-readable summary, e.g. "2 required · 1 optional" or "None". */
export function formatAoeCount(counts: AoeCounts): string {
  const parts: string[] = [];
  if (counts.required > 0) parts.push(`${counts.required} required`);
  if (counts.optional > 0) parts.push(`${counts.optional} optional`);
  return parts.length ? parts.join(" · ") : "None";
}
