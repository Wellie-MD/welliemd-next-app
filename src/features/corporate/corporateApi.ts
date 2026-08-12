import api from "@/api/axiosInstance";
import type { CorporateEmployerDashboardPayload, CorporateHandoffUser, CorporatePilotContext, CorporateProgramSummary } from "./contracts";

export async function fetchOperatorContext(): Promise<CorporatePilotContext> {
  const { data } = await api.get<CorporatePilotContext>("/corporate/operator/context/");
  return data;
}

export async function createEmployerHandoff(tenantId: string): Promise<{ launch_url: string; expires_at: string }> {
  const { data } = await api.post("/corporate/operator/handoffs/", { tenant_id: tenantId });
  return data;
}

export async function exchangeEmployerHandoff(handoffCode: string): Promise<{
  access: string;
  user: CorporateHandoffUser;
  context: Record<string, unknown>;
  redirect: string;
}> {
  const { data } = await api.post("/corporate/handoffs/exchange/", { handoff_code: handoffCode }, { skipAuthRedirect: true });
  return data;
}

export async function fetchEmployerDashboard(): Promise<CorporateEmployerDashboardPayload> {
  const { data } = await api.get<CorporateEmployerDashboardPayload>("/corporate/employer/dashboard/");
  return data;
}

export async function assignProgramToEmployer(tenantId: string, programId: string): Promise<{
  tenant: CorporatePilotContext["available_employers"][number];
  program: CorporateProgramSummary;
  created: boolean;
}> {
  const { data } = await api.post("/corporate/operator/programs/assign/", {
    tenant_id: tenantId,
    program_id: programId,
  });
  return data;
}
