"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { ChartDataPoint } from "@/types/dashboard"
import { useNavigate } from "react-router-dom"
import { format, isValid, parse } from "date-fns"

interface NewPatientChartProps {
  data: ChartDataPoint[]
  subtitle?: string
}

export function NewPatientChart({ data, subtitle = "Rolling 12 months" }: NewPatientChartProps) {
  const [chartMode, setChartMode] = useState<"line" | "area">("area")
  const navigate = useNavigate()
  const hasData = data.length > 0
  const values = data.map((point) => Number(point.value) || 0)

  // HEAD: data is cumulative totals — compute month-over-month deltas
  const monthlyAdds = values.map((value, index) => {
    if (index === 0) return value
    return Math.max(value - values[index - 1], 0)
  })
  const latest = monthlyAdds.length ? monthlyAdds[monthlyAdds.length - 1] : 0
  const average = monthlyAdds.length
    ? monthlyAdds.reduce((acc, value) => acc + value, 0) / monthlyAdds.length
    : 0
  const deltaVsAvg = latest - average
  const total = values.length ? values[values.length - 1] : 0
  const peakIndex = monthlyAdds.length
    ? monthlyAdds.reduce((bestIndex, value, index) => (value > monthlyAdds[bestIndex] ? index : bestIndex), 0)
    : -1
  const peakValue = peakIndex >= 0 ? monthlyAdds[peakIndex] : 0

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
    <Card className="rounded-2xl border-border/70 bg-gradient-to-br from-primary/10 via-background to-rose-50/35 shadow-sm w-full h-full">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-gray-800">Total Clients</CardTitle>
          <p className="text-xs text-muted-foreground pt-1">{subtitle}</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#FF928A]" />
            <span>Clients</span>
            <span className={deltaVsAvg >= 0 ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"}>
              {deltaVsAvg >= 0 ? "+" : ""}{Math.round(deltaVsAvg).toLocaleString()} vs avg
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
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-700"
            onClick={() => navigate("/dashboard/clients")}
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="w-full">
        {hasData ? (
          <div className="w-full">
            <div className="mb-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
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
              <div className="rounded-md border bg-white/70 px-2 py-1.5">
                <div className="text-muted-foreground">Peak</div>
                <div className="font-semibold text-gray-900">
                  {peakValue.toLocaleString()}
                  <span className="ml-1 text-[10px] font-normal text-muted-foreground">{peakLabel}</span>
                </div>
              </div>
            </div>
            <div className="h-[330px] rounded-xl border bg-white/60 p-3 shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === "area" ? (
                  <AreaChart data={data} margin={{ top: 12, right: 22, left: 8, bottom: 4 }}>
                    <defs>
                      <linearGradient id="clientsAreaGradientAdmin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF928A" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#FF928A" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickFormatter={(value) => formatXAxisLabel(String(value))}
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
                          <div className="rounded-lg border bg-white/95 px-3 py-2 text-xs shadow-lg">
                            <div className="font-semibold text-gray-900">{formatMonth(String(label))}</div>
                            <div className="mt-1 text-gray-700">Clients: {Number(payload[0].value || 0).toLocaleString()}</div>
                            <div className={Number(payload[0].value || 0) >= average ? "text-emerald-600" : "text-rose-600"}>
                              {Number(payload[0].value || 0) >= average ? "+" : ""}{Math.round(Number(payload[0].value || 0) - average).toLocaleString()} vs period avg
                            </div>
                          </div>
                        )
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#FF928A"
                      strokeWidth={3}
                      fill="url(#clientsAreaGradientAdmin)"
                      fillOpacity={1}
                      animationDuration={700}
                      name="Total Clients"
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
                      tickFormatter={(value) => formatXAxisLabel(String(value))}
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
                          <div className="rounded-lg border bg-white/95 px-3 py-2 text-xs shadow-lg">
                            <div className="font-semibold text-gray-900">{formatMonth(String(label))}</div>
                            <div className="mt-1 text-gray-700">Clients: {Number(payload[0].value || 0).toLocaleString()}</div>
                            <div className={Number(payload[0].value || 0) >= average ? "text-emerald-600" : "text-rose-600"}>
                              {Number(payload[0].value || 0) >= average ? "+" : ""}{Math.round(Number(payload[0].value || 0) - average).toLocaleString()} vs period avg
                            </div>
                          </div>
                        )
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#FF928A"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      dot={false}
                      activeDot={{ r: 6, fill: "white", stroke: "#FF928A", strokeWidth: 2 }}
                      animationDuration={700}
                      name="Total Clients"
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-sm text-gray-500">
            No client-growth data for this period.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
