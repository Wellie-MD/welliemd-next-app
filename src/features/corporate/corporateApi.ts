import api from "@/api/axiosInstance";
import type { CorporatePilotContext } from "./contracts";

export async function fetchCorporatePlatformOverview(): Promise<CorporatePilotContext> {
  const { data } = await api.get<CorporatePilotContext>("/corporate/platform/overview/");
  return data;
}
