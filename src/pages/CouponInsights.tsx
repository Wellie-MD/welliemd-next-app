import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Calendar as CalendarIcon, RotateCcw, Info, Search, FileText } from "lucide-react";
import { DateRange } from "react-day-picker";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { getCouponInsights, getCouponUsage } from "@/api/couponsApi";

const usageColumns = [
  { key: "code", label: "Code" },
  { key: "name", label: "Name" },
  { key: "value", label: "Value", render: (val: any, row: any) => row.coupon_type === "percent" ? `${parseFloat(val)}%` : `$${val}` },
  { key: "max_threshold", label: "Max. threshold", render: (val: any) => val ? `$${val}` : "-" },
  { key: "frequency_based", label: "Frequency based", render: (val: any) => val ? "Yes" : "No" },
  { key: "discounted_amount", label: "Discounted Amount", render: (val: any) => `$${val}` },
  { key: "used_by_patient", label: "Used by patient" },
  { key: "used_on", label: "Used on", render: (val: any) => format(new Date(val), "MMM dd, yyyy HH:mm") },
];

export default function CouponInsights() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [codeFilter, setCodeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const queryParams = useMemo(() => ({
    start_date: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    end_date: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
  }), [dateRange]);

  // Fetch Summary & Chart Data
  const { data: insights, isLoading: isInsightsLoading } = useQuery({
    queryKey: ["couponInsights", queryParams],
    queryFn: () => getCouponInsights(queryParams),
  });

  // Fetch Usage List
  const { data: usage, isLoading: isUsageLoading } = useQuery({
    queryKey: ["couponUsage", queryParams, searchTerm, codeFilter, currentPage, pageSize],
    queryFn: () => getCouponUsage({
      ...queryParams,
      search: searchTerm,
      code: codeFilter === "all" ? undefined : codeFilter,
      page: currentPage,
    }),
  });

  const resetFilters = () => {
    setDateRange({ from: subDays(new Date(), 30), to: new Date() });
    setSearchTerm("");
    setCodeFilter("all");
    setCurrentPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Coupons · Insights</h1>
        </div>

        {/* Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[280px] justify-start text-left font-normal bg-white"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "MMM dd, yyyy")} - {format(dateRange.to, "MMM dd, yyyy")}
                  </>
                ) : (
                  format(dateRange.from, "MMM dd, yyyy")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coupons Impact Card */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Coupons impact
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold">
                  {insights?.total_uses ?? 0} uses - ${insights?.total_discount_amount ?? 0}
                </div>
              </div>
              <div className="h-40 w-full">
                {insights?.impact_chart && insights.impact_chart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={insights.impact_chart}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        hide
                      />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        labelFormatter={(label) => format(new Date(label), "MMM dd, yyyy")}
                      />
                      <Line
                        type="monotone"
                        dataKey="uses"
                        name="Uses"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                    No impact data for this range
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Discount Card */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Total discount
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[200px] relative">
            <div className="relative flex items-center justify-center">
              {/* Circular visualization element */}
              <div className="w-32 h-32 rounded-full border-8 border-blue-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-extrabold text-blue-600">${insights?.total_discount_amount ?? 0}</div>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total</div>
                </div>
              </div>
              {/* Decorative progress ring */}
              <svg className="absolute w-36 h-36 -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="64"
                  fill="transparent"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  strokeDasharray="402"
                  strokeDashoffset={402 * (1 - 0.75)} // Just decorative for now
                  strokeLinecap="round"
                  className="opacity-20"
                />
              </svg>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center px-4">
              Showing total savings generated across all discounted orders in the selected period.
            </p>
          </CardContent>
        </Card>

        {/* Top Coupon Card */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top coupons</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
            {insights?.top_coupons && insights.top_coupons.length > 0 ? (
              <div className="space-y-4 pt-2">
                {insights.top_coupons.map((coupon, idx) => (
                  <div key={coupon.code} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="text-sm font-semibold group-hover:text-blue-600 transition-colors uppercase">{coupon.code}</div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[120px]">{coupon.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">{coupon.uses} uses</div>
                      <div className="text-[11px] text-green-600 font-medium">-${coupon.savings}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <FileText className="h-8 w-8 mb-2 opacity-20" />
                <span className="text-sm text-center">No data available</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Table Section */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          Usage
          {isUsageLoading && <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />}
        </h2>

        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by code, order ref, or name..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 min-w-[200px]">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Filter by code</span>
                <Select value={codeFilter} onValueChange={setCodeFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="All Codes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Codes</SelectItem>
                    {insights?.top_coupons.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.code.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-blue-600 font-semibold gap-1">
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <DataTable
          data={usage?.results ?? []}
          columns={usageColumns}
          hideToolbar={true}
          loading={isUsageLoading}
          emptyMessage="No coupon usage data found for this selection."
          pagination={{
            currentPage: currentPage,
            totalPages: Math.ceil((usage?.count ?? 0) / pageSize),
            pageSize: pageSize,
            totalCount: usage?.count ?? 0,
            onPageChange: setCurrentPage,
            onPageSizeChange: setPageSize
          }}
        />
      </div>
    </div>
  );
}