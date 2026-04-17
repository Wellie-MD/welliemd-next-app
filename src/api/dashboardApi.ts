import axiosInstance from "./axiosInstance";
import { DashboardMetrics, ChartDataPoint } from "@/types/dashboard";

export interface DashboardFilters {
  start_date?: string;
  end_date?: string;
}

export const fetchDashboardMetrics = async (
  params?: DashboardFilters,
): Promise<DashboardMetrics> => {
  const response = await axiosInstance.get("dashboard/metrics/", { params });
  return response.data;
};

export const fetchDashboardCharts = async (
  year?: number,
  params?: DashboardFilters,
): Promise<ChartDataPoint[]> => {
  const queryParams = {
    ...(year ? { year } : {}),
    ...(params || {}),
  };
  const response = await axiosInstance.get("dashboard/charts/", { params: queryParams });
  console.log({ chartData: response.data });
  return response.data;
};
