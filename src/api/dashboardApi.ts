import axiosInstance from "./axiosInstance";
import { DashboardMetrics, DashboardChartResponse } from "@/types/dashboard";

export interface DashboardFilters {
  start_date?: string;
  end_date?: string;
  comparison_start_date?: string;
  comparison_end_date?: string;
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
): Promise<DashboardChartResponse> => {
  const queryParams = {
    ...(year ? { year } : {}),
    ...(params || {}),
  };
  const response = await axiosInstance.get("dashboard/charts/", { params: queryParams });
  return response.data;
};
