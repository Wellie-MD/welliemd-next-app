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

    // Construct KPI data from real metrics or fallback to mock
    const kpiData: Metric[] = metrics ? [
        {
            title: "Total Patients",
            value: metrics.total_patients.toString(),
            change: "+0%", // API doesn't provide patient growth yet
            trend: "neutral" // Fixed string literal type
        },
        {
            title: "Total Revenue",
            value: `$${metrics.total_revenue.toLocaleString()}`,
            change: `${metrics.growth_percentage > 0 ? '+' : ''}${metrics.growth_percentage}%`,
            trend: metrics.growth_percentage >= 0 ? "up" : "down"
        },
        {
            title: "Total Profit",
            value: `$${metrics.total_profit.toLocaleString()}`,
            change: "+0%", // API doesn't provide profit growth yet
            trend: "neutral"
        },
        {
            title: "Total Expense",
            value: `$${metrics.total_expenses.toLocaleString()}`,
            change: "+0%", // API doesn't provide profit growth yet
            trend: "neutral"
        },
        {
            title: "Total Sales",
            value: `$${metrics.total_sales.toLocaleString()}`,
            change: "+0%", // API doesn't provide profit growth yet
            trend: "neutral"
        },
        {
            title: "Total Orders",
            value: metrics.total_orders.toString(),
            change: "+0%", // API doesn't provide order growth yet
            trend: "neutral"
        },
        {
            title: "Total Growth",
            value: `${metrics.growth_percentage}%`,
            change: `${metrics.growth_percentage > 0 ? '+' : ''}${metrics.growth_percentage}%`,
            trend: metrics.growth_percentage >= 0 ? "up" : "down"
        }
        // ,
        // {
        //     title: "Total Online Sessions",
        //     value: "0",
        //     change: "+0%",
        //     trend: "up"
        // },
        // {
        //     title: "Conversion Rate",
        //     value: "0.0%",
        //     change: "+0%",
        //     trend: "up"
        // },
        // {
        //     title: "Full Refunds",
        //     value: "0",
        //     change: "-0%",
        //     trend: "down"
        // },
        // {
        //     title: "Partial Refunds",
        //     value: "0",
        //     change: "-0%",
        //     trend: "down"
        // }
    ] : fallbackKpis;

    const { dashboard } = mockData;

    const patientSummary = {
        active_patients: metrics?.patient_summary?.active_patients ?? dashboard.patientSummary.active_patients,
        inactive_patients: metrics?.patient_summary?.inactive_patients ?? dashboard.patientSummary.inactive_patients,
        drop_off_patients: metrics?.patient_summary?.drop_off_patients ?? dashboard.patientSummary.drop_off_patients,
    };

    return {
        metrics,
        kpiData,
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
