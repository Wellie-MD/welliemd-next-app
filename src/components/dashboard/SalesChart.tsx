"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { ChartDataPoint } from "@/types/dashboard"

interface SalesChartProps {
  data: ChartDataPoint[]
}

export function SalesChart({ data }: SalesChartProps) {
  const hasData = data.length > 0
  const values = data.map((point) => Number(point.total_sales) || 0)
  const total = values.reduce((acc, value) => acc + value, 0)
  const average = values.length ? total / values.length : 0
  const latest = values.length ? values[values.length - 1] : 0

  const formatMonth = (value: string) => {
    const date = new Date(`${value}-01`)
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
  }

  return (
    <Card className="rounded-2xl border-border/70 bg-gradient-to-br from-primary/5 via-background to-blue-50/30 shadow-sm w-full">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-gray-800">Total Sales (Last 12 Months)</CardTitle>
          <p className="text-xs text-muted-foreground pt-1">Rolling 12 months</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-[#8979FF]" />
          <span>Sales</span>
        </div>
      </CardHeader>
      <CardContent className="w-full">
        {hasData ? (
          <div className="w-full">
            <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-md border bg-white/70 px-2 py-1.5">
                <div className="text-muted-foreground">Total</div>
                <div className="font-semibold text-gray-900">{total.toLocaleString()}</div>
              </div>
              <div className="rounded-md border bg-white/70 px-2 py-1.5">
                <div className="text-muted-foreground">Avg / mo</div>
                <div className="font-semibold text-gray-900">{Math.round(average).toLocaleString()}</div>
              </div>
              <div className="rounded-md border bg-white/70 px-2 py-1.5">
                <div className="text-muted-foreground">Latest</div>
                <div className="font-semibold text-gray-900">{latest.toLocaleString()}</div>
              </div>
            </div>
            <div className="h-[320px] rounded-md border bg-background/70 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 12, right: 22, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  interval={0}
                  tickFormatter={(value) => {
                    const date = new Date(value + "-01")
                    return date.toLocaleDateString("en-US", { month: "short" })
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  allowDecimals={false}
                  domain={[0, (dataMax: number) => Math.max(1, Math.ceil(dataMax))]}
                  tickFormatter={(value: number) => value.toLocaleString()}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="rounded-md border bg-white px-3 py-2 text-xs shadow">
                        <div className="font-medium text-gray-900">{formatMonth(String(label))}</div>
                        <div className="text-gray-600">Sales: {Number(payload[0].value || 0).toLocaleString()}</div>
                      </div>
                    )
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total_sales"
                  stroke="#8979FF"
                  strokeWidth={3}
                  dot={{ fill: "white", stroke: "#8979FF", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "white", stroke: "#8979FF", strokeWidth: 2 }}
                  name="Total Sales"
                />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-sm text-gray-500">
            No sales data for this period.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
