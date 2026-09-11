export type PatientEngagementStatus =
  | "active"
  | "in_review"
  | "lapsed"
  | "registered";

export const PATIENT_STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "In Review", value: "in_review" },
  { label: "Lapsed", value: "lapsed" },
  { label: "Registered", value: "registered" },
] as const;
