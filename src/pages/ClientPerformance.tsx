import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  format,
  subDays,
  startOfYear,
  endOfYear,
  isSameDay,
  subMonths
} from 'date-fns';
import {
  CalendarIcon,
  Download,
  AlertCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Users,
  ShoppingCart,
  DollarSign,
  Activity,
  Layers,
  RefreshCw,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Filter,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import {
  getClientAnalytics,
  ClientAnalyticsResponse,
  ClientAnalyticsRow,
} from '@/api/adminAnalyticsApi';

/* ------------------------------------------------------------------ */
/*  Date Presets                                                       */
/* ------------------------------------------------------------------ */

interface DateRange {
  from: Date;
  to: Date;
}

const PRESET_RANGES = [
  { label: '7 D', getValue: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
  { label: '30 D', getValue: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  { label: '90 D', getValue: () => ({ from: subDays(new Date(), 89), to: new Date() }) },
  { label: 'YTD', getValue: () => ({ from: startOfYear(new Date()), to: new Date() }) },
  {
    label: 'Last Year',
    getValue: () => ({
      from: startOfYear(subMonths(new Date(), 12)),
      to: endOfYear(subMonths(new Date(), 12)),
    }),
  },
];

type SortField = 'client_name' | 'total_orders' | 'total_sales' | 'active_patients' | 'total_visits' | 'total_revenue';

/* ------------------------------------------------------------------ */
/*  Custom Tooltip                                                     */
/* ------------------------------------------------------------------ */

function ChartTooltip({ active, payload, label, valueKey, valueLabel, prefix = '' }: any) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? 0;
  const formattedLabel = label ? format(new Date(label + '-01T00:00:00'), 'MMMM yyyy') : '';
  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(12px)',
        borderRadius: 10,
        padding: '10px 14px',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        minWidth: 140,
      }}
    >
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4, fontWeight: 500 }}>
        {formattedLabel}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
        {prefix}{typeof val === 'number' && prefix === '$' ? val.toLocaleString('en-US', { minimumFractionDigits: 0 }) : formatNumber(val)}
      </div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
        {valueLabel}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ClientPerformance() {
  const [dateRange, setDateRange] = useState<DateRange>(PRESET_RANGES[1].getValue());
  const [data, setData] = useState<ClientAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('total_revenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [graphClientFilter, setGraphClientFilter] = useState<string>('all');
  const [graphPharmacyFilter, setGraphPharmacyFilter] = useState<string>('all');

  /* ---- API ---- */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getClientAnalytics({
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd'),
      });
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load client performance data');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---- Sorting ---- */
  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />;
    return sortOrder === 'asc' ? (
      <ChevronUp className="ml-1 h-3 w-3 text-blue-500" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3 text-blue-500" />
    );
  };

  /* ---- Derived data ---- */
  const activeRangeLabel = useMemo(() => {
    const match = PRESET_RANGES.find(p => {
      const r = p.getValue();
      return isSameDay(r.from, dateRange.from) && isSameDay(r.to, dateRange.to);
    });
    return match?.label || null;
  }, [dateRange]);

  const clients = useMemo(() => {
    if (!data) return [];

    let list = data.clients;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(c => c.client_name.toLowerCase().includes(term));
    }

    return [...list].sort((a, b) => {
      let va: number | string;
      let vb: number | string;

      if (sortBy === 'client_name') {
        va = a.client_name.toLowerCase();
        vb = b.client_name.toLowerCase();
      } else if (sortBy === 'total_revenue') {
        va = a.revenue.total;
        vb = b.revenue.total;
      } else {
        va = a.kpis[sortBy as keyof typeof a.kpis];
        vb = b.kpis[sortBy as keyof typeof b.kpis];
      }

      if (va < vb) return sortOrder === 'asc' ? -1 : 1;
      if (va > vb) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, searchTerm, sortBy, sortOrder]);

  const maxOrders = useMemo(
    () => (data?.clients?.length ? Math.max(...data.clients.map(c => c.kpis.total_orders), 1) : 1),
    [data],
  );

  const graphClientOptions = useMemo(
    () =>
      (data?.clients || [])
        .map(c => ({ id: c.client_id, name: c.client_name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [data],
  );

  const graphPharmacyOptions = useMemo(() => {
    const rows = data?.pharmacy_performance || [];
    const filteredByClient =
      graphClientFilter === 'all'
        ? rows
        : rows.filter(r => r.client_id === graphClientFilter);
    const unique = Array.from(new Set(filteredByClient.map(r => r.pharmacy_name).filter(Boolean)));
    return unique.sort((a, b) => a.localeCompare(b));
  }, [data, graphClientFilter]);

  const filteredOrdersTrend = useMemo(() => {
    if (!data) return [];
    const months = (data.orders_trend || []).map(p => p.month);
    const breakdown = data.orders_trend_breakdown || [];
    const shouldFilter = graphClientFilter !== 'all' || graphPharmacyFilter !== 'all';

    if (!shouldFilter || breakdown.length === 0) {
      if (graphClientFilter === 'all') return data.orders_trend;
      const selectedClient = data.clients.find(c => c.client_id === graphClientFilter);
      return selectedClient?.orders_by_month || [];
    }

    const filtered = breakdown.filter(row => {
      if (graphClientFilter !== 'all' && row.client_id !== graphClientFilter) return false;
      if (graphPharmacyFilter !== 'all' && row.pharmacy_name !== graphPharmacyFilter) return false;
      return true;
    });

    const monthMap = new Map<string, number>();
    months.forEach(m => monthMap.set(m, 0));
    filtered.forEach(row => {
      monthMap.set(row.month, (monthMap.get(row.month) || 0) + (row.count || 0));
    });

    return months.map(month => ({ month, count: monthMap.get(month) || 0 }));
  }, [data, graphClientFilter, graphPharmacyFilter]);

  const filteredRevenueTrend = useMemo(() => {
    if (!data) return [];
    const months = (data.revenue_trend || []).map(p => p.month);
    const breakdown = data.revenue_trend_breakdown || [];
    const shouldFilter = graphClientFilter !== 'all' || graphPharmacyFilter !== 'all';

    if (!shouldFilter || breakdown.length === 0) return data.revenue_trend;

    const filtered = breakdown.filter(row => {
      if (graphClientFilter !== 'all' && row.client_id !== graphClientFilter) return false;
      if (graphPharmacyFilter !== 'all') {
        if (!row.pharmacy_name || row.pharmacy_name !== graphPharmacyFilter) return false;
      }
      return true;
    });

    const monthMap = new Map<string, number>();
    months.forEach(m => monthMap.set(m, 0));
    filtered.forEach(row => {
      monthMap.set(row.month, (monthMap.get(row.month) || 0) + (row.value || 0));
    });

    return months.map(month => ({ month, value: monthMap.get(month) || 0 }));
  }, [data, graphClientFilter, graphPharmacyFilter]);

  const pharmacyLeaderboardRows = useMemo(() => {
    if (!data) return [];
    let rows = data.pharmacy_performance || [];
    if (graphClientFilter !== 'all') {
      rows = rows.filter(r => r.client_id === graphClientFilter);
    }
    if (graphPharmacyFilter !== 'all') {
      rows = rows.filter(r => r.pharmacy_name === graphPharmacyFilter);
    }
    return [...rows]
      .sort((a, b) => (b.captured || 0) - (a.captured || 0));
  }, [data, graphClientFilter, graphPharmacyFilter]);

  /* ---- CSV ---- */
  const exportToCsv = () => {
    if (!data) return;
    const headers = [
      'Client Name', 'Active', 'Total Orders', 'Completed Sales',
      'Active Patients', 'Total Visits',
      'SaaS Fees', 'Patient Fees', 'Reimbursements', 'Total Platform Revenue',
    ];
    const rows = clients.map(c => [
      c.client_name, c.is_active ? 'Yes' : 'No',
      c.kpis.total_orders, c.kpis.total_sales,
      c.kpis.active_patients, c.kpis.total_visits,
      c.revenue.saas_fees.toFixed(2), c.revenue.patient_fees.toFixed(2),
      c.revenue.reimbursement.toFixed(2), c.revenue.total.toFixed(2),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `client_performance_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  /* ---- Summary cards definition ---- */
  const summaryCards = useMemo(() => {
    if (!data) return [];
    const t = data.platform_totals;
    return [
      { title: 'Platform Revenue', value: formatCurrency(t.total_revenue), icon: DollarSign, accent: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
      { title: 'Platform Profit', value: formatCurrency(t.total_profit || 0), icon: TrendingUp, accent: '#10b981', bg: 'rgba(16,185,129,0.08)' },
      { title: 'Total Orders', value: formatNumber(t.total_orders), icon: ShoppingCart, accent: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
      { title: 'Completed Sales', value: formatNumber(t.total_sales), icon: Activity, accent: '#10b981', bg: 'rgba(16,185,129,0.08)' },
      { title: 'Active Tenants', value: `${data.clients.length}`, icon: Layers, accent: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
      { title: 'Total Patients', value: formatNumber(t.total_patients), icon: Users, accent: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
    ];
  }, [data]);

  /* ================================================================ */
  /*  JSX                                                              */
  /* ================================================================ */

  return (
    <div className="p-5 space-y-6 w-full min-w-0 overflow-x-hidden max-w-[1400px] mx-auto">
      {/* ---- Header Row ---- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-foreground">Client Performance</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Cross-tenant analytics &middot;{' '}
            <span className="font-medium text-foreground/70">
              {dateRange.from && dateRange.to
                ? `${format(dateRange.from, 'MMM d, yyyy')} — ${format(dateRange.to, 'MMM d, yyyy')}`
                : 'Select range'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick presets */}
          <div className="flex items-center rounded-lg border bg-muted/30 p-0.5 gap-0.5">
            {PRESET_RANGES.map(p => (
              <button
                key={p.label}
                onClick={() => setDateRange(p.getValue())}
                className={cn(
                  'px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all duration-150',
                  activeRangeLabel === p.label
                    ? 'bg-background text-foreground shadow-sm border border-border/50'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Calendar */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <CalendarIcon className="h-3.5 w-3.5" />
                Custom
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range: any) =>
                  range?.from && setDateRange({ from: range.from, to: range.to || range.from })
                }
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Actions */}
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={fetchData} disabled={loading}>
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={exportToCsv} disabled={!data || !clients.length}>
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* ---- States ---- */}
      {loading && !data ? (
        <div className="flex h-72 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading client metrics…</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex h-72 items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center space-y-3">
              <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button size="sm" onClick={fetchData}>
                Try again
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : data ? (
        <>
          {/* ---- Partial banner ---- */}
          {data.partial && (
            <Alert className="border-amber-200 bg-amber-50/80">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-900 text-sm font-medium">Partial Data</AlertTitle>
              <AlertDescription className="text-amber-800 text-xs">
                Some tenant systems are temporarily unavailable. Totals reflect{' '}
                <strong>{data.clients.length}</strong> of <strong>{data.platform_totals.total_clients_active}</strong> active
                clients.
              </AlertDescription>
            </Alert>
          )}

          {/* ---- Summary Cards ---- */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {summaryCards.map(card => {
              const Icon = card.icon;
              return (
                <Card key={card.title} className="rounded-xl border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider leading-none">{card.title}</p>
                      <div
                        className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: card.bg }}
                      >
                        <Icon className="h-4 w-4" style={{ color: card.accent }} />
                      </div>
                    </div>
                    <p className="text-[22px] font-bold tracking-tight text-foreground tabular-nums">{card.value}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ---- Graph Filters ---- */}
          <Card className="rounded-xl border-border/60 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chart Filters</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Client</label>
                  <select
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
                    value={graphClientFilter}
                    onChange={e => {
                      setGraphClientFilter(e.target.value);
                      setGraphPharmacyFilter('all');
                    }}
                  >
                    <option value="all">All Clients</option>
                    {graphClientOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Pharmacy</label>
                  <select
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
                    value={graphPharmacyFilter}
                    onChange={e => setGraphPharmacyFilter(e.target.value)}
                  >
                    <option value="all">All Pharmacies</option>
                    {graphPharmacyOptions.map(name => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ---- Charts ---- */}
          <div className="grid gap-5 md:grid-cols-2">
            {/* Revenue Trend */}
            <Card className="rounded-xl border-border/60 shadow-sm">
              <CardHeader className="pb-1 pt-5 px-5">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)' }}>
                    <DollarSign className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <div>
                    <CardTitle className="text-[13px] font-semibold text-foreground">Revenue Trend</CardTitle>
                    <CardDescription className="text-[11px] mt-0">Platform B2B revenue · selected range</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="h-[240px]">
                  {filteredRevenueTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={filteredRevenueTrend} margin={{ top: 12, right: 8, left: -8, bottom: 0 }}>
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                          tickFormatter={v => {
                            if (!v) return '';
                            return format(new Date(v + '-01T00:00:00'), 'MMM');
                          }}
                          tickMargin={8}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                          tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                          width={48}
                          tickMargin={4}
                        />
                        <RechartsTooltip
                          content={<ChartTooltip prefix="$" valueLabel="Revenue" />}
                          cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#f59e0b"
                          strokeWidth={2.5}
                          fill="url(#revGrad)"
                          dot={false}
                          activeDot={{ r: 5, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                      No revenue data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Orders Trend */}
            <Card className="rounded-xl border-border/60 shadow-sm">
              <CardHeader className="pb-1 pt-5 px-5">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
                    <ShoppingCart className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-[13px] font-semibold text-foreground">Orders Trend</CardTitle>
                    <CardDescription className="text-[11px] mt-0">Order volume across all tenants · selected range</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="h-[240px]">
                  {filteredOrdersTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={filteredOrdersTrend} margin={{ top: 12, right: 8, left: -8, bottom: 0 }}>
                        <defs>
                          <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                          tickFormatter={v => {
                            if (!v) return '';
                            return format(new Date(v + '-01T00:00:00'), 'MMM');
                          }}
                          tickMargin={8}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                          width={38}
                          tickMargin={4}
                        />
                        <RechartsTooltip
                          content={<ChartTooltip valueLabel="Orders" />}
                          cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="#3b82f6"
                          strokeWidth={2.5}
                          fill="url(#ordGrad)"
                          dot={false}
                          activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                      No order data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ---- Client Leaderboard ---- */}
          <Card className="rounded-xl border-border/60 shadow-sm">
            <CardHeader className="pb-3 pt-5 px-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Activity className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-[13px] font-semibold text-foreground">Client Leaderboard</CardTitle>
                    <CardDescription className="text-[11px] mt-0.5">
                      Ranked by{' '}
                      {sortBy === 'client_name'
                        ? 'Name'
                        : sortBy === 'total_revenue'
                          ? 'Platform Revenue'
                          : sortBy
                            .split('_')
                            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(' ')}{' '}
                      · {clients.length} client{clients.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                </div>
                <div className="relative w-56">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search clients…"
                    className="pl-8 h-8 text-xs rounded-lg"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/60">
                      {([
                        ['client_name', 'Client', 'text-left'],
                        ['total_orders', 'Orders', 'text-left'],
                        ['total_sales', 'Sales', 'text-left'],
                        ['active_patients', 'Active Patients', 'text-left'],
                        ['total_visits', 'Visits', 'text-left'],
                        ['total_revenue', 'Platform Revenue', 'text-right'],
                      ] as [SortField, string, string][]).map(([field, label, align]) => (
                        <TableHead key={field} className={cn('py-3 px-4', align === 'text-right' && 'text-right')}>
                          <button
                            onClick={() => toggleSort(field)}
                            className={cn(
                              'inline-flex items-center text-[10px] font-bold uppercase tracking-[0.06em] transition-colors',
                              sortBy === field ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                            )}
                          >
                            {label}
                            <SortIcon field={field} />
                          </button>
                        </TableHead>
                      ))}
                      <TableHead className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground py-3 px-4 text-right">
                        Profit
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                          {searchTerm ? 'No clients match your search.' : 'No client data for this period.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      clients.map((c, idx) => {
                        const pct = (c.kpis.total_orders / maxOrders) * 100;
                        return (
                          <TableRow key={c.client_id} className="group hover:bg-muted/30 transition-colors border-b border-border/40 last:border-0">
                            <TableCell className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-full bg-muted/80 flex items-center justify-center text-[10px] font-bold text-muted-foreground flex-shrink-0 tabular-nums">
                                  {idx + 1}
                                </div>
                                <div>
                                  <span className="text-[13px] font-semibold text-foreground">{c.client_name}</span>
                                  {!c.is_active && (
                                    <Badge variant="secondary" className="ml-1.5 text-[9px] px-1.5 py-0 h-4 align-middle font-medium">
                                      Inactive
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <span className="text-[13px] font-semibold text-foreground w-8 text-right tabular-nums">
                                  {formatNumber(c.kpis.total_orders)}
                                </span>
                                <div className="h-[5px] w-16 bg-muted/60 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${Math.max(pct, 3)}%`,
                                      background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                                    }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3.5 px-4 text-[13px] tabular-nums text-muted-foreground font-medium">
                              {formatNumber(c.kpis.total_sales)}
                            </TableCell>
                            <TableCell className="py-3.5 px-4 text-[13px] tabular-nums text-muted-foreground font-medium">
                              {formatNumber(c.kpis.active_patients)}
                            </TableCell>
                            <TableCell className="py-3.5 px-4 text-[13px] tabular-nums text-muted-foreground font-medium">
                              {formatNumber(c.kpis.total_visits)}
                            </TableCell>
                            <TableCell className="py-3.5 px-4 text-right">
                              <span className="text-[13px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                                {formatCurrency(c.revenue.total)}
                              </span>
                            </TableCell>
                            <TableCell className="py-3.5 px-4 text-right">
                              <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                {formatCurrency(c.revenue.profit || 0)}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* ---- Revenue Breakdown ---- */}
          <Card className="rounded-xl border-border/60 shadow-sm">
            <CardHeader className="pb-3 pt-5 px-5">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.1)' }}>
                  <DollarSign className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-[13px] font-semibold text-foreground">Revenue Breakdown</CardTitle>
                  <CardDescription className="text-[11px] mt-0.5">
                    B2B billing breakdown per client
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/60">
                      <TableHead className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground py-3 px-4">Client</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground py-3 px-4">SaaS Fees</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground py-3 px-4">Patient Fees</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground py-3 px-4">Reimbursement</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground py-3 px-4">Total</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground py-3 px-4">Profit</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground py-3 px-4 text-right">Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...clients]
                      .sort((a, b) => b.revenue.total - a.revenue.total)
                      .map(c => {
                        const share =
                          data.platform_totals.total_revenue > 0
                            ? (c.revenue.total / data.platform_totals.total_revenue) * 100
                            : 0;
                        return (
                          <TableRow key={`rev-${c.client_id}`} className="hover:bg-muted/30 transition-colors border-b border-border/40 last:border-0">
                            <TableCell className="py-3.5 px-4 text-[13px] font-semibold text-foreground">{c.client_name}</TableCell>
                            <TableCell className="py-3.5 px-4 text-[13px] tabular-nums text-muted-foreground font-medium">{formatCurrency(c.revenue.saas_fees)}</TableCell>
                            <TableCell className="py-3.5 px-4 text-[13px] tabular-nums text-muted-foreground font-medium">{formatCurrency(c.revenue.patient_fees)}</TableCell>
                            <TableCell className="py-3.5 px-4 text-[13px] tabular-nums text-muted-foreground font-medium">{formatCurrency(c.revenue.reimbursement)}</TableCell>
                            <TableCell className="py-3.5 px-4 text-[13px] font-bold tabular-nums text-amber-600 dark:text-amber-400">{formatCurrency(c.revenue.total)}</TableCell>
                            <TableCell className="py-3.5 px-4 text-[13px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(c.revenue.profit || 0)}</TableCell>
                            <TableCell className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2.5">
                                <span className="text-[11px] tabular-nums text-muted-foreground w-10 text-right font-semibold">{share.toFixed(1)}%</span>
                                <div className="h-[5px] w-16 bg-muted/60 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${Math.max(share, 2)}%`,
                                      background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                                    }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* ---- Pharmacy Leaderboard ---- */}
          <Card className="rounded-xl border-border/60 shadow-sm">
            <CardHeader className="pb-3 pt-5 px-5">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Layers className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-[13px] font-semibold text-foreground">Pharmacy Leaderboard</CardTitle>
                  <CardDescription className="text-[11px] mt-0.5">
                    Fulfilled orders (captured) by pharmacy name
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/60">
                      <TableHead className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground py-3 px-4">Pharmacy</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground py-3 px-4">Client</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground py-3 px-4 text-right">Captured</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pharmacyLeaderboardRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-sm text-muted-foreground">
                          No pharmacy data in selected scope.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pharmacyLeaderboardRows.map((row, index) => (
                        <TableRow key={`${row.client_id}-${row.pharmacy_name}-${index}`} className="hover:bg-muted/30 transition-colors border-b border-border/40 last:border-0">
                          <TableCell className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="h-6 w-6 rounded-md bg-blue-500/10 flex items-center justify-center text-[9px] font-bold text-blue-500 flex-shrink-0 tabular-nums">
                                {index + 1}
                              </div>
                              <span className="text-[13px] font-semibold text-foreground">{row.pharmacy_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3.5 px-4 text-[13px] text-muted-foreground font-medium">{row.client_name}</TableCell>
                          <TableCell className="py-3.5 px-4 text-right">
                            <span className="text-[13px] font-bold tabular-nums text-blue-600 dark:text-blue-400">{formatNumber(row.captured || 0)}</span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
