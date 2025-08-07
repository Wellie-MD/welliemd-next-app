"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Eye, DollarSign, MoreHorizontal } from "lucide-react"
import mockData from "@/data/mockData.json"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { SalesChart } from "@/components/dashboard/SalesChart"
import { RevenueChart } from "@/components/dashboard/RevenueChart"
import { NewPatientChart } from "@/components/dashboard/NewPatientChart"
import { DataTable } from "@/components/dashboard/DataTable"
import { DashboardData } from "@/types/dashboard"

export default function Dashboard() {
  const { dashboard } = mockData as { dashboard: DashboardData }

  const handleViewMore = (section: string) => {
    console.log(`View more clicked for ${section}`)
    // Here you would typically navigate to the detailed view
  }

  const handleKPIClick = (metric: string) => {
    console.log(`KPI clicked: ${metric}`)
    // Here you would typically show a detailed modal or navigate to details
  }

  const handleMessageClick = (messageId: string) => {
    console.log(`Message clicked: ${messageId}`)
    // Here you would typically open the message in a modal or navigate to message details
  }

  const handleOrderClick = (orderId: string) => {
    console.log(`Order clicked: ${orderId}`)
    // Here you would typically navigate to order details
  }

  const orderHistoryColumns = [
    { key: "date", label: "Date" },
    { key: "deliveryDate", label: "Delivery Date" },
    { key: "orderNumber", label: "Order#" },
    { key: "name", label: "Name" },
    { key: "product", label: "Product" },
    { key: "pharmacy", label: "Pharmacy" },
    { key: "amount", label: "Amount" }
  ]

  const paymentColumns = [
    { key: "date", label: "Date" },
    { key: "patientId", label: "Patient Id" },
    { key: "patientName", label: "Patient Name" },
    { key: "orderNumber", label: "Order#" },
    { key: "totalAmount", label: "Total Amount" },
    { key: "discount", label: "Discount" },
    { key: "amountPaid", label: "Amount Paid" }
  ]

  return (
    <div className="p-4 space-y-4 w-full min-w-0 overflow-x-hidden">
      <div className="flex items-center justify-between min-w-0">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      </div>

      {/* KPI Cards - Horizontally Scrollable */}
      <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
        <div className="flex gap-4 min-w-max">
          {dashboard.kpis.map((kpi, index) => (
            <div key={index} onClick={() => handleKPIClick(kpi.label)} className="cursor-pointer">
              <MetricCard metric={kpi} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full min-w-0">
        {/* Total Sales Chart */}
        <div className="w-full min-w-0">
          <SalesChart data={dashboard.salesChartData} />
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
                onClick={() => handleViewMore('liveSummary')}
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
                  <p className="text-2xl font-bold text-gray-800">{dashboard.liveSummary.activeCarts}</p>
                  <p className="text-sm text-gray-600">Active Carts</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                    <Eye className="h-6 w-6 text-gray-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{dashboard.liveSummary.checkingOut}</p>
                  <p className="text-sm text-gray-600">Checking Out</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                    <DollarSign className="h-6 w-6 text-gray-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{dashboard.liveSummary.purchased}</p>
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
          <RevenueChart data={dashboard.revenueChartData} />
        </div>

        {/* Messages and New Patient */}
        <div className="space-y-4 w-full min-w-0">
          {/* Messages */}
          <Card className="rounded-2xl shadow-md bg-white">
            <CardHeader className="flex flex-row items-center justify-between bg-blue-50 rounded-t-2xl p-4">
              <CardTitle className="text-gray-800">Messages</CardTitle>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">View All</Button>
            </CardHeader>
            <CardContent className="p-4">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-gray-100 mb-4">
                  <TabsTrigger value="all" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">All</TabsTrigger>
                  <TabsTrigger value="patients" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Patients</TabsTrigger>
                  <TabsTrigger value="doctors" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Doctors</TabsTrigger>
                  <TabsTrigger value="support" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Support</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="space-y-3">
                  {dashboard.messages.map((message) => (
                    <div 
                      key={message.id} 
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
                      onClick={() => handleMessageClick(message.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.avatar} />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {message.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm text-gray-800">{message.name}</p>
                          <p className="text-xs text-gray-600">{message.time}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-800">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* New Patient Chart */}
          <NewPatientChart data={dashboard.newPatientChartData} />
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
          <DataTable 
            title="Payment" 
            data={dashboard.payments} 
            columns={paymentColumns} 
          />
        </div>
      </div>
    </div>
  )
}