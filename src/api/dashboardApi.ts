import axiosInstance from "./axiosInstance";
import { DashboardMetrics, ChartDataPoint } from "@/types/dashboard";

export const fetchDashboardMetrics = async (): Promise<DashboardMetrics> => {
  try {
    const response = await axiosInstance.get("dashboard/metrics/");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchDashboardCharts = async (
  year?: number,
): Promise<ChartDataPoint[]> => {
  try {
    const params = year ? { year } : {};
    const response = await axiosInstance.get("dashboard/charts?year=2026", { params });
    console.log({ chartData: response.data });

    return response.data;
  } catch (error) {
    throw error;
  }
};
