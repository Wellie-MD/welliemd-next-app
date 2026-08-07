export interface CorporateEmployerSummary {
  id: string;
  name: string;
  status: "Ready" | "Provisioning";
  invitedEmployees: number;
  activeEmployees: number;
}

export interface CorporateOperatorSummary {
  id: string;
  name: string;
  employerCount: number;
  monthlyFeeSummary: string;
}

export interface AssignedProgramSummary {
  id: string;
  name: string;
  status: "Pilot ready";
}

export interface CorporatePilotContext {
  enabled: true;
  source: "demo";
  mode: "operator" | "employer";
  operator: CorporateOperatorSummary;
  employer?: CorporateEmployerSummary;
  availableEmployers: CorporateEmployerSummary[];
  program: AssignedProgramSummary;
}

export type HandoffPreparationResult =
  | { status: "preview_ready"; launchUrl: string }
  | { status: "backend_unavailable" }
  | { status: "forbidden" }
  | { status: "invalid_context" };
