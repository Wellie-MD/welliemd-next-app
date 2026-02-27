import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Dot } from "recharts"

interface VisitorChartProps {
  data: any[]
}

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  return (
    <Dot
      cx={cx}
      cy={cy}
      r={4}
      stroke={props.stroke}
      strokeWidth={2}
      fill="white"
    />
  );
};

export function VisitorChart({ data }: VisitorChartProps) {
  const hasData = Array.isArray(data) && data.length > 0

  return (
    <Card className="border-border/70 bg-gradient-to-br from-primary/5 via-background to-blue-50/30 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium">Visitors</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[380px] rounded-md border bg-background/70 p-2">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
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
                <XAxis 
                  dataKey="time" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    boxShadow: '0 8px 20px rgba(15,23,42,0.10)'
                  }}
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
                  stroke="#10B981"
                  fill="url(#tvGradient)"
                  strokeWidth={2}
                  name="Total Visitors"
                  dot={<CustomDot stroke="#10B981" />}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="totalPageviews" 
                  stroke="#F59E0B"
                  fill="url(#pvGradient)"
                  strokeWidth={2}
                  name="Total Pageviews"
                  dot={<CustomDot stroke="#F59E0B" />}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              No visitor time-series data for the selected period.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
