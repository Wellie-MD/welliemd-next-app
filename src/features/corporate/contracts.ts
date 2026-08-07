export type CorporateMode = "platform" | "operator" | "employer" | "employee";

export interface CorporateOperatorSummary {
  id: string;
  name: string;
  accountType: "Corporate Operator";
  status: "Ready" | "Configuration pending";
  employerCount: number;
}

export interface CorporatePilotContext {
  enabled: true;
  source: "demo";
  mode: CorporateMode;
  operatorCount: number;
  employerCount: number;
  operators: CorporateOperatorSummary[];
}
