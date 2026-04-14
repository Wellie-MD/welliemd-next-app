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
    if (sortBy !== field) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />;
    return sortOrder === 'asc' ? (
      <ChevronUp className="ml-1 h-3 w-3" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3" />
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

  /* ---- Render helpers ---- */
  const summaryCards = useMemo(() => {
    if (!data) return [];
    const t = data.platform_totals;
    return [
      { title: 'Platform Revenue', value: formatCurrency(t.total_revenue), icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-50' },
      { title: 'Total Orders', value: formatNumber(t.total_orders), icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-50' },
      { title: 'Completed Sales', value: formatNumber(t.total_sales), icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
      { title: 'Active Tenants', value: `${data.clients.length}`, icon: Layers, color: 'text-indigo-500', bg: 'bg-indigo-50' },
      { title: 'Total Patients', value: formatNumber(t.total_patients), icon: Users, color: 'text-violet-500', bg: 'bg-violet-50' },
    ];
  }, [data]);

  /* ================================================================ */
  /*  JSX                                                              */
  /* ================================================================ */

  return (
    <div className="p-4 space-y-5 w-full min-w-0 overflow-x-hidden">
      {/* ---- Header Row ---- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Client Performance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cross-tenant analytics &middot;{' '}
            {dateRange.from && dateRange.to
              ? `${format(dateRange.from, 'MMM d, yyyy')} — ${format(dateRange.to, 'MMM d, yyyy')}`
              : 'Select range'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Quick presets */}
          <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
            {PRESET_RANGES.map(p => (
              <button
                key={p.label}
                onClick={() => setDateRange(p.getValue())}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                  activeRangeLabel === p.label
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
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
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
            {summaryCards.map(card => {
              const Icon = card.icon;
              return (
                <Card key={card.title} className="rounded-2xl bg-white">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.title}</p>
                      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', card.bg)}>
                        <Icon className={cn('h-4 w-4', card.color)} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ---- Charts ---- */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue Trend */}
            <Card className="rounded-2xl bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-800">Revenue Trend</CardTitle>
                <CardDescription className="text-xs">Platform B2B revenue · 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  {data.revenue_trend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.revenue_trend} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11, fill: '#94a3b8' }}
                          tickFormatter={v => {
                            if (!v) return '';
                            return format(new Date(v + '-01T00:00:00'), 'MMM');
                          }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11, fill: '#94a3b8' }}
                          tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                          width={45}
                        />
                        <RechartsTooltip
                          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                          formatter={(v: number) => [formatCurrency(v), 'Revenue']}
                          labelFormatter={l => (l ? format(new Date(l + '-01T00:00:00'), 'MMMM yyyy') : '')}
                        />
                        <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} fill="url(#revGrad)" />
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
            <Card className="rounded-2xl bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-800">Orders Trend</CardTitle>
                <CardDescription className="text-xs">Order volume across all tenants · 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  {data.orders_trend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.orders_trend} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11, fill: '#94a3b8' }}
                          tickFormatter={v => {
                            if (!v) return '';
                            return format(new Date(v + '-01T00:00:00'), 'MMM');
                          }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11, fill: '#94a3b8' }}
                          width={35}
                        />
                        <RechartsTooltip
                          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                          formatter={(v: number) => [formatNumber(v), 'Orders']}
                          labelFormatter={l => (l ? format(new Date(l + '-01T00:00:00'), 'MMMM yyyy') : '')}
                        />
                        <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#ordGrad)" />
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

          {/* ---- Leaderboard ---- */}
          <Card className="rounded-2xl bg-white">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-semibold text-gray-800">Client Leaderboard</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
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
                <div className="relative w-56">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search clients…"
                    className="pl-8 h-8 text-xs bg-gray-50/80"
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
                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                      {([
                        ['client_name', 'Client', 'text-left'],
                        ['total_orders', 'Orders', 'text-left'],
                        ['total_sales', 'Sales', 'text-left'],
                        ['active_patients', 'Active Patients', 'text-left'],
                        ['total_visits', 'Visits', 'text-left'],
                        ['total_revenue', 'Platform Revenue', 'text-right'],
                      ] as [SortField, string, string][]).map(([field, label, align]) => (
                        <TableHead key={field} className={cn('py-2.5', align === 'text-right' && 'text-right')}>
                          <button
                            onClick={() => toggleSort(field)}
                            className={cn(
                              'inline-flex items-center text-xs font-semibold uppercase tracking-wider hover:text-gray-900 transition-colors',
                              sortBy === field ? 'text-gray-900' : 'text-gray-500',
                            )}
                          >
                            {label}
                            <SortIcon field={field} />
                          </button>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                          {searchTerm ? 'No clients match your search.' : 'No client data for this period.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      clients.map((c, idx) => {
                        const pct = (c.kpis.total_orders / maxOrders) * 100;
                        return (
                          <TableRow key={c.client_id} className="group hover:bg-gray-50/60">
                            <TableCell className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-500 flex-shrink-0">
                                  {idx + 1}
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-gray-800">{c.client_name}</span>
                                  {!c.is_active && (
                                    <Badge variant="secondary" className="ml-1.5 text-[9px] px-1 py-0 h-3.5 align-middle">
                                      Inactive
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700 w-8 text-right tabular-nums">
                                  {formatNumber(c.kpis.total_orders)}
                                </span>
                                <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-400 rounded-full transition-all"
                                    style={{ width: `${Math.max(pct, 3)}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 text-sm tabular-nums text-gray-700">
                              {formatNumber(c.kpis.total_sales)}
                            </TableCell>
                            <TableCell className="py-3 text-sm tabular-nums text-gray-700">
                              {formatNumber(c.kpis.active_patients)}
                            </TableCell>
                            <TableCell className="py-3 text-sm tabular-nums text-gray-700">
                              {formatNumber(c.kpis.total_visits)}
                            </TableCell>
                            <TableCell className="py-3 text-right">
                              <span className="text-sm font-semibold text-amber-600 tabular-nums">
                                {formatCurrency(c.revenue.total)}
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
          <Card className="rounded-2xl bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-800">Revenue Breakdown</CardTitle>
              <CardDescription className="text-xs">
                B2B billing breakdown per client
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 py-2.5">Client</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 py-2.5">SaaS Fees</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 py-2.5">Patient Fees</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 py-2.5">Reimbursement</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 py-2.5">Total</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 py-2.5 text-right">Share</TableHead>
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
                          <TableRow key={`rev-${c.client_id}`} className="hover:bg-gray-50/60">
                            <TableCell className="py-3 text-sm font-medium text-gray-800">{c.client_name}</TableCell>
                            <TableCell className="py-3 text-sm tabular-nums text-gray-600">{formatCurrency(c.revenue.saas_fees)}</TableCell>
                            <TableCell className="py-3 text-sm tabular-nums text-gray-600">{formatCurrency(c.revenue.patient_fees)}</TableCell>
                            <TableCell className="py-3 text-sm tabular-nums text-gray-600">{formatCurrency(c.revenue.reimbursement)}</TableCell>
                            <TableCell className="py-3 text-sm font-semibold tabular-nums text-amber-600">{formatCurrency(c.revenue.total)}</TableCell>
                            <TableCell className="py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-xs tabular-nums text-gray-500 w-10 text-right">{share.toFixed(1)}%</span>
                                <div className="h-1.5 w-14 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-amber-400 rounded-full transition-all"
                                    style={{ width: `${Math.max(share, 2)}%` }}
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
        </>
      ) : null}
    </div>
  );
}
