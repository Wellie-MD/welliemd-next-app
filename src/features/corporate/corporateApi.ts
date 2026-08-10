import { apiClient } from "@/shared/api/client";
import type { EmployeeCorporateContext } from "./contracts";

export async function fetchAssignedProgram(): Promise<EmployeeCorporateContext> {
  const { data } = await apiClient.get<EmployeeCorporateContext>("/corporate/employee/program/");
  return data;
}

export async function advanceToGateOne(): Promise<{ current_gate: 0 | 1 | 2 }> {
  const { data } = await apiClient.post<{ current_gate: 0 | 1 | 2 }>("/corporate/employee/program/advance/");
  return data;
}
