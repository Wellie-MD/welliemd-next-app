"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Metric } from "@/types/dashboard"

interface MetricCardProps {
  metric: Metric
  className?: string
  comparisonLabel?: string
}

export function MetricCard({ metric, className, comparisonLabel }: MetricCardProps) {
  const TrendIcon = metric.trend === "up" ? TrendingUp : metric.trend === "down" ? TrendingDown : Minus
  
  return (
    <Card className={cn("min-w-[200px] max-w-[250px] rounded-2xl bg-white flex-shrink-0", className)}>
      <CardContent className="p-6">
        <div className="space-y-2.5">
          <p className="text-sm font-medium text-gray-600 whitespace-nowrap">{metric.title}</p>
          <p className="text-2xl font-bold text-gray-800">{metric.value}</p>
          {metric.change && metric.change !== "-" && (
            <div className="pt-0.5 min-h-5">
              <div className={cn(
                "flex items-center gap-1.5 text-sm font-medium leading-none",
                metric.trend === "up" && "text-green-600",
                metric.trend === "down" && "text-red-600",
                metric.trend === "neutral" && "text-gray-600"
              )}>
                <TrendIcon className="h-4 w-4 shrink-0" />
                <span>{metric.change}</span>
              </div>
              {comparisonLabel ? (
                <p className="mt-1 text-[10px] leading-none text-muted-foreground">{comparisonLabel}</p>
              ) : null}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
