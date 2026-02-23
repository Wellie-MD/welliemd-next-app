"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"
import { ChartDataPoint } from "@/types/dashboard"

interface RevenueChartProps {
  data: ChartDataPoint[]
}

const formatCurrencyTick = (value: number) => {
  const absValue = Math.abs(value)

  if (absValue >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
  }
  if (absValue >= 1_000) {
    return `$${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`
  }
  return `$${Math.round(value)}`
}

export function RevenueChart({ data }: RevenueChartProps) {
  const hasData = data.length > 0

  return (
    <Card className="rounded-2xl shadow-md bg-white w-full">
      <CardHeader className="flex flex-row items-center justify-between bg-blue-50 rounded-t-2xl">
        <CardTitle className="text-gray-800">Net Revenue (Last 12 Months)</CardTitle>
        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">View More</Button>
      </CardHeader>
      <CardContent className="w-full">
        {hasData ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(value) => {
                    const date = new Date(value + "-01")
                    return date.toLocaleDateString("en-US", { month: "short" })
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={formatCurrencyTick}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3CC3DF"
                  strokeWidth={3}
                  dot={{ fill: "white", stroke: "#3CC3DF", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "white", stroke: "#3CC3DF", strokeWidth: 2 }}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-sm text-gray-500">
            No revenue data for this period.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
