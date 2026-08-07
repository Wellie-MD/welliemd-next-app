import type { EmployeeCorporateContext } from "./contracts";

export const employeeCorporateFixture: EmployeeCorporateContext = {
  enabled: true,
  source: "demo",
  mode: "employee",
  program: {
    id: "pilot-program",
    name: "Workforce Metabolic Health",
    employerName: "Northstar Manufacturing",
    description: "A guided employer-sponsored program with education, intake, and clinical review milestones.",
    currentGate: 0,
    status: "Ready to begin",
  },
};
