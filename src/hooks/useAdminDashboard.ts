import { useState, useEffect, useCallback } from "react";
import { getAdminDashboardOverview, DashboardData, DashboardOverviewParams } from "@/api/dashboardApi";

export const useAdminDashboard = (params?: DashboardOverviewParams) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Memoize params to avoid infinite loops if passed as inline object
  const paramsStr = JSON.stringify(params);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminDashboardOverview(params);
      console.log({ data });

      setDashboardData(data);
      setError(null);
    } catch (err) {
      console.error("Failed to load admin dashboard:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [paramsStr]); // react to param changes

  useEffect(() => {
    loadDashboard();

    // Refetch every 5 minutes
    const interval = setInterval(() => {
      loadDashboard();
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [loadDashboard]);

  return {
    dashboardData,
    loading,
    error,
    refetch: loadDashboard,
  };
};
