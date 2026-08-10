export interface EmployeeGateSummary {
  number: 0 | 1 | 2;
  name: string;
  description: string;
  count: number;
}

export interface EmployeeOrientationModule {
  id: string;
  title: string;
  kind: string;
  minutes: number;
  status: string;
}

export interface EmployeeCorporateContext {
  assigned: true;
  source: "backend";
  mode: "employee";
  employer: { id: string; name: string; branding: Record<string, unknown> };
  program: {
    id: string;
    name: string;
    description: string;
    status: string;
    status_label: string;
    gates: EmployeeGateSummary[];
    orientation_modules: EmployeeOrientationModule[];
  };
  enrollment: {
    id: string;
    status: string;
    status_label: string;
    current_gate: 0 | 1 | 2;
    gate_progress: Record<string, { state?: string; completed?: boolean; completed_modules?: number; total_modules?: number }>;
  };
  gates: EmployeeGateSummary[];
  allowed_routes: string[];
  clinical_access_enabled: boolean;
  assigned_questionnaire: {
    available: boolean;
    url: string | null;
    template_id: string | null;
  };
}
