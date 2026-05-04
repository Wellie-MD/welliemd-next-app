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
  const tone =
    metric.impact ??
    (metric.trend === "up" ? "good" : metric.trend === "down" ? "bad" : "neutral")
  const hasZeroBaselineNote =
    metric.change?.toLowerCase().includes("previous period was 0") ||
    metric.value?.toLowerCase().includes("previous period was 0")
  const hasDashBaseline = metric.value === "-" || metric.change === "-"
  const compactValue = metric.value?.toLowerCase().includes("previous period was 0")
    ? "New"
    : metric.value
  const compactChange = metric.change?.toLowerCase().includes("previous period was 0")
    ? "New"
    : metric.change
  
  return (
    <Card className={cn("min-w-[220px] sm:min-w-[240px] max-w-[320px] rounded-2xl bg-white flex-shrink-0", className)}>
      <CardContent className="p-6">
        <div className="space-y-2.5">
          <p className="text-sm font-medium text-gray-600 leading-tight break-words">{metric.title}</p>
          <p className="text-2xl font-bold text-gray-800 leading-tight break-words">{compactValue}</p>
          {(metric.change || hasDashBaseline || hasZeroBaselineNote) && (
            <div className="pt-0.5 min-h-5">
              {metric.change && metric.change !== "-" ? (
                <div className={cn(
                  "flex items-center gap-1.5 text-sm font-medium leading-none",
                  tone === "good" && "text-green-600",
                  tone === "bad" && "text-red-600",
                  tone === "neutral" && "text-gray-600"
                )}>
                  <TrendIcon className="h-4 w-4 shrink-0" />
                  <span className="break-words">{compactChange}</span>
                </div>
              ) : null}
              {(hasZeroBaselineNote || hasDashBaseline) ? (
                <p className="mt-1 text-[10px] leading-none text-muted-foreground">
                  No previous-period baseline available for comparison
                </p>
              ) : null}
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
