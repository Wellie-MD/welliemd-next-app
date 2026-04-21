"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarIcon, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  subDays,
  startOfYear,
  endOfYear,
  isSameDay,
  subMonths,
  startOfDay,
  endOfDay,
  parseISO,
  isWithinInterval,
} from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { NewPatientChart } from "@/components/dashboard/NewPatientChart";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { Metric } from "@/types/dashboard";
import type { B2BInvoice } from "@/types/b2bBilling";
import { clientApi } from "@/api/clientApi";
import mockData from "@/data/mockData.json";

interface DateRange {
  from: Date;
  to: Date;
}

const extractChartPointDate = (point: { month?: string; day?: string }) => {
  if (point.day) {
    const parsedDay = parseISO(point.day);
    return Number.isNaN(parsedDay.getTime()) ? null : parsedDay;
  }
  if (point.month) {
    const parsedMonth = parseISO(`${point.month}-01`);
    return Number.isNaN(parsedMonth.getTime()) ? null : parsedMonth;
  }
  return null;
};

const PRESET_RANGES = [
  { label: '7 D', getValue: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
  { label: '30 D', getValue: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  { label: '90 D', getValue: () => ({ from: subDays(new Date(), 89), to: new Date() }) },
  { label: 'YTD', getValue: () => ({ from: startOfYear(new Date()), to: new Date() }) },
  {
    label: 'Last Year',
    getValue: () => ({
      from: startOfYear(subMonths(new Date(), 12)),
      to: endOfYear(subMonths(new Date(), 12)),
    }),
  },
];

const getMetricByTitle = (kpis: Metric[], titles: string[]) =>
  kpis.find((kpi) => titles.includes(kpi.title));

const stripLeadingPlus = (value: string) => value.replace(/^\+/, "");

const formatLabel = (value?: string | null) =>
  (value || "-")
    .toString()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());

const formatMoney = (value?: string | number | null) => {
  const n = Number(value || 0);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : "$0.00";
};

const formatBreakdown = (inv: B2BInvoice) => {
  const items = (inv as any).line_items ?? [];
  if (!Array.isArray(items) || items.length === 0) return "-";

  const pharmacy = items
    .filter((li: any) => ["medication_reimbursement", "shipping_cost"].includes(li.item_type))
    .reduce((sum: number, li: any) => sum + Number(li.total_amount || li.unit_price || 0), 0);
  const consult = items
    .filter((li: any) => li.item_type === "consultation")
    .reduce((sum: number, li: any) => sum + Number(li.total_amount || li.unit_price || 0), 0);
  const usage = items
    .filter((li: any) => ["saas_base_monthly", "active_patient", "saas_usage_patient"].includes(li.item_type))
    .reduce((sum: number, li: any) => sum + Number(li.total_amount || li.unit_price || 0), 0);

  if (inv.invoice_type === "reimbursement") {
    if (!pharmacy && !consult) return "-";
    return `Pharmacy: ${formatMoney(pharmacy)} · Consult: ${formatMoney(consult)}`;
  }
  if (inv.invoice_type === "saas_fee") {
    if (!usage) return "-";
    return `Usage: ${formatMoney(usage)}`;
  }
  return "-";
};

const normalizeAdminKpis = (
  kpis: Metric[],
  patientSummary?: {
    active_patients: number;
    inactive_patients: number;
    dropoff_patients: number;
  },
): Metric[] => {
  const revenue = getMetricByTitle(kpis, ["Revenue", "Total Revenue"]);
  const expenses = getMetricByTitle(kpis, ["Expenses", "Total Expense"]);
  const netProfit = getMetricByTitle(kpis, ["Net Profit"]);
  const profitRatio = getMetricByTitle(kpis, ["Profit Ratio %", "Profit Ratio"]);
  const revenueGrowth = getMetricByTitle(kpis, ["Total Growth By Revenue %", "Total Growth By Revenue"]);
  const netProfitGrowth = getMetricByTitle(kpis, ["Total Growth By Net Profit %"]);
  const reimbursementInvoices = getMetricByTitle(kpis, ["Reimbursement Invoices"]);
  const saasInvoices = getMetricByTitle(kpis, ["SaaS Invoices"]);

  const profitGrowthValue = netProfitGrowth?.value
    ?? (netProfit ? stripLeadingPlus(netProfit.change) : "0.0%");

  const required: Metric[] = [
    revenue && { ...revenue, title: "Revenue" },
    expenses && { ...expenses, title: "Expenses" },
    netProfit && { ...netProfit, title: "Net Profit" },
    profitRatio && { ...profitRatio, title: "Profit Ratio %" },
    revenueGrowth && { ...revenueGrowth, title: "Total Growth By Revenue %" },
    {
      title: "Total Growth By Net Profit %",
      value: profitGrowthValue,
      change: netProfitGrowth?.change ?? profitGrowthValue,
      trend: netProfitGrowth?.trend ?? netProfit?.trend ?? "neutral",
      impact: netProfitGrowth?.impact ?? netProfit?.impact ?? "neutral",
    },
    {
      title: "Number of Active Patients",
      value: patientSummary ? patientSummary.active_patients.toString() : "0",
      change: "0.0%",
      trend: "neutral",
      impact: "neutral",
    },
    {
      title: "Number of Inactive Patients",
      value: patientSummary ? patientSummary.inactive_patients.toString() : "0",
      change: "0.0%",
      trend: "neutral",
      impact: "neutral",
    },
    {
      title: "Number of drop-off Patients",
      value: patientSummary ? patientSummary.dropoff_patients.toString() : "0",
      change: "0.0%",
      trend: "neutral",
      impact: "neutral",
    },
    {
      title: "Reimbursement Invoices",
      value: reimbursementInvoices?.value ?? "0",
      change: reimbursementInvoices?.change ?? "0.0%",
      trend: reimbursementInvoices?.trend ?? "neutral",
      impact: reimbursementInvoices?.impact ?? "neutral",
    },
    {
      title: "SaaS Invoices",
      value: saasInvoices?.value ?? "0",
      change: saasInvoices?.change ?? "0.0%",
      trend: saasInvoices?.trend ?? "neutral",
      impact: saasInvoices?.impact ?? "neutral",
    },
  ].filter(Boolean) as Metric[];

  const requiredTitles = new Set(required.map((metric) => metric.title.toLowerCase()));
  const hiddenLegacyTitles = new Set(["total sales", "total orders"]);
  const extras = kpis.filter(
    (metric) =>
      !requiredTitles.has(metric.title.toLowerCase()) &&
      !hiddenLegacyTitles.has(metric.title.toLowerCase()),
  );

  return [...required, ...extras];
};

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<DateRange>(PRESET_RANGES[1].getValue());

  // Fetch dashboard data from API
  const { dashboardData, loading, error, refetch } = useAdminDashboard({
    start_date: format(dateRange.from, 'yyyy-MM-dd'),
    end_date: format(dateRange.to, 'yyyy-MM-dd'),
  });

  const activeRangeLabel = useMemo(() => {
    const match = PRESET_RANGES.find(p => {
      const r = p.getValue();
      return isSameDay(r.from, dateRange.from) && isSameDay(r.to, dateRange.to);
    });
    return match?.label || null;
  }, [dateRange]);

  // Use API data if available, otherwise fallback to mock data
  const dashboard = dashboardData || mockData.dashboard;
  const normalizedKpis = normalizeAdminKpis(
    dashboard.kpis,
    (dashboard as typeof dashboard & { patientSummary?: { active_patients: number; inactive_patients: number; dropoff_patients: number } }).patientSummary,
  );

  const metricsScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = metricsScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = metricsScrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateScrollButtons);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateScrollButtons]);

  const scrollMetrics = useCallback((direction: "left" | "right") => {
    const el = metricsScrollRef.current;
    if (!el) return;
    const scrollAmount = 320;
    el.scrollBy({ left: direction === "right" ? scrollAmount : -scrollAmount, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const id = setTimeout(updateScrollButtons, 50);
    return () => clearTimeout(id);
  }, [normalizedKpis, updateScrollButtons]);  const chartWindowLabel = `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`;
  const comparisonLabel = dashboard?.period ? "vs previous period" : undefined;

  const filteredSalesChartData = useMemo(
    () =>
      (dashboard?.salesChartData || []).filter((point) => {
        const pointDate = extractChartPointDate(point);
        if (!pointDate) return false;
        return isWithinInterval(pointDate, {
          start: startOfDay(dateRange.from),
          end: endOfDay(dateRange.to),
        });
      }),
    [dashboard?.salesChartData, dateRange.from, dateRange.to],
  );

  const filteredRevenueChartData = useMemo(
    () =>
      (dashboard?.revenueChartData || []).filter((point) => {
        const pointDate = extractChartPointDate(point);
        if (!pointDate) return false;
        return isWithinInterval(pointDate, {
          start: startOfDay(dateRange.from),
          end: endOfDay(dateRange.to),
        });
      }),
    [dashboard?.revenueChartData, dateRange.from, dateRange.to],
  );

  const filteredNewClientChartData = useMemo(
    () =>
      (dashboard?.newClientChartData || []).filter((point) => {
        const pointDate = extractChartPointDate(point);
        if (!pointDate) return false;
        return isWithinInterval(pointDate, {
          start: startOfDay(dateRange.from),
          end: endOfDay(dateRange.to),
        });
      }),
    [dashboard?.newClientChartData, dateRange.from, dateRange.to],
  );

  const dateFromParam = format(dateRange.from, "yyyy-MM-dd");
  const dateToParam = format(dateRange.to, "yyyy-MM-dd");

  const { data: reimbursementInvoicesData } = useQuery({
    queryKey: [
      "adminDashboardInvoices",
      "reimbursement",
      dateFromParam,
      dateToParam,
    ],
    queryFn: () =>
      clientApi.getAllB2BInvoices({
        invoice_type: "reimbursement",
        ordering: "-issued_at",
        page: 1,
        page_size: 8,
        issued_at_after: dateFromParam,
        issued_at_before: dateToParam,
      }),
  });

  const { data: saasInvoicesData } = useQuery({
    queryKey: [
      "adminDashboardInvoices",
      "saas_fee",
      dateFromParam,
      dateToParam,
    ],
    queryFn: () =>
      clientApi.getAllB2BInvoices({
        invoice_type: "saas_fee",
        ordering: "-issued_at",
        page: 1,
        page_size: 8,
        issued_at_after: dateFromParam,
        issued_at_before: dateToParam,
      }),
  });

  const reimbursementRows = (reimbursementInvoicesData?.results || []) as B2BInvoice[];
  const saasRows = (saasInvoicesData?.results || []) as B2BInvoice[];

  const handleKPIClick = (metric: Metric) => {
    console.log(`KPI clicked: ${metric.title}`);
  };

  // Show loading state
  if (loading && !dashboard) {
    return (
      <div className="p-4 space-y-4 w-full min-w-0 overflow-x-hidden">
        <div className="flex items-center justify-between min-w-0">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !dashboard) {
    return (
      <div className="p-4 space-y-4 w-full min-w-0 overflow-x-hidden">
        <div className="flex items-center justify-between min-w-0">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        </div>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-red-600">Failed to load dashboard data</p>
          <Button onClick={refetch}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 w-full min-w-0 overflow-x-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between min-w-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {dateRange.from && dateRange.to
              ? `${format(dateRange.from, 'MMM d, yyyy')} — ${format(dateRange.to, 'MMM d, yyyy')}`
              : 'Select range'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Quick presets */}
          <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 hidden sm:flex">
            {PRESET_RANGES.map(p => (
              <button
                key={p.label}
                onClick={() => setDateRange(p.getValue())}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                  activeRangeLabel === p.label
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Calendar */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <CalendarIcon className="h-3.5 w-3.5" />
                Custom
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range: { from?: Date; to?: Date } | undefined) =>
                  range?.from && setDateRange({ from: range.from, to: range.to || range.from })
                }
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Actions */}
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={refetch} disabled={loading}>
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* KPI Cards - Horizontally Scrollable */}
      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scrollMetrics("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all duration-200 -ml-3"
            aria-label="Scroll metrics left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <div
          ref={metricsScrollRef}
          onScroll={updateScrollButtons}
          className="overflow-x-auto -mx-4 px-4 scrollbar-hide"
        >
          <div className="flex gap-4 min-w-max">
            {normalizedKpis.map((kpi, index) => (
              <div
                key={index}
                onClick={() => handleKPIClick(kpi)}
                className="cursor-pointer"
              >
                <MetricCard metric={kpi} comparisonLabel={comparisonLabel} />
              </div>
            ))}
          </div>
        </div>

        {canScrollRight && (
          <button
            onClick={() => scrollMetrics("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all duration-200 -mr-3"
            aria-label="Scroll metrics right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1  gap-4 w-full min-w-0">
        {/* Total Sales Chart */}
        <div className="w-full min-w-0">
          <SalesChart data={filteredSalesChartData} subtitle={chartWindowLabel} />
        </div>

        {/* Live Summary */}
        {/* <div className="w-full min-w-0">
          <Card className="rounded-2xl shadow-md bg-white">
            <CardHeader className="flex flex-row items-center justify-between bg-blue-50 rounded-t-2xl p-4">
              <CardTitle className="text-gray-800">Live Summary</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700"
                onClick={() => handleViewMore("liveSummary")}
              >
                View More
              </Button>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                    <ShoppingCart className="h-6 w-6 text-gray-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">
                    {dashboard.liveSummary.activeCarts}
                  </p>
                  <p className="text-sm text-gray-600">Active Carts</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                    <Eye className="h-6 w-6 text-gray-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">
                    {dashboard.liveSummary.checkingOut}
                  </p>
                  <p className="text-sm text-gray-600">Checking Out</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                    <DollarSign className="h-6 w-6 text-gray-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">
                    {dashboard.liveSummary.purchased}
                  </p>
                  <p className="text-sm text-gray-600">Purchased</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div> */}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full min-w-0">
        {/* Net Revenue Chart */}
        <div className="w-full min-w-0">
          <RevenueChart data={filteredRevenueChartData} subtitle={chartWindowLabel} />
        </div>

        {/* Total Clients Chart */}
        <div className="w-full min-w-0">
          <NewPatientChart data={filteredNewClientChartData} subtitle={chartWindowLabel} />
        </div>
      </div>

      {/* Bottom Tables (Admin Invoice Views) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full min-w-0">
        <div className="w-full min-w-0">
          <Card className="rounded-2xl shadow-md bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Reimbursement Invoices</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-muted-foreground">
                    <tr className="border-b">
                      <th className="text-left py-2 pr-3">Date</th>
                      <th className="text-left py-2 pr-3">Invoice</th>
                      <th className="text-left py-2 pr-3">Client</th>
                      <th className="text-left py-2 pr-3">Status</th>
                      <th className="text-left py-2 pr-3">Breakdown</th>
                      <th className="text-right py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reimbursementRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-4 text-muted-foreground">
                          No reimbursement invoices in selected range.
                        </td>
                      </tr>
                    ) : (
                      reimbursementRows.map((inv) => {
                        const displayDate = inv.issued_at || inv.created_at;
                        const status = ((inv as any).is_overdue && inv.status !== "paid"
                          ? "overdue"
                          : inv.status || "-").toString();
                        return (
                          <tr key={inv.id} className="border-b last:border-0">
                            <td className="py-2 pr-3">
                              {displayDate ? new Date(displayDate).toLocaleDateString() : "-"}
                            </td>
                            <td className="py-2 pr-3 font-medium">{inv.invoice_number}</td>
                            <td className="py-2 pr-3">{(inv as any).client_name || "-"}</td>
                            <td className="py-2 pr-3">{formatLabel(status)}</td>
                            <td className="py-2 pr-3 text-muted-foreground">{formatBreakdown(inv)}</td>
                            <td className="py-2 text-right font-medium">{formatMoney(inv.total_amount)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="w-full min-w-0">
          <Card className="rounded-2xl shadow-md bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">SaaS Invoices</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-muted-foreground">
                    <tr className="border-b">
                      <th className="text-left py-2 pr-3">Date</th>
                      <th className="text-left py-2 pr-3">Invoice</th>
                      <th className="text-left py-2 pr-3">Client</th>
                      <th className="text-left py-2 pr-3">Status</th>
                      <th className="text-left py-2 pr-3">Breakdown</th>
                      <th className="text-right py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {saasRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-4 text-muted-foreground">
                          No SaaS invoices in selected range.
                        </td>
                      </tr>
                    ) : (
                      saasRows.map((inv) => {
                        const displayDate = inv.issued_at || inv.created_at;
                        const status = ((inv as any).is_overdue && inv.status !== "paid"
                          ? "overdue"
                          : inv.status || "-").toString();
                        return (
                          <tr key={inv.id} className="border-b last:border-0">
                            <td className="py-2 pr-3">
                              {displayDate ? new Date(displayDate).toLocaleDateString() : "-"}
                            </td>
                            <td className="py-2 pr-3 font-medium">{inv.invoice_number}</td>
                            <td className="py-2 pr-3">{(inv as any).client_name || "-"}</td>
                            <td className="py-2 pr-3">{formatLabel(status)}</td>
                            <td className="py-2 pr-3 text-muted-foreground">{formatBreakdown(inv)}</td>
                            <td className="py-2 text-right font-medium">{formatMoney(inv.total_amount)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
