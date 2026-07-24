import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

const COLORS = [
  "#0ea5e9", // sky-500
  "#f59e0b", // amber-500
  "#10b981", // emerald-500
  "#8b5cf6", // violet-500
  "#ef4444", // red-500
]

interface CustomQueriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customQueries?: {
    id: string;
    name: string;
    metrics: string[];
    series: any[];
  }[] | undefined;
}

export function CustomInsightsModal({ open, onOpenChange, customQueries }: CustomQueriesModalProps) {
  if (!customQueries || customQueries.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Custom Insights</DialogTitle>
        </DialogHeader>
        <div className="space-y-8 mt-4">
          {customQueries.map((query) => (
            <div key={query.id} className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">{query.name}</h3>
              <div className="h-[300px] w-full bg-slate-50/50 rounded-xl p-4 border">
                {query.series && query.series.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={query.series}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        dx={-10}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        labelStyle={{ color: "#64748b", marginBottom: "4px" }}
                      />
                      {query.metrics.map((metric, idx) => (
                        <Line
                          key={metric}
                          type="monotone"
                          dataKey={metric}
                          name={metric.split('.').pop() || metric}
                          stroke={COLORS[idx % COLORS.length]}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4, strokeWidth: 0 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                    No data available yet.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
