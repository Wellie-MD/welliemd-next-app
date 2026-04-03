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
  Line,
} from "recharts"

interface VisitorChartProps {
  data: any[]
}

interface ChartPoint {
  time: string
  totalVisitors: number
  uniqueVisitors: number
  totalPageviews: number
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

export function VisitorChart({ data }: VisitorChartProps) {
  const chartData: ChartPoint[] = Array.isArray(data)
    ? data.map((point) => ({
        time: String(point?.time ?? ""),
        totalVisitors: Number(point?.totalVisitors || 0),
        uniqueVisitors: Number(point?.uniqueVisitors || 0),
        totalPageviews: Number(point?.totalPageviews || 0),
      }))
    : []

  const hasData = chartData.length > 0
  const hasNonZeroSeries = hasData && chartData.some((point) => {
    const total = point.totalVisitors
    const unique = point.uniqueVisitors
    const pages = point.totalPageviews
    return total > 0 || unique > 0 || pages > 0
  })
  const maxVisitors = chartData.reduce((max, point) => Math.max(max, point.totalVisitors, point.uniqueVisitors), 0)
  const maxPageviews = chartData.reduce((max, point) => Math.max(max, point.totalPageviews), 0)
  const useDualAxis = maxPageviews > Math.max(1, maxVisitors) * 1.35
  const totalVisitors = chartData.reduce((sum, point) => sum + point.totalVisitors, 0)
  const totalUniqueVisitors = chartData.reduce((sum, point) => sum + point.uniqueVisitors, 0)
  const totalPageviews = chartData.reduce((sum, point) => sum + point.totalPageviews, 0)
  const totalPoints = chartData.length

  return (
    <Card className="border-border/70 bg-gradient-to-br from-primary/5 via-background to-blue-50/30 dark:from-primary/10 dark:to-slate-900/40 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-medium">Visitors Trend</CardTitle>
          <p className="text-xs text-muted-foreground">
            {useDualAxis
              ? "Pageviews are shown on a separate scale for accurate comparison."
              : "All series use the same scale."}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {hasData && (
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-md border bg-white/70 dark:bg-slate-900/70 dark:border-slate-700 px-2 py-1.5 text-xs">
              <div className="text-muted-foreground">Data Points</div>
              <div className="font-semibold">{formatNumber(totalPoints)}</div>
            </div>
            <div className="rounded-md border bg-white/70 dark:bg-slate-900/70 dark:border-slate-700 px-2 py-1.5 text-xs">
              <div className="text-muted-foreground">Total Visitors</div>
              <div className="font-semibold">{formatNumber(totalVisitors)}</div>
            </div>
            <div className="rounded-md border bg-white/70 dark:bg-slate-900/70 dark:border-slate-700 px-2 py-1.5 text-xs">
              <div className="text-muted-foreground">Unique Visitors</div>
              <div className="font-semibold">{formatNumber(totalUniqueVisitors)}</div>
            </div>
            <div className="rounded-md border bg-white/70 dark:bg-slate-900/70 dark:border-slate-700 px-2 py-1.5 text-xs">
              <div className="text-muted-foreground">Pageviews</div>
              <div className="font-semibold">{formatNumber(totalPageviews)}</div>
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
                  <linearGradient id="pvGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.02} />
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
                {useDualAxis && (
                  <YAxis
                    yAxisId="pageviews"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    allowDecimals={false}
                    domain={[0, "auto"]}
                  />
                )}
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
                {useDualAxis ? (
                  <Line
                    type="monotone"
                    dataKey="totalPageviews"
                    yAxisId="pageviews"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={<CustomDot stroke="#F59E0B" />}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                    name="Total Pageviews"
                  />
                ) : (
                  <Area 
                  type="monotone" 
                  dataKey="totalPageviews" 
                  yAxisId="visitors"
                  stroke="#F59E0B"
                  fill="url(#pvGradient)"
                  strokeWidth={2}
                  name="Total Pageviews"
                  dot={<CustomDot stroke="#F59E0B" />}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
                )}
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
