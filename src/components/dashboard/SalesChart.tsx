"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"
import { ChartDataPoint } from "@/types/dashboard"

interface SalesChartProps {
  data: ChartDataPoint[]
}

export function SalesChart({ data }: SalesChartProps) {
  return (
    <Card className="rounded-2xl shadow-md bg-white w-full">
      <CardHeader className="flex flex-row items-center justify-between bg-blue-50 rounded-t-2xl">
        <CardTitle className="text-gray-800">Total Sales Each Year</CardTitle>
        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">View More</Button>
      </CardHeader>
      <CardContent className="w-full">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                interval={0}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                domain={[0, 300]}
                tickFormatter={(value) => `${value}M`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="2025" 
                stroke="#8979FF" 
                strokeWidth={2}
                dot={{ fill: "white", stroke: "#8979FF", strokeWidth: 2, r: 3 }}
                activeDot={{ r: 4, fill: "white", stroke: "#8979FF", strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="2024" 
                stroke="#FF928A" 
                strokeWidth={2}
                dot={{ fill: "white", stroke: "#FF928A", strokeWidth: 2, r: 3 }}
                activeDot={{ r: 4, fill: "white", stroke: "#FF928A", strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="2022" 
                stroke="#3CC3DF" 
                strokeWidth={2}
                dot={{ fill: "white", stroke: "#3CC3DF", strokeWidth: 2, r: 3 }}
                activeDot={{ r: 4, fill: "white", stroke: "#3CC3DF", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}