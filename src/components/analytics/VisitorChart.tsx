import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Area,
  ComposedChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Dot,
  CartesianGrid,
} from "recharts"

interface VisitorChartProps {
  data: any[]
  summary?: {
    totalVisitors: number
    uniqueVisitors: number
  }
}

interface ChartPoint {
  time: string
  totalVisitors: number
  uniqueVisitors: number
}

const CustomDot = (props: any) => {
  const { cx, cy } = props
  return (
    <Dot
      cx={cx}
      cy={cy}
      r={4}
      stroke={props.stroke}
      strokeWidth={2}
      fill="white"
    />
  )
}

function formatNumber(value: number): string {
  return Number(value || 0).toLocaleString()
}

function VisitorTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null

  const rows = payload
    .map((entry: any) => ({
      name: entry.name,
      color: entry.color,
      value: formatNumber(Number(entry.value || 0)),
    }))
    .filter((entry: any) => entry.value !== "0")

  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-md dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-2 font-medium text-slate-800 dark:text-slate-100">{label}</div>
      <div className="space-y-1">
        {rows.length > 0 ? (
          rows.map((row: any) => (
            <div key={row.name} className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
                {row.name}
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{row.value}</span>
            </div>
          ))
        ) : (
          <div className="text-slate-500 dark:text-slate-400">No activity</div>
        )}
      </div>
    </div>
  )
}

export function VisitorChart({ data, summary }: VisitorChartProps) {
  const chartData: ChartPoint[] = Array.isArray(data)
    ? data.map((point) => ({
        time: String(point?.time ?? ""),
        totalVisitors: Number(point?.totalVisitors || 0),
        uniqueVisitors: Number(point?.uniqueVisitors || 0),
      }))
    : []

  const hasData = chartData.length > 0
  const hasNonZeroSeries = hasData && chartData.some((point) => {
    const total = point.totalVisitors
    const unique = point.uniqueVisitors
    return total > 0 || unique > 0
  })
  const totalVisitors = chartData.reduce((sum, point) => sum + point.totalVisitors, 0)
  const totalUniqueVisitors = chartData.reduce((sum, point) => sum + point.uniqueVisitors, 0)
  const totalPoints = chartData.length
  const totalVisitorsDisplay = Number(summary?.totalVisitors ?? totalVisitors)
  const totalUniqueVisitorsDisplay = Number(summary?.uniqueVisitors ?? totalUniqueVisitors)

  return (
    <Card className="border-border/70 bg-gradient-to-br from-primary/5 via-background to-blue-50/30 dark:from-primary/10 dark:to-slate-900/40 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-medium">Visitors Trend</CardTitle>
          <p className="text-xs text-muted-foreground">Total vs unique visitors over time.</p>
        </div>
      </CardHeader>
      <CardContent>
        {hasData && (
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded-md border bg-white/70 dark:bg-slate-900/70 dark:border-slate-700 px-2 py-1.5 text-xs">
              <div className="text-muted-foreground">Data Points</div>
              <div className="font-semibold">{formatNumber(totalPoints)}</div>
            </div>
            <div className="rounded-md border bg-white/70 dark:bg-slate-900/70 dark:border-slate-700 px-2 py-1.5 text-xs">
              <div className="text-muted-foreground">Total Visitors</div>
              <div className="font-semibold">{formatNumber(totalVisitorsDisplay)}</div>
            </div>
            <div className="rounded-md border bg-white/70 dark:bg-slate-900/70 dark:border-slate-700 px-2 py-1.5 text-xs">
              <div className="text-muted-foreground">Unique Visitors</div>
              <div className="font-semibold">{formatNumber(totalUniqueVisitorsDisplay)}</div>
            </div>
          </div>
        )}
        <div className="h-[380px] rounded-md border bg-background/70 dark:bg-slate-900/60 p-2">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 14, right: 22, left: 8, bottom: 2 }}>
                <defs>
                  <linearGradient id="uvGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="tvGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  minTickGap={20}
                  dy={10}
                />
                <YAxis 
                  yAxisId="visitors"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  allowDecimals={false}
                  domain={[0, "auto"]}
                  dx={-10}
                />
                <Tooltip 
                  content={<VisitorTooltip />}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right"
                  iconType="circle"
                  wrapperStyle={{
                    paddingBottom: '20px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="uniqueVisitors" 
                  yAxisId="visitors"
                  stroke="#3B82F6"
                  fill="url(#uvGradient)"
                  strokeWidth={2}
                  name="Unique Visitors"
                  dot={<CustomDot stroke="#3B82F6" />}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="totalVisitors" 
                  yAxisId="visitors"
                  stroke="#10B981"
                  fill="url(#tvGradient)"
                  strokeWidth={2}
                  name="Total Visitors"
                  dot={<CustomDot stroke="#10B981" />}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              No visitor time-series data for the selected period.
            </div>
          )}
          {hasData && !hasNonZeroSeries && (
            <div className="mt-2 text-center text-xs text-muted-foreground">
              Data loaded but all values are 0 for this date range.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
