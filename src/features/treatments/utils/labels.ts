import type { FlowItemKind, ProgramStage, TreatmentLibraryScope } from "@/features/treatments/types";

export const formatProgramStage = (stage: ProgramStage) =>
  stage === "intake" ? "Intake" : "Follow-up";

export const formatScope = (scope: TreatmentLibraryScope) => {
  if (scope === "global") return "Global";
  return "Selected Visit Types";
};

/** Format an ISO date (YYYY-MM-DD) as MM/DD/YYYY; passes through unknown formats. */
export const formatDateUS = (iso: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  const [, year, month, day] = match;
  return `${month}/${day}/${year}`;
};

export const formatFlowItemKind = (kind: FlowItemKind) => {
  const labels: Record<FlowItemKind, string> = {
    authentication: "Patient Authentication",
    program: "Program",
    section: "Section",
    consent: "Consent",
    routing_question: "Routing Question",
    checkout: "Checkout",
  };

  return labels[kind] || String(kind).replace(/_/g, " ");
};
