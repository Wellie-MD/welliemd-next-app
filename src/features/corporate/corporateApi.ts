import { apiClient } from "@/shared/api/client";
import type { EmployeeCorporateContext } from "./contracts";

export async function fetchAssignedProgram(): Promise<EmployeeCorporateContext> {
  const { data } = await apiClient.get<EmployeeCorporateContext>("/corporate/employee/program/");
  return data;
}
