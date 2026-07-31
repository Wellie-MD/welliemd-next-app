import { useState, useEffect } from 'react';
import { fetchDashboardMetrics, DashboardFilters } from '@/api/dashboardApi';
import { DashboardMetrics, Metric } from '@/types/dashboard';
import mockData from "@/data/mockData.json";

interface UseDashboardMetricsProps {
    fallbackKpis: Metric[];
    filters?: DashboardFilters;
}

export const useDashboardMetrics = ({ fallbackKpis, filters }: UseDashboardMetricsProps) => {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<unknown>(null);
    const filtersKey = JSON.stringify(filters || {});

    useEffect(() => {
        const loadMetrics = async () => {
            try {
                setLoading(true);
                const parsedFilters = JSON.parse(filtersKey) as DashboardFilters;
                const data = await fetchDashboardMetrics(parsedFilters);
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
    }, [filtersKey]);

    const safeNumber = (value: number | undefined) => (typeof value === "number" ? value : 0);
    const growth = safeNumber(metrics?.growth_percentage);

    const parseMetricValue = (value: string) => {
        const parsed = parseFloat(value.replace(/[$,%]/g, ""));
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const stripLeadingPlus = (value: string) => value.replace(/^\+/, "");

    const formatPercentValue = (value: number) => `${value.toFixed(1)}%`;

    const normalizeKpis = (kpis: Metric[], totals?: DashboardMetrics): Metric[] => {
        const find = (titles: string[]) => kpis.find((kpi) => titles.includes(kpi.title));

        const revenue = find(["Revenue", "Total Revenue"]);
        const expenses = find(["Expenses", "Total Expense"]);
        const netProfit = find(["Net Profit", "Total Profit"]);
        const profitRatio = find(["Profit Ratio %", "Profit Ratio"]);
        const revenueGrowth = find(["Total Growth By Revenue %", "Total Growth"]);
        const netProfitGrowth = find(["Total Growth By Net Profit %"]);

        const revenueValue = revenue?.value ?? `$${safeNumber(totals?.total_revenue).toLocaleString()}`;
        const expensesValue = expenses?.value ?? `$${safeNumber(totals?.total_expenses).toLocaleString()}`;
        const netProfitValue = netProfit?.value ?? `$${safeNumber(totals?.total_profit).toLocaleString()}`;

        const revenueNumeric = parseMetricValue(revenueValue);
        const netProfitNumeric = parseMetricValue(netProfitValue);

        const profitRatioValue = profitRatio?.value ?? (
            revenueNumeric > 0
                ? formatPercentValue((netProfitNumeric / revenueNumeric) * 100)
                : "0.0%"
        );

        const netProfitGrowthValue = netProfitGrowth?.value
            ?? (netProfit?.change ? stripLeadingPlus(netProfit.change) : "0.0%");

        const revenueGrowthValue = revenueGrowth?.value
            ?? formatPercentValue(safeNumber(totals?.growth_percentage));

        const required: Metric[] = [
            {
                title: "Revenue",
                value: revenueValue,
                change: revenue?.change ?? "0.0%",
                trend: revenue?.trend ?? "neutral",
                impact: revenue?.impact ?? "neutral",
            },
            {
                title: "Expenses",
                value: expensesValue,
                change: expenses?.change ?? "0.0%",
                trend: expenses?.trend ?? "neutral",
                impact: expenses?.impact ?? "neutral",
            },
            {
                title: "Net Profit",
                value: netProfitValue,
                change: netProfit?.change ?? "0.0%",
                trend: netProfit?.trend ?? "neutral",
                impact: netProfit?.impact ?? "neutral",
            },
            {
                title: "Profit Ratio %",
                value: profitRatioValue,
                change: profitRatio?.change ?? "0.0%",
                trend: profitRatio?.trend ?? netProfit?.trend ?? "neutral",
                impact: profitRatio?.impact ?? netProfit?.impact ?? "neutral",
            },
            {
                title: "Total Growth By Revenue %",
                value: revenueGrowthValue,
                change: revenueGrowth?.change ?? "0.0%",
                trend: revenueGrowth?.trend ?? "neutral",
                impact: revenueGrowth?.impact ?? "neutral",
            },
            {
                title: "Total Growth By Net Profit %",
                value: netProfitGrowthValue,
                change: netProfitGrowth?.change ?? netProfitGrowthValue,
                trend: netProfitGrowth?.trend ?? netProfit?.trend ?? "neutral",
                impact: netProfitGrowth?.impact ?? netProfit?.impact ?? "neutral",
            },
        ];

        const requiredTitles = new Set(required.map((metric) => metric.title));
        const extras = kpis.filter((metric) => !requiredTitles.has(metric.title));

        return [...required, ...extras];
    };

    // Support both API shapes:
    // 1) explicit `kpis` array
    // 2) totals payload (total_revenue, total_orders, etc.) -> derive KPIs
    const rawKpis: Metric[] = metrics?.kpis && metrics.kpis.length > 0
        ? metrics.kpis
        : metrics
            ? [
                {
                    title: "Total Patients",
                    value: safeNumber(metrics.total_patients).toString(),
                    change: "+0%", // API doesn't provide patient growth yet
                    trend: "neutral",
                    impact: "neutral",
                },
                {
                    title: "Total Revenue",
                    value: `$${safeNumber(metrics.total_revenue).toLocaleString()}`,
                    change: `${growth > 0 ? '+' : ''}${growth}%`,
                    trend: growth > 0 ? "up" : growth < 0 ? "down" : "neutral",
                    impact: growth > 0 ? "good" : growth < 0 ? "bad" : "neutral",
                },
                {
                    title: "Total Profit",
                    value: `$${safeNumber(metrics.total_profit).toLocaleString()}`,
                    change: "+0%",
                    trend: "neutral",
                    impact: "neutral",
                },
                {
                    title: "Total Expense",
                    value: `$${safeNumber(metrics.total_expenses).toLocaleString()}`,
                    change: "+0%",
                    trend: "neutral",
                    impact: "neutral",
                },
                {
                    title: "Total Sales",
                    value: `${safeNumber(metrics.total_sales).toLocaleString()}`,
                    change: "+0%",
                    trend: "neutral",
                    impact: "neutral",
                },
                {
                    title: "Total Orders",
                    value: safeNumber(metrics.total_orders).toString(),
                    change: "+0%",
                    trend: "neutral",
                    impact: "neutral",
                },
                {
                    title: "Total Growth",
                    value: `${growth}%`,
                    change: `${growth > 0 ? '+' : ''}${growth}%`,
                    trend: growth > 0 ? "up" : growth < 0 ? "down" : "neutral",
                    impact: growth > 0 ? "good" : growth < 0 ? "bad" : "neutral",
                }
            ]
            : fallbackKpis;

    const kpiData = normalizeKpis(rawKpis, metrics);

    const { dashboard } = mockData;

    const liveSummary = {
        active_carts: metrics?.live_summary?.active_carts ?? dashboard.liveSummary.active_carts,
        checking_out: metrics?.live_summary?.checking_out ?? dashboard.liveSummary.checking_out,
        purchased: metrics?.live_summary?.purchased ?? dashboard.liveSummary.purchased,
    };

    const patientSummary = {
        active_patients: metrics?.patient_summary?.active_patients ?? liveSummary.active_carts,
        in_review_patients: metrics?.patient_summary?.in_review_patients ?? metrics?.patient_summary?.inactive_patients ?? liveSummary.checking_out,
        lapsed_patients: metrics?.patient_summary?.lapsed_patients ?? metrics?.patient_summary?.inactive_patients ?? 0,
        registered_patients: metrics?.patient_summary?.registered_patients ?? metrics?.patient_summary?.dropoff_patients ?? liveSummary.purchased,
        total_patients: metrics?.patient_summary?.total_patients,
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
                const parsedFilters = JSON.parse(filtersKey) as DashboardFilters;
                const data = await fetchDashboardMetrics(parsedFilters);
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
