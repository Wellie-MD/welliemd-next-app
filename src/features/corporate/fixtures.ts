import type { CorporatePilotContext } from "./contracts";

export const corporatePilotFixture: CorporatePilotContext = {
  enabled: true,
  source: "demo",
  mode: "operator",
  operator: {
    id: "pilot-operator",
    name: "Pilot Health Operator",
    employerCount: 2,
    monthlyFeeSummary: "$—",
  },
  availableEmployers: [
    { id: "pilot-employer-north", name: "Northstar Manufacturing", status: "Ready", invitedEmployees: 84, activeEmployees: 61 },
    { id: "pilot-employer-west", name: "Westfield Services", status: "Provisioning", invitedEmployees: 0, activeEmployees: 0 },
  ],
  program: { id: "pilot-program", name: "Workforce Metabolic Health", status: "Pilot ready" },
};

export const defaultPilotEmployer = corporatePilotFixture.availableEmployers[0];
