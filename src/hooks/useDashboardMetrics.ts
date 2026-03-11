import { useState, useEffect } from 'react';
import { fetchDashboardMetrics } from '@/api/dashboardApi';
import { DashboardMetrics, Metric } from '@/types/dashboard';
import mockData from "@/data/mockData.json";

interface UseDashboardMetricsProps {
    fallbackKpis: Metric[];
}

export const useDashboardMetrics = ({ fallbackKpis }: UseDashboardMetricsProps) => {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<unknown>(null);

    useEffect(() => {
        const loadMetrics = async () => {
            try {
                setLoading(true);
                const data = await fetchDashboardMetrics();
                console.log({data});
                setMetrics(data);
                setError(null);
            } catch (err) {
                console.error("Failed to load dashboard metrics:", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        loadMetrics();
    }, []);

    const kpiData: Metric[] = metrics?.kpis ?? fallbackKpis;

    const { dashboard } = mockData;

    const liveSummary = {
        active_carts: metrics?.live_summary?.active_carts ?? dashboard.liveSummary.active_carts,
        checking_out: metrics?.live_summary?.checking_out ?? dashboard.liveSummary.checking_out,
        purchased: metrics?.live_summary?.purchased ?? dashboard.liveSummary.purchased,
    };

    const patientSummary = {
        active_patients: metrics?.patient_summary?.active_patients ?? liveSummary.active_carts,
        inactive_patients: metrics?.patient_summary?.inactive_patients ?? liveSummary.checking_out,
        dropoff_patients: metrics?.patient_summary?.dropoff_patients ?? liveSummary.purchased,
        calculated_at: metrics?.patient_summary?.calculated_at ?? "",
    };

    return {
        metrics,
        kpiData,
        liveSummary,
        patientSummary,
        loading,
        error,
        refetch: async () => {
            setLoading(true);
            try {
                const data = await fetchDashboardMetrics();
                setMetrics(data);
                setError(null);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        }
    };
};
