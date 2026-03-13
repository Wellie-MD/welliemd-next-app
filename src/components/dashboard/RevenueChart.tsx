"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
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
  // const navigate = useNavigate()
  const hasData = data.length > 0
  const values = data.map((point) => Number(point.net_revenue) || 0)
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
          <CardTitle className="text-gray-800">Net Revenue (Last 12 Months)</CardTitle>
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground">Rolling 12 months</p>
            <Button
              variant="ghost"
              size="sm"
              className="invisible"
            >
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-[#8979FF]" />
          <span>Net Revenue</span>
        </div>
      </CardHeader>
      <CardContent className="w-full">
        {hasData ? (
          <div className="w-full">
            <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-md border bg-white/70 px-2 py-1.5">
                <div className="text-muted-foreground">Total</div>
                <div className="font-semibold text-gray-900">{formatCurrencyTick(total)}</div>
              </div>
              <div className="rounded-md border bg-white/70 px-2 py-1.5">
                <div className="text-muted-foreground">Avg / mo</div>
                <div className="font-semibold text-gray-900">{formatCurrencyTick(average)}</div>
              </div>
              <div className="rounded-md border bg-white/70 px-2 py-1.5">
                <div className="text-muted-foreground">Latest</div>
                <div className="font-semibold text-gray-900">{formatCurrencyTick(latest)}</div>
              </div>
            </div>
            <div className="h-[320px] rounded-md border bg-background/70 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 12, right: 22, left: 8, bottom: 4 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8979FF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8979FF" stopOpacity={0.1} />
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
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const value = Number(payload[0].value || 0)
                    return (
                      <div className="rounded-md border bg-white px-3 py-2 text-xs shadow">
                        <div className="font-medium text-gray-900">{formatMonth(String(label))}</div>
                        <div className="text-gray-600">Net Revenue: {formatCurrencyTick(value)}</div>
                      </div>
                    )
                  }}
                />
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
