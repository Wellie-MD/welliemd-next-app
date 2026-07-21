import type { ProgramQuestion, QuestionKind } from "@/features/treatments/types";

// Canonical filterable question types, in prototype display order. Flow
// elements (personal_details, state_routing, section) aren't real question
// "types" you filter by — the prototype excludes them from the type pills too.
export const FILTERABLE_KIND_ORDER: QuestionKind[] = [
  "text", "textarea", "number", "date", "email", "phone", "zip",
  "single_choice", "multiple_choice", "yes_no", "height_weight", "consent",
  "file_upload", "medication_dose", "pharmacy", "shipping_address",
  "checkout", "sex", "medical_conditions", "self_reported_meds",
  "allergies", "labs_preference", "bmi",
];

export const KIND_LABELS: Record<QuestionKind, string> = {
  text: "Text",
  textarea: "Long Text",
  number: "Number",
  date: "Date",
  email: "Email",
  phone: "Phone",
  zip: "ZIP Code",
  single_choice: "Single Choice",
  multiple_choice: "Multiple Choice",
  yes_no: "Yes/No",
  height_weight: "Height & Weight",
  consent: "Consent",
  file_upload: "File Upload",
  state_routing: "Service Area Check",
  medication_dose: "Medication Dose",
  pharmacy: "Pharmacy",
  personal_details: "Patient Authentication",
  shipping_address: "Shipping Address",
  sex: "Sex",
  medical_conditions: "Medical Conditions",
  self_reported_meds: "Self Reported Meds",
  allergies: "Allergies",
  labs_preference: "Labs Preference",
  checkout: "Checkout",
  section: "Common Section",
  bmi: "BMI",
};

export function formatKindLabel(kind: QuestionKind): string {
  return KIND_LABELS[kind] || (kind.charAt(0).toUpperCase() + kind.slice(1));
}

export function filterQuestions(questions: ProgramQuestion[], searchQuery: string, typeFilter: string) {
  let result = [...questions].sort((a, b) => a.order - b.order);
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    result = result.filter((question) =>
      question.text.toLowerCase().includes(query) || question.kind.toLowerCase().includes(query)
    );
  }
  if (typeFilter !== "all") {
    result = result.filter((question) => question.kind === typeFilter);
  }
  return result;
}

export function countQuestionTypes(questions: ProgramQuestion[]) {
  const counts: Record<string, number> = { all: questions.length };
  for (const kind of FILTERABLE_KIND_ORDER) counts[kind] = 0;
  for (const question of questions) {
    if (question.kind in counts) counts[question.kind]++;
  }
  return counts;
}
