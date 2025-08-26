import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import mockData from "@/data/mockData.json"

const usageColumns = [
  { key: "code", label: "Code" },
  { key: "name", label: "Name" },
  { key: "value", label: "Value" },
  { key: "discountedAmount", label: "Discounted Amount" },
  { key: "usedByPatient", label: "Used by patient" },
  { key: "usedOn", label: "Used on" }
]

export default function CouponInsights() {
  const { couponsImpact, totalDiscount, usageData } = mockData.couponInsights

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Coupons · Insights</h1>
          <div className="flex gap-4 text-sm text-muted-foreground mt-2">
            <span>Aug 13, 2025 - Aug 13, 2025</span>
            <span className="ml-auto">📅</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coupons Impact Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Coupons impact
              <span className="text-xs text-muted-foreground">ℹ️</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold">{couponsImpact.uses} uses - ${couponsImpact.amount}</div>
                <div className="text-sm text-muted-foreground">$4</div>
              </div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={couponsImpact.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={false} />
                    <YAxis hide />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>12 AM</span>
                <span>2 AM</span>
                <span>4 AM</span>
                <span>6 AM</span>
                <span>8 AM</span>
                <span>10 AM</span>
                <span>12 PM</span>
                <span>2 PM</span>
                <span>4 PM</span>
                <span>6 PM</span>
                <span>8 PM</span>
                <span>11 PM</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Discount Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Total discount
              <span className="text-xs text-muted-foreground">ℹ️</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-48">
              <div className="text-4xl font-bold mb-2">${totalDiscount.amount}</div>
              <div className="text-sm text-muted-foreground text-center">Total discounts</div>
              <div className="text-xs text-muted-foreground text-center mt-4">
                {totalDiscount.description}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Coupon Card */}
        <Card>
          <CardHeader>
            <CardTitle>Top coupon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-48">
              <div className="text-sm text-muted-foreground">No data available</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Usage</h2>
        
        <div className="space-y-4">
          <input 
            placeholder="Search by coupon name, code, or coupon ID"
            className="w-full p-2 border rounded-md"
          />
          
          <div className="flex gap-4">
            <div className="flex gap-2">
              <span className="text-sm text-muted-foreground">Sort</span>
              <select className="text-sm border rounded px-2 py-1">
                <option>Default</option>
              </select>
            </div>
            <div className="flex gap-2">
              <span className="text-sm text-muted-foreground">Filter by code</span>
              <select className="text-sm border rounded px-2 py-1">
                <option>All</option>
              </select>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-800">Reset Filters</button>
          </div>
        </div>

        {usageData.length > 0 ? (
          <DataTable
            data={usageData}
            columns={usageColumns}
            searchPlaceholder=""
            showDatePicker={false}
            showExport={false}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">📄</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Your coupon uses will show here</h3>
            <p className="text-sm text-muted-foreground text-center">
              Once your first patient uses a coupon code, it will show up here.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}