import type { QuestionKind } from "@/features/treatments/types";

export const PROGRAM_AUTHORING_COPY = {
  subtitle: "Manage questions for this template",
  searchPlaceholder: "Search questions, answers, or mapped field",
  authTitle: "Patient Authentication",
  authDescription: "Email — login if existing, create account if new",
  checkoutSection: "Checkout",
  testFlow: "Test Patient Flow",
} as const;

export const PROGRAM_QUESTION_KIND_ORDER: QuestionKind[] = [
  "text",
  "textarea",
  "number",
  "date",
  "email",
  "phone",
  "zip",
  "single_choice",
  "multiple_choice",
  "yes_no",
  "height_weight",
  "consent",
  "file_upload",
  "state_routing",
  "medication_dose",
  "pharmacy",
  "personal_details",
  "shipping_address",
  "checkout",
  "sex",
  "medical_conditions",
  "self_reported_meds",
  "allergies",
  "labs_preference",
];

export const PROGRAM_QUESTION_KIND_LABELS: Record<QuestionKind, string> = {
  text: "Text",
  textarea: "Textarea",
  number: "Number",
  date: "Date",
  email: "Email",
  phone: "Phone",
  zip: "Zip",
  single_choice: "Single Choice",
  multiple_choice: "Multiple Choice",
  yes_no: "Yes No",
  height_weight: "Height Weight",
  consent: "Consent",
  file_upload: "File Upload",
  state_routing: "State Routing",
  medication_dose: "Medication Dose",
  pharmacy: "Pharmacy",
  personal_details: "Authentication",
  shipping_address: "Shipping Address",
  checkout: "Checkout",
  sex: "Sex",
  medical_conditions: "Medical Conditions",
  self_reported_meds: "Self Reported Meds",
  allergies: "Allergies",
  labs_preference: "Labs Preference",
  section: "Common Section",
  bmi: "BMI",
};

export const PROGRAM_ELEMENT_TONES = {
  auth: {
    icon: "border-amber-200 bg-amber-50 text-amber-700",
    badge: "border-amber-200 bg-amber-50 text-amber-800",
    active: "border-l-amber-500 bg-amber-50/70",
  },
  checkout: {
    icon: "border-emerald-200 bg-emerald-50 text-emerald-700",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
    active: "border-l-emerald-500 bg-emerald-50/70",
  },
  consent: {
    icon: "border-violet-200 bg-violet-50 text-violet-700",
    badge: "border-violet-200 bg-violet-50 text-violet-800",
    active: "border-l-violet-500 bg-violet-50/70",
  },
  section: {
    icon: "border-blue-200 bg-blue-50 text-blue-700",
    badge: "border-blue-200 bg-blue-50 text-blue-800",
    active: "border-l-blue-500 bg-blue-50/70",
  },
  question: {
    icon: "border-slate-200 bg-white text-slate-500",
    badge: "border-slate-200 bg-slate-50 text-slate-600",
    active: "border-l-blue-500 bg-blue-50/70",
  },
} as const;

export const programAuthenticationId = (programId: string) => `program-auth-${programId}`;

