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

  const { kpiData, liveSummary, loading: loadingMetrics } = useDashboardMetrics({
    fallbackKpis: dashboard.kpis
  });

  useEffect(() => {
    // fetchOrders
    const loadPaymentHistory = async () => {
      try {
        const response = await fetchClientPaymentHistory();

        // Transform API data to match table format
        const transformedData = response.results.map((item) => ({
          date: new Date(item.date).toLocaleDateString(),
          patientId: item.patient_id,
          patientName: item.patient_name,
          orderNumber: item.order_number,
          totalAmount: `$${item.total_amount}`,
          discount: `$${item.discount}`,
          amountPaid: `$${item.amount_paid}`,
        }));
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

        // Transform API data to match table format
        const transformedData = response.results.map((item) => ({
          date: new Date(item.orderDate).toLocaleDateString(),
          deliveryDate: item.datePrescribed,
          orderNumber: item.display_id,
          name: item.name,
          product: item.product_name,
          pharmacy: item.pharmacy_display,
          amount: item.amount,
        }));
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
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      </div>

      {/* KPI Cards - Horizontally Scrollable */}
      <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
        <div className="flex gap-4 min-w-max">
          {kpiData.map((kpi, index) => (
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full min-w-0">
        {/* Total Sales Chart */}
        <div className="w-full min-w-0">
          <SalesChart data={loadingCharts ? [] : chartData} />
        </div>

        {/* Live Summary */}
        <div className="w-full min-w-0">
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
                    {liveSummary.active_carts}
                  </p>
                  <p className="text-sm text-gray-600">Active Carts</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                    <Eye className="h-6 w-6 text-gray-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">
                    {liveSummary.checking_out}
                  </p>
                  <p className="text-sm text-gray-600">Checking Out</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                    <DollarSign className="h-6 w-6 text-gray-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">
                    {liveSummary.purchased}
                  </p>
                  <p className="text-sm text-gray-600">Purchased</p>
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
          {/* Messages */}
          {/* <Card className="rounded-2xl shadow-md bg-white">
            <CardHeader className="flex flex-row items-center justify-between bg-blue-50 rounded-t-2xl p-4">
              <CardTitle className="text-gray-800">Messages</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700"
                onClick={() => navigate("/dashboard/messages")}
              >
                View All
              </Button>
            </CardHeader>
            <CardContent className="p-4">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-gray-100 mb-4">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="patients"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    Patients
                  </TabsTrigger>
                  <TabsTrigger
                    value="doctors"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    Doctors
                  </TabsTrigger>
                  <TabsTrigger
                    value="support"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    Support
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="space-y-3">
                  {dashboard.messages.map((message) => (
                    <div
                      key={message.id}
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
                      onClick={() => handleMessageClick(message.id.toString())}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.avatar} />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {message.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm text-gray-800">
                            {message.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {message.time}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card> */}

          {/* New Patient Chart */}
          <NewPatientChart data={loadingCharts ? [] : chartData} />
        </div>
      </div>

      {/* Bottom Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full min-w-0">
        <div className="w-full min-w-0">
          <DataTable
            title="Order History"
            data={loadingOrders ? [] : ordersData}
            columns={orderHistoryColumns}
          />
        </div>
        <div className="w-full min-w-0">
          <PaymentTable
            title="Payment"
            data={loadingPayments ? [] : paymentData}
            columns={paymentColumns}
          />
        </div>
      </div>
    </div>
  );
}
