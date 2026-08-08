export interface CorporateEmployerSummary {
  id: string;
  name: string;
  slug: string;
  status: "ready" | "provisioning" | "paused";
  status_label: string;
  invited_employees: number;
  active_employees: number;
  utilization_percent: number;
  monthly_fee_summary: string;
  branding?: Record<string, unknown>;
}

export interface CorporateOperatorSummary {
  id: string;
  name: string;
  employer_count: number;
  monthly_fee_summary: string;
  active_employee_count: number;
}

export interface CorporatePilotContext {
  enabled: true;
  source: "backend";
  mode: "operator";
  operator: CorporateOperatorSummary;
  available_employers: CorporateEmployerSummary[];
  recent_activity: Array<{ id: string; action: string; outcome: string; created_at: string }>;
}

export interface CorporateEmployerDashboardPayload {
  enabled: true;
  source: "backend";
  mode: "employer";
  context: CorporateEmployerSummary;
  metrics: {
    roster: number;
    active: number;
    invited: number;
    utilization_percent: number;
    assigned_programs: number;
    billing_snapshot: string;
  };
  program: null | {
    id: string;
    name: string;
    description: string;
    status: string;
    status_label: string;
    gates: GateSummary[];
    orientation_modules: OrientationModule[];
  };
  gate_snapshot: GateSummary[];
  activity: Array<{ id: string; action: string; outcome: string; created_at: string }>;
  privacy: string;
}

export interface GateSummary {
  number: number;
  name: string;
  description: string;
  count: number;
}

export interface OrientationModule {
  id: string;
  title: string;
  kind: string;
  minutes: number;
  status: string;
}

export interface CorporateHandoffUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  roles?: string[];
  primary_role?: string;
}

export type HandoffPreparationResult =
  | { status: "handoff_ready"; launchUrl: string; expiresAt: string }
  | { status: "backend_unavailable" }
  | { status: "forbidden" }
  | { status: "invalid_context" };
