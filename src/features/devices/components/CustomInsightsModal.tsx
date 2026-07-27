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

const CustomTooltip = ({ active, payload, label, expectedMetrics }: any) => {
  if (active && payload && payload.length) {
    const allMetrics = expectedMetrics || [];

    return (
      <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-md text-sm">
        <p className="text-slate-500 mb-2 font-medium">{label}</p>
        <div className="space-y-1">
          {allMetrics.map((metric: string, index: number) => {
            const entry = payload.find((p: any) => p.dataKey === `${metric}_norm`);
            const name = metric.split('.').pop() || metric;
            const color = entry ? entry.color : COLORS[index % COLORS.length];

            if (entry) {
              const originalDataKey = entry.dataKey.replace('_norm', '');
              const originalValue = entry.payload[originalDataKey];
              const displayValue = typeof originalValue === 'number' 
                ? (Number.isInteger(originalValue) ? originalValue : originalValue.toFixed(2))
                : originalValue;

              return (
                <div key={index} style={{ color }} className="flex justify-between gap-4">
                  <span className="font-medium">{name}</span>
                  <span className="font-semibold">{displayValue}</span>
                </div>
              );
            } else {
              return (
                <div key={index} style={{ color }} className="flex justify-between gap-4 opacity-50">
                  <span className="font-medium">{name}</span>
                  <span className="font-semibold italic">N/A</span>
                </div>
              );
            }
          })}
        </div>
      </div>
    );
  }
  return null;
};

export function CustomInsightsModal({ open, onOpenChange, customQueries }: CustomQueriesModalProps) {
  if (!customQueries || customQueries.length === 0) return null;

  const normalizedQueries = customQueries.map((query) => {
    if (!query.series || query.series.length === 0) return query;

    const newSeries = query.series.map((d: any) => ({ ...d }));

    query.metrics.forEach((metric) => {
      let min = Infinity;
      let max = -Infinity;
      query.series.forEach((d: any) => {
        if (d[metric] !== undefined && d[metric] !== null) {
          if (d[metric] < min) min = d[metric];
          if (d[metric] > max) max = d[metric];
        }
      });
      const range = max - min;
      newSeries.forEach((d: any) => {
        if (d[metric] !== undefined && d[metric] !== null) {
          if (range === 0) {
            d[`${metric}_norm`] = min === 0 ? 0 : 50;
          } else {
            d[`${metric}_norm`] = ((d[metric] - min) / range) * 100;
          }
        }
      });
    });

    return { ...query, series: newSeries };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-7xl max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Custom Insights</DialogTitle>
        </DialogHeader>
        <div className="space-y-8 mt-4">
          {normalizedQueries.map((query) => (
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
                        minTickGap={20}
                        tickFormatter={(val) => {
                          if (!val || typeof val !== 'string') return val;
                          const parts = val.split('-');
                          if (parts.length >= 3) {
                            return `${parts[1]}/${parts[2]}`;
                          }
                          return val;
                        }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={() => ""}
                        width={10}
                      />
                      <Tooltip content={<CustomTooltip expectedMetrics={query.metrics} />} />
                      {query.metrics.map((metric, idx) => (
                        <Line
                          key={metric}
                          type="monotone"
                          dataKey={`${metric}_norm`}
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
