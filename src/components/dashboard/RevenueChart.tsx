"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { ChartDataPoint } from "@/types/dashboard"
import { format, isValid, parse } from "date-fns"

interface RevenueChartProps {
  data: ChartDataPoint[]
  subtitle?: string
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

function RevenueChart({ data, subtitle = "Rolling 12 months" }: RevenueChartProps) {
  const [chartMode, setChartMode] = useState<"line" | "area">("area")
  const hasData = data.length > 0
  const values = data.map((point) => Number(point.net_revenue) || 0)
  const total = values.reduce((acc, value) => acc + value, 0)
  const average = values.length ? total / values.length : 0
  const latest = values.length ? values[values.length - 1] : 0
  const deltaVsAvg = latest - average
  const peakIndex = values.length
    ? values.reduce((bestIndex, value, index) => (value > values[bestIndex] ? index : bestIndex), 0)
    : -1
  const peakValue = peakIndex >= 0 ? values[peakIndex] : 0

  const parseChartDateLabel = (value: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const parsed = parse(value, "yyyy-MM-dd", new Date())
      return isValid(parsed) ? parsed : null
    }
    if (/^\d{4}-\d{2}$/.test(value)) {
      const parsed = parse(value, "yyyy-MM", new Date())
      return isValid(parsed) ? parsed : null
    }
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const formatMonth = (value: string) => {
    const parsedDate = parseChartDateLabel(value)
    if (!parsedDate) return value
    return format(parsedDate, "MMM yyyy")
  }

  const formatXAxisLabel = (value: string) => {
    const parsedDate = parseChartDateLabel(value)
    if (!parsedDate) return value
    return format(parsedDate, "MMM d")
  }

  const peakLabel = (() => {
    if (peakIndex < 0) return "—"
    const point = data[peakIndex]
    const rawLabel = String(point?.day || point?.month || "")
    return rawLabel ? formatMonth(rawLabel) : "—"
  })()

  return (
      <Card className="rounded-2xl border-border/70 bg-gradient-to-br from-primary/10 via-background to-cyan-50/40 dark:to-slate-900/40 shadow-sm w-full">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-gray-800 dark:text-slate-100">Net Revenue</CardTitle>
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground">{subtitle}</p>
            <Button
              variant="ghost"
              size="sm"
              className="invisible"
            >
            </Button>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-[#8979FF]" />
            <span>Net Revenue</span>
            <span className={deltaVsAvg >= 0 ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"}>
              {deltaVsAvg >= 0 ? "+" : ""}{formatCurrencyTick(deltaVsAvg)} vs avg
            </span>
          </div>
          <div className="inline-flex rounded-md border bg-white/80 p-0.5 shadow-sm">
            <Button
              variant={chartMode === "line" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2 text-[11px]"
              onClick={() => setChartMode("line")}
            >
              Line
            </Button>
            <Button
              variant={chartMode === "area" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2 text-[11px]"
              onClick={() => setChartMode("area")}
            >
              Area
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="w-full">
        {hasData ? (
          <div className="w-full">
            <div className="mb-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="rounded-md border bg-white/70 dark:bg-slate-900/70 px-2 py-1.5">
                <div className="text-muted-foreground">Total</div>
                <div className="font-semibold text-gray-900 dark:text-slate-100">{formatCurrencyTick(total)}</div>
              </div>
              <div className="rounded-md border bg-white/70 dark:bg-slate-900/70 px-2 py-1.5">
                <div className="text-muted-foreground">Avg / mo</div>
                <div className="font-semibold text-gray-900 dark:text-slate-100">{formatCurrencyTick(average)}</div>
              </div>
              <div className="rounded-md border bg-white/70 dark:bg-slate-900/70 px-2 py-1.5">
                <div className="text-muted-foreground">Latest</div>
                <div className="font-semibold text-gray-900 dark:text-slate-100">{formatCurrencyTick(latest)}</div>
              </div>
              <div className="rounded-md border bg-white/70 dark:bg-slate-900/70 px-2 py-1.5">
                <div className="text-muted-foreground">Peak</div>
                <div className="font-semibold text-gray-900 dark:text-slate-100">
                  {formatCurrencyTick(peakValue)}
                  <span className="ml-1 text-[10px] font-normal text-muted-foreground">{peakLabel}</span>
                </div>
              </div>
            </div>
            <div className="h-[330px] rounded-xl border bg-white/60 dark:bg-slate-900/60 p-3 shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === "area" ? (
                  <AreaChart data={data} margin={{ top: 12, right: 22, left: 8, bottom: 4 }}>
                    <defs>
                      <linearGradient id="colorRevenueClient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8979FF" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8979FF" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      interval={0}
                      tickFormatter={(value) => formatXAxisLabel(String(value))}
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
                          <div className="rounded-lg border bg-white/95 dark:bg-slate-900 px-3 py-2 text-xs shadow-lg">
                            <div className="font-semibold text-gray-900 dark:text-slate-100">{formatMonth(String(label))}</div>
                            <div className="mt-1 text-gray-700 dark:text-slate-300">Net Revenue: {formatCurrencyTick(value)}</div>
                            <div className={value >= average ? "text-emerald-600" : "text-rose-600"}>
                              {value >= average ? "+" : ""}{formatCurrencyTick(value - average)} vs period avg
                            </div>
                          </div>
                        )
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="net_revenue"
                      stroke="#8979FF"
                      strokeWidth={3}
                      fill="url(#colorRevenueClient)"
                      fillOpacity={1}
                      animationDuration={700}
                      name="Net Revenue"
                    />
                  </AreaChart>
                ) : (
                  <LineChart data={data} margin={{ top: 12, right: 22, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      interval={0}
                      tickFormatter={(value) => formatXAxisLabel(String(value))}
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
                          <div className="rounded-lg border bg-white/95 dark:bg-slate-900 px-3 py-2 text-xs shadow-lg">
                            <div className="font-semibold text-gray-900 dark:text-slate-100">{formatMonth(String(label))}</div>
                            <div className="mt-1 text-gray-700 dark:text-slate-300">Net Revenue: {formatCurrencyTick(value)}</div>
                            <div className={value >= average ? "text-emerald-600" : "text-rose-600"}>
                              {value >= average ? "+" : ""}{formatCurrencyTick(value - average)} vs period avg
                            </div>
                          </div>
                        )
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="net_revenue"
                      stroke="#8979FF"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      dot={false}
                      activeDot={{ r: 6, fill: "white", stroke: "#8979FF", strokeWidth: 2 }}
                      animationDuration={700}
                      name="Net Revenue"
                    />
                  </LineChart>
                )}
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

export { RevenueChart }
export default RevenueChart
