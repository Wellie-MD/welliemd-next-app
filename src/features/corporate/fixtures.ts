import type { CorporatePilotContext } from "./contracts";

export const platformCorporatePilot: CorporatePilotContext = {
  enabled: true,
  source: "demo",
  mode: "platform",
  operatorCount: 1,
  employerCount: 2,
  operators: [
    {
      id: "pilot-operator",
      name: "Pilot Health Operator",
      accountType: "Corporate Operator",
      status: "Ready",
      employerCount: 2,
    },
  ],
};
