"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"
import { ChartDataPoint } from "@/types/dashboard"
import { useNavigate } from "react-router-dom"

interface NewPatientChartProps {
  data: ChartDataPoint[]
}

export function NewPatientChart({ data }: NewPatientChartProps) {
  const navigate = useNavigate()

  return (
    <Card className="rounded-2xl shadow-md bg-white w-full">
      <CardHeader className="flex flex-row items-center justify-between bg-blue-50 rounded-t-2xl">
        <CardTitle className="text-gray-800">New Patient</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-700"
          onClick={() => navigate("/dashboard/patients")}
        >
          View All
        </Button>
      </CardHeader>
      <CardContent className="w-full">
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap="20%" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                domain={[0, 100]}
              />
              <Legend />
              <Bar 
                dataKey="lastWeek" 
                fill="#8979FF" 
                name="Last Week"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="currentWeek" 
                fill="#FF928A" 
                name="Current week"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}