import type { FlowItemKind, ProgramStage, TreatmentLibraryScope } from "../types";

export const formatProgramStage = (stage: ProgramStage) =>
  stage === "intake" ? "Intake" : "Follow-up";

export const formatScope = (scope: TreatmentLibraryScope) => {
  if (scope === "global") return "Global";
  if (scope === "shared") return "Shared";
  return "Treatment";
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

  return labels[kind];
};
