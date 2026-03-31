import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string
  change?: string
  trend?: "up" | "down" | "neutral"
  className?: string
}

export function StatCard({ title, value, change, trend = "neutral", className }: StatCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus
  
  return (
    <Card className={cn("border rounded-lg overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="space-y-1">
          <p className="text-sm font-bolder text-gray-500 dark:text-slate-400">{title}</p>
          <div className="flex items-center justify-between">
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{value}</p>
            {change && (
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium",
                trend === "up" && "text-emerald-500",
                trend === "down" && "text-red-500",
                trend === "neutral" && "text-gray-500 dark:text-slate-400"
              )}>
                <TrendIcon className="h-4 w-4" />
                {change}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
