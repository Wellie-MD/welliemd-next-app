import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium">Visitors</CardTitle>
        <Select defaultValue="today">
          <SelectTrigger className="w-32 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 12 }}
                dx={-10}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
                stroke="#8979FF"
                fill="#8979FF"
                fillOpacity={0.1}
                strokeWidth={2}
                name="Unique Visitors"
                dot={<CustomDot stroke="#8979FF" />}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
              <Area 
                type="monotone" 
                dataKey="totalVisitors" 
                stroke="#FF928A"
                fill="#FF928A"
                fillOpacity={0.1}
                strokeWidth={2}
                name="Total Visitors"
                dot={<CustomDot stroke="#FF928A" />}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
              <Area 
                type="monotone" 
                dataKey="totalPageviews" 
                stroke="#3CC3DF"
                fill="#3CC3DF"
                fillOpacity={0.1}
                strokeWidth={2}
                name="Total Pageviews"
                dot={<CustomDot stroke="#3CC3DF" />}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
              <Area 
                type="monotone" 
                dataKey="viewsPerVisit" 
                stroke="#FFAE4C"
                fill="#FFAE4C"
                fillOpacity={0.1}
                strokeWidth={2}
                name="Views Per Visit"
                dot={<CustomDot stroke="#FFAE4C" />}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}