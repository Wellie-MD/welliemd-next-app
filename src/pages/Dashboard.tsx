"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Eye, DollarSign, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import mockData from "@/data/mockData.json";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { NewPatientChart } from "@/components/dashboard/NewPatientChart";
import { DataTable } from "@/components/dashboard/DataTable";
import { PaymentTable } from "@/components/dashboard/PaymentTable";
import { DashboardData } from "@/types/dashboard";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { fetchClientPaymentHistory } from "@/api/paymentTransactionsApi";

import { fetchOrders } from "@/api/ordersApi";
import { fetchDashboardCharts } from "@/api/dashboardApi";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";

export default function Dashboard() {
  const navigate = useNavigate();

  const { dashboard } = mockData as { dashboard: DashboardData };

  const [paymentData, setPaymentData] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loadingCharts, setLoadingCharts] = useState(true);

  const metricsScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = metricsScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  // Re-check arrow visibility on container resize (e.g. window resize)
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

  const { kpiData, patientSummary, metrics } = useDashboardMetrics({
    fallbackKpis: dashboard.kpis
  });

  const dashboardWindowLabel = metrics?.period
    ? `Window: ${new Date(metrics.period.start).toLocaleDateString()} - ${new Date(metrics.period.end).toLocaleDateString()}`
    : null;
  const chartWindowLabel = "Charts: Monthly trend for last 12 months";
  const dashboardWindowPayments = (paymentData || []).filter((item) => {
    if (!metrics?.period) return true;
    const rawDate = item.rawDate || item.date;
    if (!rawDate) return false;
    const d = new Date(rawDate);
    const start = new Date(`${metrics.period.start}T00:00:00`);
    const end = new Date(`${metrics.period.end}T23:59:59.999`);
    return d >= start && d <= end;
  });

  // Re-evaluate scroll arrows whenever kpiData changes
  useEffect(() => {
    // slight delay to let the DOM paint the new cards
    const id = setTimeout(updateScrollButtons, 50);
    return () => clearTimeout(id);
  }, [kpiData, updateScrollButtons]);

  // Log metrics for validation
  useEffect(() => {
    if (metrics) {
      console.log('=== Dashboard Metrics Validation ===');
      console.log('Total Patients:', metrics.total_patients);
      console.log('Total Revenue:', metrics.total_revenue);
      console.log('Total Profit:', metrics.total_profit);
      console.log('Total Expenses:', metrics.total_expenses);
      console.log('Total Sales:', metrics.total_sales);
      console.log('Total Orders:', metrics.total_orders);
      console.log('Growth Percentage:', metrics.growth_percentage);
      console.log('Live Summary:', metrics.live_summary);
      console.log('===================================');
    }
  }, [metrics]);

  useEffect(() => {
    // fetchOrders
    const loadPaymentHistory = async () => {
      try {
        const response = await fetchClientPaymentHistory();

        // Transform API data to match table format and limit to 8 records
        const transformedData = response.results.slice(0, 8).map((item) => ({
          rawDate: item.date,
          date: new Date(item.date).toLocaleDateString(),
          patientId: item.patient_id,
          patientName: item.patient_name,
          orderNumber: item.order_number,
          totalAmount: `$${item.total_amount}`,
          discount: `$${item.discount}`,
          amountPaid: `$${item.amount_paid}`,
        }));
        console.log('Payment Data (max 8 records):', transformedData);
        setPaymentData(transformedData);
      } catch (error) {
        console.error("Failed to load payment history:", error);
        // Fallback to mock data if API fails
        setPaymentData(dashboard.payments);
      } finally {
        setLoadingPayments(false);
      }
    };
    const loadOrderHistory = async () => {
      try {
        const response = await fetchOrders();

        // Transform API data to match table format and limit to 8 records
        const transformedData = response.results.slice(0, 8).map((item) => ({
          date: new Date(item.orderDate).toLocaleDateString(),
          deliveryDate: item.datePrescribed,
          orderNumber: item.order_id ?? item.display_id,
          name: item.name,
          product: item.product_name,
          pharmacy: item.pharmacy_display,
          amount: item.amount,
        }));
        console.log('Orders Data (max 8 records):', transformedData);
        setOrdersData(transformedData);
      } catch (error) {
        console.error("Failed to load payment history:", error);
        // Fallback to mock data if API fails
        setOrdersData(dashboard.orderHistory);
      } finally {
        setLoadingOrders(false);
      }
    };

    const loadChartData = async () => {
      try {
        const response = await fetchDashboardCharts();
        setChartData(response);
      } catch (error) {
        console.error("Failed to load chart data:", error);
        // Create fallback data from mock data structure
        const fallbackData = dashboard.salesChartData.map((item, index) => ({
          month: item.month,
          total_sales: item['2025'] || 0,
          net_revenue: dashboard.revenueChartData[index]?.['2022'] || 0,
          new_patients: dashboard.newPatientChartData[index]?.lastWeek || 0
        }));
        setChartData(fallbackData);
      } finally {
        setLoadingCharts(false);
      }
    };

    loadPaymentHistory();
    loadOrderHistory();
    loadChartData();
  }, [dashboard.payments, dashboard.salesChartData, dashboard.revenueChartData, dashboard.newPatientChartData]);


  const handleViewMore = (section: string) => {
    console.log(`View more clicked for ${section}`);
    // Here you would typically navigate to the detailed view
  };

  const handleKPIClick = (kpi: {
    title: string;
    value: string;
    change: string;
    trend: string;
  }) => {
    console.log(`KPI clicked: ${kpi.title}`);
    // Here you would typically show a detailed modal or navigate to details
  };

  const handleMessageClick = (messageId: string) => {
    console.log(`Message clicked: ${messageId}`);
    // Here you would typically open the message in a modal or navigate to message details
  };

  const handleOrderClick = (orderId: string) => {
    console.log(`Order clicked: ${orderId}`);
    // Here you would typically navigate to order details
  };

  const orderHistoryColumns = [
    { key: "date", label: "Date" },
    { key: "orderNumber", label: "Order#" },
    { key: "name", label: "Name" },
    { key: "product", label: "Product" },
    { key: "pharmacy", label: "Pharmacy" },
    { key: "amount", label: "Amount" },
  ];

  const paymentColumns = [
    { key: "date", label: "Date" },
    { key: "patientName", label: "Patient Name" },
    { key: "orderNumber", label: "Order#" },
    { key: "totalAmount", label: "Total Amount" },
    { key: "discount", label: "Discount" },
    { key: "amountPaid", label: "Amount Paid" },
  ];

  return (
    <div className="p-4 space-y-4 w-full min-w-0 overflow-x-hidden">
      <div className="flex items-center justify-between min-w-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          {dashboardWindowLabel ? (
            <p className="text-sm text-muted-foreground hidden">{dashboardWindowLabel}</p>
          ) : null}
          <p className="text-xs text-muted-foreground hidden">{chartWindowLabel}</p>
        </div>
      </div>

      {/* KPI Cards - Horizontally Scrollable */}
      <div className="relative">
        {/* Left arrow */}
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
            {kpiData.map((kpi, index) => (
              <div
                key={index}
                // onClick={() => handleKPIClick(kpi)}
                className="cursor-pointer"
              >
                <MetricCard metric={kpi} />
              </div>
            ))}
          </div>
        </div>

        {/* Right arrow */}
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full min-w-0">
        {/* Total Sales Chart */}
        <div className="w-full min-w-0">
          <SalesChart data={loadingCharts ? [] : chartData} />
        </div>

        {/* Live Summary */}
        <div className="w-full min-w-0 h-full">
          <Card className="rounded-2xl border-border/70 bg-gradient-to-br from-primary/5 via-background to-blue-50/30 shadow-sm h-full flex flex-col">
            <CardHeader className="p-4">
              <div className="flex items-center justify-between pt-1">
                <CardTitle className="text-gray-800">Patient Summary</CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground invisible">
                  <span className="h-2 w-2 rounded-full bg-[#8979FF]" />
                  <span>Patient</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 flex-1 flex">
              <div className="w-full flex flex-col gap-6 justify-center">
                <div className="flex items-center justify-between rounded-2xl border bg-white/70 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Number of Active Patients</p>
                      <p className="text-xs text-muted-foreground">Prescribed patients</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{patientSummary.active_patients}</div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border bg-white/70 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Eye className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Number of inactive Patients</p>
                      <p className="text-xs text-muted-foreground">Missed follow-ups (20+ days)</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{patientSummary.inactive_patients}</div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border bg-white/70 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Number of drop-off Patients</p>
                      <p className="text-xs text-muted-foreground">Questionnaire, no checkout</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{patientSummary.dropoff_patients}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full min-w-0">
        {/* Net Revenue Chart */}
        <div className="w-full min-w-0">
          <RevenueChart data={loadingCharts ? [] : chartData} />
        </div>

        {/* Messages and New Patient */}
        <div className="w-full min-w-0">

          {/* New Patient Chart */}
          <NewPatientChart data={loadingCharts ? [] : chartData} />
        </div>
      </div>

      {/* Bottom Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full min-w-0">
        <div className="w-full min-w-0">
          <DataTable 
            title="Order History" 
            data={ordersData || dashboard.orderHistory} 
            columns={orderHistoryColumns} 
          />
        </div>
        <div className="w-full min-w-0">
          <PaymentTable 
            title="Payment (KPI Window)" 
            data={loadingPayments ? [] : (metrics?.period ? dashboardWindowPayments : (paymentData || dashboard.payments))} 
            columns={paymentColumns} 
          />
        </div>
      </div>
    </div>
  );
}
