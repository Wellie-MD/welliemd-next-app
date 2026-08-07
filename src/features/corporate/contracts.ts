export interface EmployeeProgramSummary {
  id: string;
  name: string;
  employerName: string;
  description: string;
  currentGate: 0 | 1 | 2;
  status: "Ready to begin";
}

export interface EmployeeCorporateContext {
  enabled: true;
  source: "demo";
  mode: "employee";
  program: EmployeeProgramSummary;
}
