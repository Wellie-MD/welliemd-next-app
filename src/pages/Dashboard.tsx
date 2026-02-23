"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Eye, DollarSign } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { NewPatientChart } from "@/components/dashboard/NewPatientChart";
import { DataTable } from "@/components/dashboard/DataTable";
import { PaymentTable } from "@/components/dashboard/PaymentTable";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import mockData from "@/data/mockData.json";

export default function Dashboard() {
  // Fetch dashboard data from API
  const { dashboardData, loading, error, refetch } = useAdminDashboard();

  // Use API data if available, otherwise fallback to mock data
  const dashboard = dashboardData || mockData.dashboard;
  const dashboardWindowLabel = dashboard?.period
    ? `KPI window: ${new Date(dashboard.period.start).toLocaleDateString()} - ${new Date(dashboard.period.end).toLocaleDateString()}`
    : null;
  const chartWindowLabel = "Charts: Monthly trend for last 12 months";

  const handleViewMore = (section: string) => {
    console.log(`View more clicked for ${section}`);
  };

  const handleKPIClick = (metric: any) => {
    console.log(`KPI clicked: ${metric.title}`);
  };

  const orderHistoryColumns = [
    { key: "date", label: "Date" },
    { key: "delivery_date", label: "Delivery Date" },
    { key: "order_number", label: "Order#" },
    { key: "patient_name", label: "Patient Name" },
    { key: "product_name", label: "Product" },
    { key: "pharmacy_name", label: "Pharmacy" },
    { key: "amount", label: "Amount" },
  ];

  const paymentColumns = [
    { key: "date", label: "Date" },
    { key: "patient_id", label: "Patient Id" },
    { key: "patient_name", label: "Patient Name" },
    { key: "order_number", label: "Order#" },
    { key: "total_amount", label: "Total Amount" },
    { key: "discount", label: "Discount" },
    { key: "amount_paid", label: "Amount Paid" },
  ];

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
      <div className="flex items-center justify-between min-w-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          {dashboardWindowLabel ? (
            <p className="text-sm text-muted-foreground">{dashboardWindowLabel}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">{chartWindowLabel}</p>
        </div>
        {/* {dashboardData && (
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        )} */}
      </div>

      {/* KPI Cards - Horizontally Scrollable */}
      <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
        <div className="flex gap-4 min-w-max">
          {dashboard.kpis.map((kpi, index) => (
            <div
              key={index}
              onClick={() => handleKPIClick(kpi)}
              className="cursor-pointer"
            >
              <MetricCard metric={kpi} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1  gap-4 w-full min-w-0">
        {/* Total Sales Chart */}
        <div className="w-full min-w-0">
          <SalesChart data={dashboard.salesChartData} />
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
          <RevenueChart data={dashboard.revenueChartData} />
        </div>

        {/* Total Clients Chart */}
        <div className="w-full min-w-0">
          <NewPatientChart data={dashboard.newClientChartData || []} />
        </div>
      </div>

      {/* Bottom Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full min-w-0">
        <div className="w-full min-w-0">
          <DataTable
            title="Order History"
            data={dashboard.orderHistory}
            columns={orderHistoryColumns}
          />
        </div>
        <div className="w-full min-w-0">
          <PaymentTable
            title="Payment (KPI Window)"
            data={dashboard.payments}
            columns={paymentColumns}
          />
        </div>
      </div>
    </div>
  );
}
