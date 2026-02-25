
import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { VisitorChart } from "@/components/analytics/VisitorChart"
import { getAnalytics, getTreatments, getProductGroups } from "@/api/analyticsApi"
import { Loader2, CalendarIcon, X } from "lucide-react"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import { cn } from "@/lib/utils"

export default function Analytics() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>('month')
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })

  // Additional filter states
  const [selectedTreatment, setSelectedTreatment] = useState<string>('')
  const [selectedProductGroup, setSelectedProductGroup] = useState<string>('')

  // Show/hide filters
  const [showFilters, setShowFilters] = useState(true)

  const dateRange = useMemo(() => {
    const now = new Date()
    switch (period) {
      case 'day':
        return { from: startOfDay(now), to: endOfDay(now) }
      case 'week':
        return { from: subDays(now, 7), to: now }
      case 'month':
        return { from: subDays(now, 30), to: now }
      case 'year':
        return { from: subDays(now, 365), to: now }
      case 'custom':
        return (customDateRange.from && customDateRange.to)
          ? { from: customDateRange.from, to: customDateRange.to }
          : { from: subDays(now, 30), to: now } // Fallback
      default:
        return { from: subDays(now, 30), to: now }
    }
  }, [period, customDateRange])

  const queryParams = useMemo(() => ({
    start_date: format(dateRange.from, "yyyy-MM-dd"),
    end_date: format(dateRange.to, "yyyy-MM-dd"),
    period,
    ...(selectedTreatment && { treatment_id: selectedTreatment }),
    ...(selectedProductGroup && { product_group_id: selectedProductGroup }),
  }), [dateRange, period, selectedTreatment, selectedProductGroup])


  const { data: analytics, isLoading, error, refetch } = useQuery({
    queryKey: ["analytics", queryParams],
    queryFn: () => getAnalytics(queryParams),
    refetchInterval: 60000, // Refetch every minute
  })

  // Fetch treatments for filter dropdown
  const { data: treatments = [] } = useQuery({
    queryKey: ["treatments"],
    queryFn: getTreatments,
    staleTime: 300000, // Cache for 5 minutes
  })

  // Fetch product groups for filter dropdown
  const { data: productGroups = [] } = useQuery({
    queryKey: ["productGroups"],
    queryFn: getProductGroups,
    staleTime: 300000,
  })

  // Clear all filters
  const clearFilters = () => {
    setPeriod('month')
    setCustomDateRange({ from: undefined, to: undefined })
    setSelectedTreatment('')
    setSelectedProductGroup('')
  }

  // Check if any filters are active
  const hasActiveFilters = selectedTreatment || selectedProductGroup || period === 'custom'
  const hasDimensionFilter = Boolean(selectedTreatment || selectedProductGroup)
  const treatmentFilterLabel = treatments.find(t => t.id === selectedTreatment)?.name || selectedTreatment
  const productGroupFilterLabel = productGroups.find(g => g.id === selectedProductGroup)?.name || selectedProductGroup

  const formatOrderLabel = (count: number) => `${count} order${count === 1 ? "" : "s"}`


  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
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
              <p className="font-semibold mb-2">Failed to load analytics data</p>
              <p className="text-sm text-muted-foreground mb-4">
                Please check your connection and try again
              </p>
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
          <CardContent className="pt-6 text-center text-muted-foreground">
            No data available for the selected period.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span>Analytics</span>
              <span>›</span>
              <span>Live View</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-destructive"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Period Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time Period</label>
                  <Select
                    value={period}
                    onValueChange={(value: any) => {
                      setPeriod(value)
                      if (value !== 'custom') {
                        setCustomDateRange({ from: undefined, to: undefined })
                      }
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

                {/* Custom Date Range Picker */}
                {period === 'custom' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Start Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !customDateRange.from && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customDateRange.from ? (
                              format(customDateRange.from, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={customDateRange.from}
                            onSelect={(date) => setCustomDateRange(prev => ({ ...prev, from: date }))}
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
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !customDateRange.to && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customDateRange.to ? (
                              format(customDateRange.to, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={customDateRange.to}
                            onSelect={(date) => setCustomDateRange(prev => ({ ...prev, to: date }))}
                            initialFocus
                            disabled={(date) =>
                              customDateRange.from ? date < customDateRange.from : false
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </>
                )}

                {/* Treatment Filter */}
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

                {/* Product Group Filter */}
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

              {/* Active Filters Summary */}
              {hasActiveFilters && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Active Filters:</span>
                    {selectedTreatment && (
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded">
                        Treatment: {treatments.find(t => t.id === selectedTreatment)?.name}
                      </span>
                    )}
                    {selectedProductGroup && (
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded">
                        Product: {productGroups.find(g => g.id === selectedProductGroup)?.name}
                      </span>
                    )}
                    {period === 'custom' && customDateRange.from && customDateRange.to && (
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded">
                        {format(customDateRange.from, "MMM dd, yyyy")} - {format(customDateRange.to, "MMM dd, yyyy")}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sales Breakdown by Filters */}
      {(analytics.salesByTreatment?.length > 0 || analytics.salesByProductGroup?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales by Treatment */}
          {analytics.salesByTreatment && analytics.salesByTreatment.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedTreatment ? "Selected Treatment Sales" : "Sales by Treatment"}
                </CardTitle>
                {selectedTreatment ? (
                  <p className="text-sm text-muted-foreground">
                    Filtered to <span className="font-medium text-foreground">{treatmentFilterLabel}</span>.
                    Share is 100% by definition within the current filtered result set.
                  </p>
                ) : hasDimensionFilter ? (
                  <p className="text-sm text-muted-foreground">
                    Percentages are calculated within the current filtered result set.
                  </p>
                ) : null}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.salesByTreatment.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{item.name}</span>
                          <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-sm font-bold">${item.total.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{formatOrderLabel(item.count)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sales by Product Group */}
          {analytics.salesByProductGroup && analytics.salesByProductGroup.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedProductGroup ? "Selected Product Group Sales" : "Sales by Product Group"}
                </CardTitle>
                {selectedProductGroup ? (
                  <p className="text-sm text-muted-foreground">
                    Filtered to <span className="font-medium text-foreground">{productGroupFilterLabel}</span>.
                    Share is 100% by definition within the current filtered result set.
                  </p>
                ) : hasDimensionFilter ? (
                  <p className="text-sm text-muted-foreground">
                    Percentages are calculated within the current filtered result set.
                  </p>
                ) : null}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.salesByProductGroup.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{item.name}</span>
                          <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-green-600 rounded-full h-2 transition-all"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-sm font-bold">${item.total.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{formatOrderLabel(item.count)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Visitors Chart with Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <VisitorChart data={analytics.chartData} />
        </div>
        <div className="space-y-4">
          <StatCard
            title="Total Visitors"
            value={analytics.visitors.total.toLocaleString()}
            className="bg-white shadow-sm"
          />
          <StatCard
            title="Unique Visitors"
            value={analytics.visitors.unique.toLocaleString()}
            className="bg-white shadow-sm"
          />
          <StatCard
            title="Total Pageviews"
            value={analytics.visitors.totalPageviews.toLocaleString()}
            className="bg-white shadow-sm"
          />
          <StatCard
            title="Bounce Rate"
            value={`${analytics.visitors.bounceRate}%`}
            className="bg-white shadow-sm"
          />
          <StatCard
            title="Visit Duration"
            value={analytics.visitors.visitDuration}
            className="bg-white shadow-sm"
          />
        </div>
      </div>

      {/* Customer Behavior & Other Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Customer Behavior</CardTitle>
            <span className="text-sm text-muted-foreground">
              {hasActiveFilters ? "Current filtered date range" : "Current selected date range"}
            </span>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{analytics.visitors.total}</p>
                <p className="text-sm text-muted-foreground">Visitors</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.customerBehavior?.checking}</p>
                <p className="text-sm text-muted-foreground">Checking Out</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.customerBehavior?.purchased}</p>
                <p className="text-sm text-muted-foreground">Purchased</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Total Checkouts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{analytics.totalCheckouts}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                ${analytics.totalSales.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
