export interface CorporateOperatorSummary {
  id: string;
  name: string;
  account_type: "Corporate Operator";
  status: "Ready" | "Paused";
  employer_count: number;
}

export interface CorporatePilotContext {
  enabled: true;
  source: "backend";
  mode: "platform";
  operator_count: number;
  employer_count: number;
  operators: CorporateOperatorSummary[];
  checkpoints: { navigation: string; handoff: string; rbac_audit: string };
}
