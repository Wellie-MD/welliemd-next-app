import axiosInstance from "./axiosInstance";
import { DashboardMetrics, ChartDataPoint } from "@/types/dashboard";

export const fetchDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const response = await axiosInstance.get("dashboard/metrics/");
  return response.data;
};

export const fetchDashboardCharts = async (
  year?: number,
): Promise<ChartDataPoint[]> => {
  const params = year ? { year } : {};
  const response = await axiosInstance.get("dashboard/charts/", { params });
  console.log({ chartData: response.data });
  return response.data;
};
