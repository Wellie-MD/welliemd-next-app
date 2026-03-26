"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Metric } from "@/types/dashboard"

interface MetricCardProps {
  metric: Metric
  className?: string
}

export function MetricCard({ metric, className }: MetricCardProps) {
  const TrendIcon = metric.trend === "up" ? TrendingUp : metric.trend === "down" ? TrendingDown : Minus
  
  return (
    <Card className={cn("min-w-[200px] max-w-[250px] rounded-2xl bg-white dark:bg-slate-900 border border-border/70 flex-shrink-0", className)}>
      <CardContent className="p-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600 dark:text-slate-400 whitespace-nowrap">{metric.title}</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-slate-100">{metric.value}</p>
          {metric.change && metric.change !== "-" && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              metric.trend === "up" && "text-green-600 dark:text-green-400",
              metric.trend === "down" && "text-red-600 dark:text-red-400",
              metric.trend === "neutral" && "text-gray-600 dark:text-slate-400"
            )}>
              <TrendIcon className="h-4 w-4" />
              {metric.change}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
