import { useState, useEffect } from "react";
import { getAdminDashboardOverview, DashboardData } from "@/api/dashboardApi";

export const useAdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await getAdminDashboardOverview();
      console.log({ data });

      setDashboardData(data);
      setError(null);
    } catch (err) {
      console.error("Failed to load admin dashboard:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    // Refetch every 5 minutes
    const interval = setInterval(() => {
      loadDashboard();
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  return {
    dashboardData,
    loading,
    error,
    refetch: loadDashboard,
  };
};
