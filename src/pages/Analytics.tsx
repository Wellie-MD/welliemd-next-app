import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { VisitorChart } from "@/components/analytics/VisitorChart"
import { getAnalytics, getTreatments, getProductGroups } from "@/api/analyticsApi"
import { Loader2, CalendarIcon, X, Filter, Activity, Users, ShoppingBag, DollarSign, CircleHelp } from "lucide-react"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import { cn } from "@/lib/utils"

function FilterChip({ label, value }: { label: string; value: string }) {
  return (
    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/15">
      {label}: {value}
    </Badge>
  )
}

function MetricCard({
  title,
  value,
  icon: Icon,
  tone,
  tooltip,
}: {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  tone: string
  tooltip?: string
}) {
  return (
    <Card className="border-border/70 shadow-sm transition-colors hover:border-primary/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
            {tooltip && (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-label={`${title} help`}>
                      <CircleHelp className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[220px] text-xs">
                    {tooltip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </CardTitle>
          <div className={cn("rounded-md p-1.5", tone)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</div>
      </CardContent>
    </Card>
  )
}

export default function Analytics() {
  const [period, setPeriod] = useState<"day" | "week" | "month" | "year" | "custom">("month")
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })

  const [selectedTreatment, setSelectedTreatment] = useState<string>("")
  const [selectedProductGroup, setSelectedProductGroup] = useState<string>("")
  const [showFilters, setShowFilters] = useState(true)

  const dateRange = useMemo(() => {
    const now = new Date()
    switch (period) {
      case "day":
        return { from: startOfDay(now), to: endOfDay(now) }
      case "week":
        return { from: subDays(now, 7), to: now }
      case "month":
        return { from: subDays(now, 30), to: now }
      case "year":
        return { from: subDays(now, 365), to: now }
      case "custom":
        return customDateRange.from && customDateRange.to
          ? { from: customDateRange.from, to: customDateRange.to }
          : { from: subDays(now, 30), to: now }
      default:
        return { from: subDays(now, 30), to: now }
    }
  }, [period, customDateRange])

  const queryParams = useMemo(
    () => ({
      start_date: startOfDay(dateRange.from).toISOString(),
      end_date: endOfDay(dateRange.to).toISOString(),
      period,
      ...(selectedTreatment && { treatment_id: selectedTreatment }),
      ...(selectedProductGroup && { product_group_id: selectedProductGroup }),
    }),
    [dateRange, period, selectedTreatment, selectedProductGroup],
  )

  const { data: analytics, isLoading, error, refetch } = useQuery({
    queryKey: ["analytics", queryParams],
    queryFn: () => getAnalytics(queryParams),
    refetchInterval: 60000,
  })

  const { data: treatments = [] } = useQuery({
    queryKey: ["treatments"],
    queryFn: getTreatments,
    staleTime: 300000,
  })

  const { data: productGroups = [] } = useQuery({
    queryKey: ["productGroups"],
    queryFn: getProductGroups,
    staleTime: 300000,
  })

  const clearFilters = () => {
    setPeriod("month")
    setCustomDateRange({ from: undefined, to: undefined })
    setSelectedTreatment("")
    setSelectedProductGroup("")
  }

  const hasActiveFilters = Boolean(selectedTreatment || selectedProductGroup || period !== "month")
  const hasDimensionFilter = Boolean(selectedTreatment || selectedProductGroup)
  const treatmentFilterLabel = treatments.find((t) => t.id === selectedTreatment)?.name || selectedTreatment
  const productGroupFilterLabel = productGroups.find((g) => g.id === selectedProductGroup)?.name || selectedProductGroup

  const formatOrderLabel = (count: number) => `${count} order${count === 1 ? "" : "s"}`

  const completedCheckouts = analytics?.completedCheckouts ?? analytics?.checkoutMetrics?.completedCheckouts ?? analytics?.totalCheckouts ?? 0
  const capturedPaymentsAmount = analytics?.capturedPaymentsAmount ?? analytics?.checkoutMetrics?.capturedPaymentsAmount ?? analytics?.totalSales ?? 0
  const paymentPending = analytics?.paymentPending ?? analytics?.checkoutMetrics?.paymentPending ?? analytics?.customerBehavior?.checking ?? 0
  const averageVisitDuration = analytics?.visitors?.averageDuration || analytics?.visitors?.visitDuration || "0m 0s"
  const isUniqueVisitorSignalWeak = (analytics?.visitors?.total ?? 0) > 0 && analytics?.visitors?.total === analytics?.visitors?.unique

  const setQuickRange = (next: "day" | "week" | "month" | "year") => {
    setPeriod(next)
    setCustomDateRange({ from: undefined, to: undefined })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <p className="mb-2 font-semibold">Failed to load analytics data</p>
              <p className="mb-4 text-sm text-muted-foreground">Please check your connection and try again</p>
              <Button onClick={() => refetch()} variant="outline">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analytics || !analytics.visitors) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">No data available for the selected period.</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <Card className="border-border/70 bg-gradient-to-r from-primary/5 via-background to-blue-50/40 dark:from-primary/10 dark:to-slate-900/40 shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Analytics Live View</h1>
              <p className="text-sm text-muted-foreground">Live visitor and conversion intelligence across treatment and product dimensions.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                {showFilters ? "Hide" : "Show"} Filters
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive">
                  <X className="mr-1 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant={period === "day" ? "default" : "outline"} size="sm" onClick={() => setQuickRange("day")}>Today</Button>
            <Button variant={period === "week" ? "default" : "outline"} size="sm" onClick={() => setQuickRange("week")}>Last 7 Days</Button>
            <Button variant={period === "month" ? "default" : "outline"} size="sm" onClick={() => setQuickRange("month")}>Last 30 Days</Button>
            <Button variant={period === "year" ? "default" : "outline"} size="sm" onClick={() => setQuickRange("year")}>Last Year</Button>
            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/15">
              <Filter className="mr-1 h-3 w-3" />
              {hasActiveFilters ? "Filters Applied" : "Default View"}
            </Badge>
            <Badge variant="outline">Captured Payments: successful captures only</Badge>
            <Badge variant="outline">
              {format(startOfDay(dateRange.from), "MMM dd, yyyy")} - {format(endOfDay(dateRange.to), "MMM dd, yyyy")}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Treatment/product filters apply to checkout and payment metrics. Captured payments exclude pending, authorized, failed, and canceled states.
          </p>
        </CardContent>
      </Card>

      {showFilters && (
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-primary">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Time Period</label>
                <Select
                  value={period}
                  onValueChange={(value: "day" | "week" | "month" | "year" | "custom") => {
                    setPeriod(value)
                    if (value !== "custom") setCustomDateRange({ from: undefined, to: undefined })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {period === "custom" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn("w-full justify-start text-left font-normal", !customDateRange.from && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {customDateRange.from ? format(customDateRange.from, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={customDateRange.from}
                          onSelect={(date) => setCustomDateRange((prev) => ({ ...prev, from: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn("w-full justify-start text-left font-normal", !customDateRange.to && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {customDateRange.to ? format(customDateRange.to, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={customDateRange.to}
                          onSelect={(date) => setCustomDateRange((prev) => ({ ...prev, to: date }))}
                          initialFocus
                          disabled={(date) => (customDateRange.from ? date < customDateRange.from : false)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Treatment</label>
                <Select value={selectedTreatment || "all"} onValueChange={(val) => setSelectedTreatment(val === "all" ? "" : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Treatments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Treatments</SelectItem>
                    {treatments.map((treatment) => (
                      <SelectItem key={treatment.id} value={treatment.id}>
                        {treatment.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Product Group</label>
                <Select value={selectedProductGroup || "all"} onValueChange={(val) => setSelectedProductGroup(val === "all" ? "" : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {productGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                {selectedTreatment && <FilterChip label="Treatment" value={treatments.find((t) => t.id === selectedTreatment)?.name || selectedTreatment} />}
                {selectedProductGroup && <FilterChip label="Product" value={productGroups.find((g) => g.id === selectedProductGroup)?.name || selectedProductGroup} />}
                <FilterChip label="Range" value={`${format(startOfDay(dateRange.from), "MMM dd, yyyy")} - ${format(endOfDay(dateRange.to), "MMM dd, yyyy")}`} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Total Visitors"
          value={analytics.visitors.total.toLocaleString()}
          icon={Users}
          tone="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
          tooltip="Total tracked sessions in the selected range."
        />
        <MetricCard
          title="Unique Visitors"
          value={analytics.visitors.unique.toLocaleString()}
          icon={Activity}
          tone="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300"
          tooltip="Distinct session_key identities in the selected range."
        />
        <MetricCard
          title="Completed Checkouts"
          value={completedCheckouts}
          icon={ShoppingBag}
          tone="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300"
          tooltip="Orders with successful payment capture only (captured/approved/succeeded)."
        />
        <MetricCard
          title="Payment Pending"
          value={paymentPending}
          icon={ShoppingBag}
          tone="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
          tooltip="Checkout intents not captured yet (pending or authorized payments, or checkout-in-progress without capture)."
        />
        <MetricCard
          title="Captured Payments"
          value={`$${capturedPaymentsAmount.toLocaleString()}`}
          icon={DollarSign}
          tone="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300"
          tooltip="Sum of amounts for successful payment captures only."
        />
      </div>

      {isUniqueVisitorSignalWeak && (
        <p className="-mt-1 text-xs text-muted-foreground">
          Unique visitors are currently based on distinct session keys, so this can match total visitors when each session is unique.
        </p>
      )}

      {(analytics.salesByTreatment?.length > 0 || analytics.salesByProductGroup?.length > 0) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {analytics.salesByTreatment && analytics.salesByTreatment.length > 0 && (
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle>{selectedTreatment ? "Selected Treatment Captured Payments" : "Captured Payments by Treatment"}</CardTitle>
                {selectedTreatment ? (
                  <p className="text-sm text-muted-foreground">
                    Filtered to <span className="font-medium text-foreground">{treatmentFilterLabel}</span>. Share is 100% by definition within the current filtered result set.
                  </p>
                ) : hasDimensionFilter ? (
                  <p className="text-sm text-muted-foreground">Percentages are calculated within the current filtered result set.</p>
                ) : null}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.salesByTreatment.map((item, index) => (
                    <div key={index} className="rounded-md border border-border/60 p-3 transition-colors hover:bg-primary/5">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                      </div>
                      <div className="mb-2 h-2 w-full rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-gradient-to-r from-primary to-blue-500 transition-all" style={{ width: `${item.percentage}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold">${item.total.toLocaleString()}</span>
                        <span className="text-muted-foreground">{formatOrderLabel(item.count)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {analytics.salesByProductGroup && analytics.salesByProductGroup.length > 0 && (
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle>{selectedProductGroup ? "Selected Product Group Captured Payments" : "Captured Payments by Product Group"}</CardTitle>
                {selectedProductGroup ? (
                  <p className="text-sm text-muted-foreground">
                    Filtered to <span className="font-medium text-foreground">{productGroupFilterLabel}</span>. Share is 100% by definition within the current filtered result set.
                  </p>
                ) : hasDimensionFilter ? (
                  <p className="text-sm text-muted-foreground">Percentages are calculated within the current filtered result set.</p>
                ) : null}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.salesByProductGroup.map((item, index) => (
                    <div key={index} className="rounded-md border border-border/60 p-3 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                      </div>
                      <div className="mb-2 h-2 w-full rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 transition-all" style={{ width: `${item.percentage}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold">${item.total.toLocaleString()}</span>
                        <span className="text-muted-foreground">{formatOrderLabel(item.count)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <VisitorChart data={analytics.chartData} />
        </div>
        <div className="space-y-4">
          <StatCard title="Total Visitors" value={analytics.visitors.total.toLocaleString()} className="border border-blue-100 bg-gradient-to-r from-blue-50 to-white shadow-sm dark:border-blue-900/40 dark:from-blue-950/40 dark:to-slate-900/40" />
          <StatCard title="Unique Visitors" value={analytics.visitors.unique.toLocaleString()} className="border border-indigo-100 bg-gradient-to-r from-indigo-50 to-white shadow-sm dark:border-indigo-900/40 dark:from-indigo-950/40 dark:to-slate-900/40" />
          <StatCard title="Total Pageviews" value={analytics.visitors.totalPageviews.toLocaleString()} className="border border-amber-100 bg-gradient-to-r from-amber-50 to-white shadow-sm dark:border-amber-900/40 dark:from-amber-950/40 dark:to-slate-900/40" />
          <StatCard title="Bounce Rate" value={`${analytics.visitors.bounceRate}%`} className="border border-rose-100 bg-gradient-to-r from-rose-50 to-white shadow-sm dark:border-rose-900/40 dark:from-rose-950/40 dark:to-slate-900/40" />
          <StatCard title="Average Visit Duration" value={averageVisitDuration} className="border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/40 dark:to-slate-900/40" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Customer Behavior</CardTitle>
            <span className="text-sm text-muted-foreground">{hasActiveFilters ? "Current filtered date range" : "Current selected date range"}</span>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-md bg-blue-50 dark:bg-blue-900/30 p-3">
                <p className="text-2xl font-bold">{analytics.visitors.total}</p>
                <p className="text-sm text-muted-foreground">Visitors</p>
              </div>
              <div className="rounded-md bg-amber-50 dark:bg-amber-900/30 p-3">
                <p className="text-2xl font-bold">{analytics.customerBehavior?.checking}</p>
                <p className="text-sm text-muted-foreground">Checking Out</p>
              </div>
              <div className="rounded-md bg-emerald-50 dark:bg-emerald-900/30 p-3">
                <p className="text-2xl font-bold">{analytics.customerBehavior?.purchased}</p>
                <p className="text-sm text-muted-foreground">Purchased</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="border-border/70 bg-gradient-to-r from-primary/5 to-background dark:from-primary/10 dark:to-slate-900/40 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Completed Checkouts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{completedCheckouts}</p>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-gradient-to-r from-emerald-50 to-background dark:from-emerald-950/40 dark:to-slate-900/40 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Captured Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600 dark:text-emerald-300">${capturedPaymentsAmount.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
