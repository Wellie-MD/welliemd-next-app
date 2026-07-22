"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, TrendingDown, TrendingUp, Minus, Users, Package, Eye, Clock3, UserRound } from "lucide-react";
import { differenceInCalendarDays, format, startOfMonth, startOfYear, subDays, subMonths, endOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchDashboardCharts, fetchDashboardMetrics } from "@/api/dashboardApi";
import { fetchOrders } from "@/api/ordersApi";
import { fetchClientPaymentHistory } from "@/api/paymentTransactionsApi";
import { DashboardChartPoint, DashboardMetrics, PatientSummary } from "@/types/dashboard";

interface DateRange { from: Date; to: Date }
interface Row { [key: string]: string | number | null | undefined }
interface ChartWindow { period?: { start: string; end: string }; comparison?: { start: string; end: string } }

const ranges = [
  { label: "7 Days", value: "7d", get: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
  { label: "30 Days", value: "30d", get: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  { label: "This Month", value: "tm", get: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { label: "Last Month", value: "lm", get: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: "This Year", value: "ytd", get: () => ({ from: startOfYear(new Date()), to: new Date() }) },
];

const money = (value: number | null | undefined) => value == null ? "—" : `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const count = (value: number | null | undefined) => value == null ? "—" : value.toLocaleString();
const pct = (value: number | null | undefined) => value == null ? "—" : `${value.toFixed(1)}%`;
const dateKey = (date: Date) => format(date, "yyyy-MM-dd");
const parseDateValue = (value: string | Date) => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? new Date(`${trimmed}T00:00:00`) : new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const displayDate = (value: string | Date) => {
  const parsed = parseDateValue(value);
  return parsed ? format(parsed, "MMM d, yyyy") : String(value || "—");
};
const periodText = (start: string | Date, end: string | Date, separator = "–") => `${displayDate(start)} ${separator} ${displayDate(end)}`;
const comparisonForRange = (range: DateRange) => {
  const days = Math.max(differenceInCalendarDays(range.to, range.from) + 1, 1);
  const end = subDays(range.from, 1);
  return { from: subDays(end, days - 1), to: end };
};
const comparisonForPreset = (range: DateRange, preset: string): DateRange => {
  if (preset === "tm") {
    const previousMonth = subMonths(range.from, 1);
    return { from: startOfMonth(previousMonth), to: subMonths(range.to, 1) };
  }
  if (preset === "lm") {
    const previousMonth = subMonths(range.from, 1);
    return { from: startOfMonth(previousMonth), to: endOfMonth(previousMonth) };
  }
  return comparisonForRange(range);
};
const ratioPct = (value: number | null | undefined, total: number | null | undefined) => !total ? null : Math.round(((value || 0) / total) * 1000) / 10;
const numberFromDisplay = (value: string | undefined) => {
  if (!value) return undefined;
  const normalized = value.replace(/[$,%\s,]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};
const deltaText = (current: number | null | undefined, previous: number | null | undefined) => {
  const cur = current || 0, prev = previous || 0;
  if (!cur && !prev) return "no activity in prior period";
  if (!prev) return "no prior-period baseline";
  const change = Math.round(((cur - prev) / Math.abs(prev)) * 1000) / 10;
  return `${change >= 0 ? "▲ +" : "▼ "}${change}% vs prior period`;
};
function MetricCard({ title, value, change, trend = "neutral", support }: { title: string; value: string; change?: string; trend?: "up" | "down" | "neutral"; support?: string }) {
  const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const renderSupport = (text: string) => {
    const match = text.match(/([▲▼]\s*)?([+-]?\d+(?:\.\d+)?%?)/);
    if (!match || match.index == null) return text;
    const token = `${match[1] || ""}${match[2]}`;
    const numeric = Number(match[2].replace("%", ""));
    const tone = numeric > 0 ? "text-emerald-600 dark:text-emerald-400" : numeric < 0 ? "text-red-600 dark:text-red-400" : "text-slate-400";
    return <><span>{text.slice(0, match.index)}</span><span className={tone}>{token}</span><span>{text.slice(match.index + token.length)}</span></>;
  };
  return <div className="rounded-[11px] border border-slate-200 bg-white px-4 py-3.5 shadow-none dark:border-slate-700 dark:bg-slate-900">
    <div className="text-[11px] font-medium text-slate-400">{title}</div>
    <div className="mt-1.5 text-[23px] font-bold tracking-tight text-slate-900 dark:text-slate-100">{value}</div>
    <div className={cn("mt-1 flex min-h-4 items-center gap-1 text-[11px] text-slate-400", !support && trend === "up" && "text-emerald-600 dark:text-emerald-400", !support && trend === "down" && "text-red-600 dark:text-red-400")}>
      {support ? renderSupport(support) : change && <><Icon className="h-3 w-3" />{change}<span className="text-slate-400">vs prior period</span></>}
    </div>
  </div>;
}

function PatientSummaryCard({ summary }: { summary: PatientSummary | undefined }) {
  const rows = [
    ["Total Patients", "All patients across every status", summary?.total_patients, Users, "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"],
    ["Active", "Active in one or more treatments", summary?.active_patients, Package, "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"],
    ["In Review", "Awaiting provider decision", summary?.in_review_patients, Eye, "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"],
    ["Lapsed", "Previously active, none current", summary?.lapsed_patients, Clock3, "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"],
    ["Registered", "Never had an active treatment", summary?.registered_patients, UserRound, "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"],
  ] as const;
  return <section className="rounded-[11px] border border-slate-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-slate-900">
    <h2 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">Patient Summary</h2>
    <div className="mt-2">
      {rows.map(([label, sub, value, Icon, iconClass], index) => <div key={label} className={cn("flex items-center gap-3 py-3.5", index > 0 && "border-t border-slate-100 dark:border-slate-800")}>
        <div className={cn("flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px]", iconClass)}><Icon className="h-[17px] w-[17px]" /></div>
        <div className="min-w-0 flex-1 text-[12.5px]"><b className="block text-[13px] text-slate-900 dark:text-slate-100">{label}</b><span className="text-[11.5px] text-slate-400">{sub}</span></div>
        <div className="text-[22px] font-bold text-slate-900 dark:text-slate-100">{count(value)}</div>
      </div>)}
    </div>
  </section>;
}

function LineChart({ title, dataKey, color, data, previous, currency, rangeLabel, activeRange }: { title: string; dataKey: "total_sales" | "net_revenue" | "new_patients"; color: string; data: DashboardChartPoint[]; previous: DashboardChartPoint[]; currency?: boolean; rangeLabel: string; activeRange: string }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const width = 900, height = 250, left = 42, right = 18, top = 24, bottom = 38;
  const plotRight = width - right;
  const values = data.map((item) => Number(item[dataKey]) || 0);
  const previousValues = previous.map((item) => Number(item[dataKey]) || 0);
  const hasPrevious = previousValues.length > 1;
  const max = Math.max(values[values.length - 1] || 0, hasPrevious ? previousValues[previousValues.length - 1] : 0, 1);
  const point = (value: number, index: number, total: number) => [left + (index / Math.max(total - 1, 1)) * (width - left - right), height - bottom - (value / max) * (height - top - bottom)];
  const smoothPath = (valuesToDraw: number[]) => {
    const points = valuesToDraw.map((value, index) => point(value, index, valuesToDraw.length));
    if (points.length < 3) return points.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
    const slopes = valuesToDraw.map((value, index) => {
      const prev = valuesToDraw[index - 1];
      const next = valuesToDraw[index + 1];
      if (prev == null && next == null) return 0;
      if (prev == null) return next - value;
      if (next == null) return value - prev;
      const leftSlope = value - prev;
      const rightSlope = next - value;
      if (leftSlope === 0 || rightSlope === 0 || Math.sign(leftSlope) !== Math.sign(rightSlope)) return 0;
      return (leftSlope + rightSlope) / 2;
    });
    let d = `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
    for (let index = 0; index < points.length - 1; index += 1) {
      const p1 = points[index], p2 = points[index + 1];
      const dx = (p2[0] - p1[0]) / 3;
      const scale = (height - top - bottom) / max;
      const c1x = p1[0] + dx;
      const c2x = p2[0] - dx;
      const c1y = p1[1] - (slopes[index] * scale) / 3;
      const c2y = p2[1] + (slopes[index + 1] * scale) / 3;
      d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
  };
  const currentPath = smoothPath(values);
  const latest = values[values.length - 1] || 0;
  const [latestX, latestY] = point(latest, Math.max(values.length - 1, 0), Math.max(values.length, 1));
  const previousLatest = previousValues[previousValues.length - 1] || 0;
  const [previousX, previousY] = point(previousLatest, Math.max(previousValues.length - 1, 0), Math.max(previousValues.length, 1));
  const formatValue = (value: number) => currency ? money(value) : value.toLocaleString();
  const formatAxisDate = (day?: string) => day ? displayDate(day).replace(/, \d{4}$/, "") : "";
  const formatMonthYear = (day?: string) => {
    const parsed = day ? parseDateValue(day) : null;
    return parsed ? `${format(parsed, "MMM")}'${format(parsed, "yy")}` : "";
  };
  const formatDayMonth = (day?: string) => {
    const parsed = day ? parseDateValue(day) : null;
    return parsed ? format(parsed, "dd MMM") : "";
  };
  const incrementValues = values.map((value, index) => Math.max(0, value - (values[index - 1] || 0)));
  const bucket = (() => {
    const start = data[0]?.day ? parseDateValue(data[0].day) : null;
    const end = data[data.length - 1]?.day ? parseDateValue(data[data.length - 1].day) : null;
    if (!start || !end || !data.length) return null;
    const days = differenceInCalendarDays(end, start);
    const edges: Date[] = [], labels: string[] = [];
    if (days <= 16) {
      data.forEach((item) => { const parsed = parseDateValue(item.day); if (parsed) { edges.push(parsed); labels.push(formatAxisDate(item.day)); } });
    } else if (days <= 112) {
      const cursor = new Date(start);
      cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7));
      while (cursor <= end) {
        const edge = new Date(cursor);
        edges.push(edge);
        labels.push(`wk ${formatAxisDate(edge >= start ? edge : start)}`);
        cursor.setDate(cursor.getDate() + 7);
      }
    } else {
      const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
      while (cursor <= end) {
        const edge = new Date(cursor);
        edges.push(edge);
        labels.push(format(edge, "MMM"));
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }
    const vals = edges.map(() => 0);
    data.forEach((item, index) => {
      const parsed = parseDateValue(item.day);
      if (!parsed) return;
      let bucketIndex = 0;
      for (let edgeIndex = edges.length - 1; edgeIndex >= 0; edgeIndex -= 1) {
        if (parsed >= edges[edgeIndex]) { bucketIndex = edgeIndex; break; }
      }
      vals[bucketIndex] += incrementValues[index] || 0;
    });
    const peak = vals.reduce((best, value, index) => value > best.value ? { value, index } : best, { value: 0, index: 0 });
    return peak.value > 0 ? { unit: days <= 16 ? "day" : days <= 112 ? "week" : "month", label: labels[peak.index], value: peak.value } : null;
  })();
  const hover = hoverIndex == null ? null : {
    index: hoverIndex,
    current: values[hoverIndex] || 0,
    previous: previousValues[hoverIndex] || 0,
    currentDate: data[hoverIndex]?.day,
    previousDate: previous[hoverIndex]?.day,
    currentPoint: point(values[hoverIndex] || 0, hoverIndex, Math.max(values.length, 1)),
    previousPoint: point(previousValues[hoverIndex] || 0, hoverIndex, Math.max(previousValues.length, 1)),
  };
  const handlePointerMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (values.length < 1) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * width;
    const rawIndex = Math.round(((x - left) / (width - left - right)) * (values.length - 1));
    setHoverIndex(Math.max(0, Math.min(values.length - 1, rawIndex)));
  };
  const xTicks = (() => {
    if (!data.length) return [];
    const tick = (index: number, label: string) => ({ index, label, x: point(0, index, data.length)[0] });
    const indexForDay = (dayOfMonth: number) => {
      const found = data.findIndex((item) => parseDateValue(item.day)?.getDate() === dayOfMonth);
      return found >= 0 ? found : null;
    };
    if (activeRange === "tm") {
      const start = tick(0, formatMonthYear(data[0]?.day));
      const endDay = parseDateValue(data[data.length - 1]?.day)?.getDate() || 0;
      const monthCadence = endDay > 20 ? [5, 10, 15, 20] : [3, 7, 11, 15];
      const dayTicks = monthCadence
        .map((day) => {
          const index = indexForDay(day);
          return index == null || index === 0 || index === data.length - 1 ? null : tick(index, formatDayMonth(data[index]?.day));
        })
        .filter((item): item is { index: number; label: string; x: number } => item != null);
      return [start, ...dayTicks];
    }
    if (activeRange === "lm") {
      const lastDate = parseDateValue(data[data.length - 1]?.day);
      const nextMonth = lastDate ? new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 1) : null;
      const ticks = [tick(0, formatMonthYear(data[0]?.day))];
      [8, 16, 24].forEach((day) => {
        const index = indexForDay(day);
        if (index != null) ticks.push(tick(index, formatDayMonth(data[index]?.day)));
      });
      if (data.length > 1) ticks.push(tick(data.length - 1, nextMonth ? `${format(nextMonth, "MMM")}'${format(nextMonth, "yy")}` : formatMonthYear(data[data.length - 1]?.day)));
      return ticks;
    }
    if (activeRange === "ytd") {
      return data.reduce<{ index: number; label: string; x: number }[]>((ticks, item, index) => {
        const parsed = parseDateValue(item.day);
        if (parsed && parsed.getDate() === 1) ticks.push(tick(index, formatMonthYear(item.day)));
        return ticks;
      }, []);
    }
    const candidates = [0, Math.round((data.length - 1) * 0.25), Math.round((data.length - 1) * 0.5), Math.round((data.length - 1) * 0.75), data.length - 1];
    return Array.from(new Set(candidates)).map((index) => tick(index, formatAxisDate(data[index]?.day)));
  })();
  const yTicks = [0, 1 / 3, 2 / 3, 1].map((fraction) => {
    const value = Math.round(max * fraction);
    const y = height - bottom - fraction * (height - top - bottom);
    return { fraction, value, y };
  });
  return <section className="rounded-[11px] border border-slate-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-slate-900">
    <div><h2 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">{title}</h2><div className="mt-0.5 text-[12px] font-normal text-slate-900 dark:text-slate-100">{rangeLabel}</div></div>
    <div className="my-3 flex min-h-[34px] items-start gap-6 text-[11.5px] text-slate-400">
      {bucket && <div>Peak {bucket.unit} · {bucket.label}<b className="block text-[14px] text-slate-900 dark:text-slate-100">{formatValue(bucket.value)}</b></div>}
    </div>
    <div className="relative h-[250px] w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full cursor-default overflow-visible" role="img" aria-label={`${title} chart`} onMouseMove={handlePointerMove} onMouseLeave={() => setHoverIndex(null)}>
        <defs>
          <linearGradient id={`fill-${dataKey}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".22" /><stop offset=".7" stopColor={color} stopOpacity=".04" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient>
          <filter id={`shadow-${dataKey}`} x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2.5" stdDeviation="3.5" floodColor={color} floodOpacity=".28" /></filter>
        </defs>
        {yTicks.map(({ fraction, value, y }) => <g key={fraction}><line x1={left} x2={plotRight} y1={y} y2={y} className="stroke-slate-200 dark:stroke-slate-700" strokeDasharray={fraction === 0 ? undefined : "2 5"} opacity={fraction === 0 ? 1 : 0.8} /><text x={left - 8} y={fraction === 0 ? y - 4 : Math.max(top + 9, y - 5)} textAnchor="end" fontSize="11" className="fill-slate-400">{formatValue(value)}</text></g>)}
        <line x1={left} x2={plotRight} y1={height - bottom} y2={height - bottom} className="stroke-slate-200 dark:stroke-slate-700" />
        {hasPrevious && <path d={smoothPath(previousValues)} fill="none" className="stroke-slate-400" strokeWidth="2" strokeDasharray="5 6" strokeLinecap="round" opacity=".5" />}
        <path d={`${currentPath} L${plotRight} ${height - bottom} L${left} ${height - bottom} Z`} fill={`url(#fill-${dataKey})`} />
        <path d={currentPath} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" filter={`url(#shadow-${dataKey})`} />
        <circle cx={latestX} cy={latestY} r="9" fill={color} opacity=".18" /><circle cx={latestX} cy={latestY} r="4.5" fill={color} className="stroke-white dark:stroke-slate-900" strokeWidth="2" />
        {hover && <g pointerEvents="none">
          <line x1={hover.currentPoint[0]} x2={hover.currentPoint[0]} y1={top} y2={height - bottom} className="stroke-slate-300 dark:stroke-slate-600" strokeDasharray="3 4" />
          {hasPrevious && <circle cx={hover.previousPoint[0]} cy={hover.previousPoint[1]} r="4.5" className="fill-slate-400 stroke-white dark:stroke-slate-900" strokeWidth="2" />}
          <circle cx={hover.currentPoint[0]} cy={hover.currentPoint[1]} r="5" fill={color} className="stroke-white dark:stroke-slate-900" strokeWidth="2" />
        </g>}
        {xTicks.map(({ index, label, x }) => <text key={index} x={x} y={height - 8} textAnchor={index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"} fontSize="11" className="fill-slate-400">{label}</text>)}
      </svg>
      {hover && <div className="pointer-events-none absolute top-8 z-10 rounded-[7px] border border-slate-200 bg-white px-3 py-2 text-[11px] shadow-lg dark:border-slate-700 dark:bg-slate-900" style={{ left: `min(max(${(hover.currentPoint[0] / width) * 100}%, 8px), calc(100% - 210px))` }}>
        <div className="mb-1 font-semibold text-slate-900 dark:text-slate-100">{formatAxisDate(hover.currentDate)}</div>
        <div className="flex min-w-[165px] items-center justify-between gap-4 text-slate-500 dark:text-slate-300"><span><i className="mr-1.5 inline-block h-2 w-2 rounded-sm" style={{ background: color }} />Current period</span><b>{formatValue(hover.current)}</b></div>
        {hasPrevious && <div className="mt-1 flex items-center justify-between gap-4 text-slate-500 dark:text-slate-300"><span><i className="mr-1.5 inline-block h-2 w-2 rounded-sm bg-slate-400" />Prior period{hover.previousDate ? ` · ${formatAxisDate(hover.previousDate)}` : ""}</span><b>{formatValue(hover.previous)}</b></div>}
      </div>}
    </div>
    {hasPrevious && <div className="mt-2 flex justify-center gap-5 text-[11px] text-slate-400"><span><i className="mr-1.5 inline-block h-[9px] w-[9px] rounded-[2px] align-middle" style={{ background: color }} />Current period</span><span><i className="mr-1.5 inline-block h-[9px] w-[9px] rounded-[2px] bg-slate-400 align-middle" />Prior period</span></div>}
  </section>;
}

export default function Dashboard() {
  const initialRange = ranges[1].get();
  const [dateRange, setDateRange] = useState<DateRange>(initialRange);
  const [comparisonRange, setComparisonRange] = useState<DateRange>(comparisonForPreset(initialRange, "30d"));
  const [activeRange, setActiveRange] = useState("30d");
  const [customOpen, setCustomOpen] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [charts, setCharts] = useState<{ current: DashboardChartPoint[]; previous: DashboardChartPoint[] }>({ current: [], previous: [] });
  const [chartWindow, setChartWindow] = useState<ChartWindow>({});
  const [orders, setOrders] = useState<Row[]>([]);
  const [payments, setPayments] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const from = dateKey(dateRange.from), to = dateKey(dateRange.to);
    const comparisonFrom = dateKey(comparisonRange.from), comparisonTo = dateKey(comparisonRange.to);
    const dashboardFilters = { start_date: from, end_date: to, comparison_start_date: comparisonFrom, comparison_end_date: comparisonTo };
    try {
      const [metricData, chartData, orderData, paymentData] = await Promise.all([
        fetchDashboardMetrics(dashboardFilters),
        fetchDashboardCharts(undefined, dashboardFilters),
        fetchOrders({ created_at__gte: `${from}T00:00:00`, created_at__lte: `${to}T23:59:59`, page_size: 8, ordering: "-created_at" }),
        fetchClientPaymentHistory({ date_from: from, date_to: to }),
      ]);
      setMetrics(metricData); setCharts({ current: chartData.current || [], previous: chartData.previous || [] }); setChartWindow({ period: chartData.period, comparison: chartData.comparison });
      setOrders((orderData.results || []).slice(0, 8).map((item) => ({ id: item.id, date: item.orderDate || item.created_at || "", orderNumber: item.order_id || item.display_id || item.id || "", name: item.name || item.patient?.full_name || "", product: item.product_name || "", pharmacy: item.pharmacy_display || "", amount: item.amount || "" })));
      setPayments((paymentData.results || []).slice(0, 8).map((item) => ({ id: item.id, date: item.date, patientName: item.patient_name, orderNumber: item.order_number, authorized: item.authorized_amount ?? item.total_amount, holdReleased: item.hold_released ?? "0.00", captured: item.captured_amount ?? item.amount_paid })));
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load dashboard data."); }
    finally { setLoading(false); }
  }, [comparisonRange, dateRange]);
  useEffect(() => { void load(); }, [load]);

  const kpis = useMemo(() => {
    const list = metrics?.kpis || [];
    const get = (names: string[]) => list.find((item) => names.includes(item.title));
    const revenue = get(["Revenue", "Captured Revenue"]); const expenses = get(["Expenses", "Total Expense"]); const net = get(["Net Profit", "Net Profit (margin)"]); const totalOrders = get(["Total Orders"]);
    const totalRevenue = metrics?.total_revenue ?? numberFromDisplay(revenue?.value);
    const totalExpenses = metrics?.total_expenses ?? numberFromDisplay(expenses?.value);
    const totalProfit = metrics?.total_profit ?? numberFromDisplay(net?.value);
    const previousRevenue = charts.previous.at(-1)?.net_revenue as number | undefined;
    const previousCapturedOrders = charts.previous.at(-1)?.total_sales as number | undefined;
    const expenseRatio = ratioPct(totalExpenses, totalRevenue);
    const netRatio = ratioPct(totalProfit, totalRevenue);
    const supportDelta = (metric: typeof revenue, fallback?: string) => metric?.change ? `${metric.change} vs prior period` : fallback;
    return [
      { title: "Captured Revenue", value: revenue?.value || money(totalRevenue), change: revenue?.change, trend: revenue?.trend, support: supportDelta(revenue, deltaText(totalRevenue, previousRevenue)) },
      { title: "Expenses", value: expenses?.value || money(totalExpenses), change: expenses?.change, trend: expenses?.trend, support: expenseRatio == null ? "no revenue in period" : `${expenseRatio}% of revenue` },
      { title: "Net Profit (margin)", value: net?.value || money(totalProfit), change: net?.change, trend: net?.trend, support: netRatio == null ? "no revenue in period" : `${netRatio}% of revenue` },
      { title: "Total Orders", value: totalOrders?.value || count(metrics?.total_orders), change: totalOrders?.change, trend: totalOrders?.trend, support: supportDelta(totalOrders) },
      { title: "Captured Orders", value: count(metrics?.captured_orders ?? metrics?.total_sales), change: undefined, trend: "neutral" as const, support: deltaText(metrics?.captured_orders ?? metrics?.total_sales, previousCapturedOrders) },
      { title: "Avg Order Value", value: money(metrics?.average_order_value), change: undefined, trend: "neutral" as const, support: "captured $ / captured orders" },
      { title: "Conversion Rate", value: pct(metrics?.conversion_rate), change: undefined, trend: "neutral" as const, support: "captured / total orders" },
    ];
  }, [charts.previous, metrics]);
  const applyPreset = (preset: typeof ranges[number]) => {
    const nextRange = preset.get();
    setActiveRange(preset.value);
    setCustomOpen(false);
    setDateRange(nextRange);
    setComparisonRange(comparisonForPreset(nextRange, preset.value));
  };
  const toggleCustom = () => {
    if (customOpen) {
      setCustomOpen(false);
      return;
    }
    setActiveRange("custom");
    setCustomOpen(true);
    setComparisonRange(comparisonForPreset(dateRange, "custom"));
  };
  const updateCustomDate = (key: "from" | "to" | "comparisonFrom" | "comparisonTo", value: string) => {
    const parsed = parseDateValue(value);
    if (!parsed) return;
    if (key === "from") setDateRange((current) => parsed <= current.to ? { ...current, from: parsed } : current);
    if (key === "to") setDateRange((current) => current.from <= parsed ? { ...current, to: parsed } : current);
    if (key === "comparisonFrom") setComparisonRange((current) => parsed <= current.to ? { ...current, from: parsed } : current);
    if (key === "comparisonTo") setComparisonRange((current) => current.from <= parsed ? { ...current, to: parsed } : current);
  };
  const windowMatchesFilter = chartWindow.period?.start === dateKey(dateRange.from) && chartWindow.period?.end === dateKey(dateRange.to);
  const currentRangeLabel = windowMatchesFilter && chartWindow.period ? periodText(chartWindow.period.start, chartWindow.period.end, "—") : periodText(dateRange.from, dateRange.to, "—");
  const comparisonRangeLabel = windowMatchesFilter && chartWindow.comparison ? periodText(chartWindow.comparison.start, chartWindow.comparison.end) : periodText(comparisonRange.from, comparisonRange.to);
  const rangeLabel = `${currentRangeLabel} · compared vs ${comparisonRangeLabel}`;
  const chartRangeLabel = currentRangeLabel;
  const summary = metrics?.patient_summary;
  return <div className="min-h-full bg-[#f7f8fa] px-4 py-5 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-7 sm:py-6">
    <div className="mx-auto max-w-[1500px]">
      <header className="mb-[18px] flex flex-col justify-between gap-4 2xl:flex-row 2xl:items-start">
        <div className="min-w-0"><h1 className="text-[22px] font-bold tracking-tight">Dashboard</h1><p className="mt-1 max-w-[620px] text-[13px] text-slate-400">{rangeLabel}</p></div>
        <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_34px] items-center gap-1.5 sm:grid-cols-[repeat(6,max-content)_34px] 2xl:justify-end">
          <div className="contents">{ranges.map((range) => <button key={range.value} onClick={() => applyPreset(range)} className={cn("h-[31px] rounded-[7px] border px-3 text-[12px] font-medium", activeRange === range.value ? "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300" : "border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300")}>{range.label}</button>)}</div>
          <button type="button" onClick={toggleCustom} className={cn("h-[31px] rounded-[7px] border px-3 text-[12px] font-medium", activeRange === "custom" ? "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300" : "border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300")}>Custom</button>
          <Button variant="outline" size="sm" className="h-[31px] w-[34px] rounded-[7px] p-0" onClick={() => void load()} disabled={loading} aria-label="Refresh dashboard"><RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /></Button>
        </div>
      </header>
      {customOpen && <div className="mb-4 -mt-1 flex flex-wrap items-center justify-end gap-2 rounded-[10px] border border-slate-200 bg-white px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-900">
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Period</span>
        <input type="date" value={dateKey(dateRange.from)} onChange={(event) => updateCustomDate("from", event.target.value)} className="h-[31px] w-[150px] rounded-[7px] border border-slate-200 bg-white px-2.5 text-[12px] text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200" />
        <span className="text-xs text-slate-400">–</span>
        <input type="date" value={dateKey(dateRange.to)} onChange={(event) => updateCustomDate("to", event.target.value)} className="h-[31px] w-[150px] rounded-[7px] border border-slate-200 bg-white px-2.5 text-[12px] text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200" />
        <span className="mx-1 h-[22px] w-px bg-slate-200 dark:bg-slate-700" />
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Compare vs</span>
        <input type="date" value={dateKey(comparisonRange.from)} onChange={(event) => updateCustomDate("comparisonFrom", event.target.value)} className="h-[31px] w-[150px] rounded-[7px] border border-slate-200 bg-white px-2.5 text-[12px] text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200" />
        <span className="text-xs text-slate-400">–</span>
        <input type="date" value={dateKey(comparisonRange.to)} onChange={(event) => updateCustomDate("comparisonTo", event.target.value)} className="h-[31px] w-[150px] rounded-[7px] border border-slate-200 bg-white px-2.5 text-[12px] text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200" />
      </div>}
      {error && <div className="mb-4 rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</div>}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">{kpis.map((kpi) => <MetricCard key={kpi.title} {...kpi} />)}</div>
      <div className="grid gap-[18px] xl:grid-cols-2"><LineChart title="Orders" dataKey="total_sales" color="#3b82f6" data={charts.current} previous={charts.previous} rangeLabel={chartRangeLabel} activeRange={activeRange} /><PatientSummaryCard summary={summary} /><LineChart title="Captured Revenue" dataKey="net_revenue" color="#16a34a" currency data={charts.current} previous={charts.previous} rangeLabel={chartRangeLabel} activeRange={activeRange} /><LineChart title="New Patients" dataKey="new_patients" color="#8b5cf6" data={charts.current} previous={charts.previous} rangeLabel={chartRangeLabel} activeRange={activeRange} /></div>
      <div className="mt-[18px] grid gap-[18px] xl:grid-cols-2"><HistoryTable title="Order History" columns={[["date", "DATE"], ["orderNumber", "ORDER#"], ["name", "NAME"], ["product", "PRODUCT"], ["pharmacy", "PHARMACY"], ["amount", "AMOUNT"]]} rows={orders} empty="No orders in this period." navigateTo="/dashboard/orders" /><HistoryTable title="Payments — Auth & Capture" columns={[["date", "DATE"], ["patientName", "PATIENT"], ["orderNumber", "ORDER#"], ["authorized", "AUTHORIZED"], ["holdReleased", "HOLD RELEASED"], ["captured", "CAPTURED"]]} rows={payments} empty="No captured payments in this period." navigateTo="/dashboard/orders/payments" /></div>
      {loading && <div className="mt-3 text-xs text-slate-400">Loading dashboard data…</div>}
    </div>
  </div>;
}

function HistoryTable({ title, columns, rows, empty, navigateTo }: { title: string; columns: [string, string][]; rows: Row[]; empty: string; navigateTo: string }) {
  const cellValue = (row: Row, key: string) => {
    if (key === "date" && row[key]) return displayDate(String(row[key]));
    if (key === "amount" || key === "authorized" || key === "holdReleased" || key === "captured") return money(Number(row[key]));
    return String(row[key] ?? "—");
  };
  return <section className="overflow-hidden rounded-[11px] border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800"><h2 className="text-[15px] font-semibold">{title}</h2><a className="cursor-pointer text-[12px] font-semibold text-blue-600 dark:text-blue-400" href={navigateTo}>View All</a></div><div className="overflow-x-auto"><table className="w-full border-collapse"><thead><tr>{columns.map(([, label]) => <th key={label} className="whitespace-nowrap border-b border-slate-100 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-800">{label}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={`${String(row.orderNumber)}-${index}`} className="border-b border-slate-100 last:border-0 dark:border-slate-800">{columns.map(([key]) => <td key={key} className={cn("px-3 py-3 text-[12.5px]", key === "product" || key === "pharmacy" ? "min-w-[150px] max-w-[230px] whitespace-normal break-words leading-5" : "whitespace-nowrap", key === "captured" && "font-semibold text-[#16a34a] dark:text-[#22c55e]", key === "holdReleased" && "font-semibold text-[#b45309] dark:text-[#fbbf24]", key !== "orderNumber" && key !== "captured" && key !== "holdReleased" && "text-slate-600 dark:text-slate-300")}>{key === "orderNumber" && row.id ? <a href={`/dashboard/orders/details/${String(row.id)}`} className="font-semibold text-blue-600 hover:underline dark:text-blue-400">{cellValue(row, key)}</a> : cellValue(row, key)}</td>)}</tr>) : <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-xs text-slate-400">{empty}</td></tr>}</tbody></table></div></section>;
}
