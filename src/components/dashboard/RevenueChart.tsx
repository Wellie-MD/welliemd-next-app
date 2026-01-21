"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"
import { ChartDataPoint } from "@/types/dashboard"

interface RevenueChartProps {
  data: ChartDataPoint[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card className="rounded-2xl shadow-md bg-white w-full">
      <CardHeader className="flex flex-row items-center justify-between bg-blue-50 rounded-t-2xl">
        <CardTitle className="text-gray-800">Net Revenue</CardTitle>
        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">View More</Button>
      </CardHeader>
      <CardContent className="w-full">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8979FF" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#8979FF" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                interval={0}
                tickFormatter={(value) => {
                  // Extract month name from YYYY-MM format
                  const date = new Date(value + '-01');
                  return date.toLocaleDateString('en-US', { month: 'short' });
                }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="net_revenue"
                stroke="#8979FF"
                strokeWidth={3}
                fill="url(#colorRevenue)"
                fillOpacity={1}
                name="Net Revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
