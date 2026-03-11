"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Eye, DollarSign, MoreHorizontal } from "lucide-react";
import mockData from "@/data/mockData.json";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { NewPatientChart } from "@/components/dashboard/NewPatientChart";
import { DataTable } from "@/components/dashboard/DataTable";
import { PaymentTable } from "@/components/dashboard/PaymentTable";
import { DashboardData } from "@/types/dashboard";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
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
          orderNumber: item.order_id || item.display_id,
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
    { key: "deliveryDate", label: "Delivery Date" },
    { key: "orderNumber", label: "Order#" },
    { key: "name", label: "Name" },
    { key: "product", label: "Product" },
    { key: "pharmacy", label: "Pharmacy" },
    { key: "amount", label: "Amount" },
  ];

  const paymentColumns = [
    { key: "date", label: "Date" },
    { key: "patientId", label: "Patient Id" },
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
            <p className="text-sm text-muted-foreground">{dashboardWindowLabel}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">{chartWindowLabel}</p>
        </div>
      </div>

      {/* KPI Cards - Horizontally Scrollable */}
      <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full min-w-0">
        {/* Total Sales Chart */}
        <div className="w-full min-w-0">
          <SalesChart data={loadingCharts ? [] : chartData} />
        </div>

        {/* Live Summary */}
        <div className="w-full min-w-0">
          <Card className="rounded-2xl shadow-md bg-white">
            <CardHeader className="flex flex-row items-center justify-between bg-blue-50 rounded-t-2xl p-4">
              <CardTitle className="text-gray-800">Patient Summary</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700"
                onClick={() => handleViewMore("patientSummary")}
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
                    {patientSummary.active_patients}
                  </p>
                  <p className="text-sm text-gray-600">Active</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                    <Eye className="h-6 w-6 text-gray-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">
                    {patientSummary.inactive_patients}
                  </p>
                  <p className="text-sm text-gray-600">Inactive</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                    <DollarSign className="h-6 w-6 text-gray-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">
                    {patientSummary.dropoff_patients}
                  </p>
                  <p className="text-sm text-gray-600">Drop Off</p>
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
