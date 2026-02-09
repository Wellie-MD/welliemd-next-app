"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Eye, DollarSign } from "lucide-react";
import mockData from "@/data/mockData.json";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { NewPatientChart } from "@/components/dashboard/NewPatientChart";
import { DataTable } from "@/components/dashboard/DataTable";
import { PaymentTable } from "@/components/dashboard/PaymentTable";
import { DashboardData } from "@/types/dashboard";
import { useState, useEffect } from "react";
import { fetchClientPaymentHistory } from "@/api/paymentTransactionsApi";

import { fetchOrders } from "@/api/ordersApi";
import { fetchDashboardCharts } from "@/api/dashboardApi";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";

export default function Dashboard() {
  const { dashboard } = mockData as { dashboard: DashboardData };

  const [paymentData, setPaymentData] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loadingCharts, setLoadingCharts] = useState(true);

  const { kpiData, patientSummary, loading: loadingMetrics, metrics } = useDashboardMetrics({
    fallbackKpis: dashboard.kpis
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
      console.log('Patient Summary:', metrics.patient_summary);
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
          deliveryDate: item.datePrescribed ? new Date(item.datePrescribed).toLocaleDateString() : 'N/A',
          orderNumber: item.display_id,
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
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      </div>

      {/* KPI Cards - Horizontally Scrollable */}
      <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
        <div className="flex gap-4 min-w-max">
          {kpiData.map((kpi, index) => (
            <div key={index} className="cursor-pointer">
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

        {/* Patient Summary */}
        <div className="w-full min-w-0">
          <Card className="rounded-2xl shadow-md bg-white h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between bg-blue-50 rounded-t-2xl p-6">
              <CardTitle className="text-gray-800">Patient Summary</CardTitle>
              {/* <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700"
                onClick={() => handleViewMore("patientSummary")}
              >
                View More
              </Button> */}
            </CardHeader>
            <CardContent className="p-4 flex-1 flex items-center">
              <div className="grid grid-cols-3 gap-4 w-full">
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
                  <p className="text-sm text-gray-600">In Active</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                    <DollarSign className="h-6 w-6 text-gray-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">
                    {patientSummary.drop_off_patients}
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
            title="Payment" 
            data={paymentData || dashboard.payments} 
            columns={paymentColumns} 
          />
        </div>
      </div>
    </div>
  );
}
