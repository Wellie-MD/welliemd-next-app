import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  CalendarIcon,
  Download,
  Loader2,
  Search,
  ShoppingCart,
  DollarSign,
  Building2,
  Package,
  Filter,
  X,
} from "lucide-react"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import {
  getAggregates,
  getStates,
  getPharmacies,
  getVariants,
  type AggregatesData,
  type AggregateByPharmacy,
  type AggregateByState,
  type AggregateByVariant,
} from "@/api/analyticsReportsApi"

function SummaryCard({
  title,
  value,
  icon: Icon,
  iconTone = "text-primary",
  chipTone = "bg-primary/10",
}: {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  iconTone?: string
  chipTone?: string
}) {
  return (
    <Card className="border-border/70 shadow-sm transition-colors hover:border-primary/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </CardTitle>
          <div className={`rounded-md p-1.5 ${chipTone}`}>
            <Icon className={`h-4 w-4 ${iconTone}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  )
}

function SectionHeader({
  title,
  searchValue,
  onSearchChange,
  onExport,
  placeholder,
  showExport = true,
}: {
  title: string
  searchValue: string
  onSearchChange: (value: string) => void
  onExport: () => void
  placeholder: string
  showExport?: boolean
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <CardTitle className="text-base">{title}</CardTitle>
      <div className="flex items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        {showExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        )}
      </div>
    </div>
  )
}

function CompletionCell({
  completed,
  pending,
  total,
}: {
  completed: number
  pending: number
  total: number
}) {
  const ratio = total > 0 ? Math.round((completed / total) * 100) : 0
  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-w-[130px]">
        <div className="mb-1 flex items-center justify-end gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 cursor-pointer">
                {completed}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Shipped</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 cursor-pointer">
                {pending}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Pending</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted">
          <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${ratio}%` }} />
        </div>
      </div>
    </TooltipProvider>
  )
}

export default function AnalyticsReports() {
  const [period, setPeriod] = useState<"day" | "week" | "month" | "year" | "custom">("week")
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [tempDateRange, setTempDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const [selectedState, setSelectedState] = useState("")
  const [selectedPharmacy, setSelectedPharmacy] = useState("")
  const [selectedVariant, setSelectedVariant] = useState("")

  const [stateSearch, setStateSearch] = useState("")
  const [pharmacySearch, setPharmacySearch] = useState("")
  const [variantSearch, setVariantSearch] = useState("")

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

  useEffect(() => {
    if (isPopoverOpen) setTempDateRange(customDateRange)
  }, [isPopoverOpen, customDateRange])

  const queryParams = useMemo(
    () => ({
      start_date: startOfDay(dateRange.from).toISOString(),
      end_date: endOfDay(dateRange.to).toISOString(),
      ...(selectedState && { state: selectedState }),
      ...(selectedPharmacy && { pharmacy_id: selectedPharmacy }),
      ...(selectedVariant && { variant_id: selectedVariant }),
    }),
    [dateRange, selectedState, selectedPharmacy, selectedVariant],
  )

  const {
    data: aggregates,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["aggregates", queryParams],
    queryFn: () => getAggregates(queryParams),
  })

  const optionParams = useMemo(
    () => ({
      start_date: startOfDay(dateRange.from).toISOString(),
      end_date: endOfDay(dateRange.to).toISOString(),
      ...(selectedState && { state: selectedState }),
      ...(selectedPharmacy && { pharmacy_id: selectedPharmacy }),
      ...(selectedVariant && { variant_id: selectedVariant }),
    }),
    [dateRange, selectedState, selectedPharmacy, selectedVariant],
  )

  const { data: states = [] } = useQuery({
    queryKey: ["states", optionParams.start_date, optionParams.end_date, optionParams.pharmacy_id, optionParams.variant_id],
    queryFn: () => getStates(optionParams),
    staleTime: 150000,
  })

  const { data: pharmacies = [] } = useQuery({
    queryKey: ["pharmacies", optionParams.start_date, optionParams.end_date, optionParams.state, optionParams.variant_id],
    queryFn: () => getPharmacies(optionParams),
    staleTime: 150000,
  })

  const { data: variants = [] } = useQuery({
    queryKey: ["variants", optionParams.start_date, optionParams.end_date, optionParams.state, optionParams.pharmacy_id],
    queryFn: () => getVariants(optionParams),
    staleTime: 150000,
  })

  const filteredStateData = useMemo(() => {
    if (!aggregates?.byState) return []
    return aggregates.byState.filter((item) =>
      item.state.toLowerCase().includes(stateSearch.toLowerCase()),
    )
  }, [aggregates?.byState, stateSearch])

  const filteredPharmacyData = useMemo(() => {
    if (!aggregates?.byPharmacy) return []
    return aggregates.byPharmacy.filter((item) =>
      item.pharmacy.toLowerCase().includes(pharmacySearch.toLowerCase()),
    )
  }, [aggregates?.byPharmacy, pharmacySearch])

  const filteredVariantData = useMemo(() => {
    if (!aggregates?.byVariant) return []
    return aggregates.byVariant.filter((item) =>
      item.variant.toLowerCase().includes(variantSearch.toLowerCase()),
    )
  }, [aggregates?.byVariant, variantSearch])

  const hasActiveReportFilters = Boolean(selectedState || selectedPharmacy || selectedVariant)
  const selectedPharmacyLabel = pharmacies.find((item) => String(item.id) === String(selectedPharmacy))?.name || selectedPharmacy
  const selectedVariantLabel = variants.find((item) => String(item.id) === String(selectedVariant))?.name || selectedVariant

  const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    if (!data.length) return

    const headers = Object.keys(data[0]).join(",")
    const rows = data.map((row) => Object.values(row).join(","))
    const csv = [headers, ...rows].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

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

  return (
    <div className="space-y-6 p-6 relative z-0">
      <Card className="border-border/70 bg-gradient-to-r from-primary/5 via-background to-blue-50/40 shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Analytics Reports</h1>
              <p className="text-sm text-muted-foreground">
                Operational reporting across states, pharmacies, and product variants.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickRange("day")}
                className={period === "day" ? "bg-accent text-accent-foreground" : ""}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickRange("week")}
                className={period === "week" ? "bg-accent text-accent-foreground" : ""}
              >
                Last 7 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickRange("month")}
                className={period === "month" ? "bg-accent text-accent-foreground" : ""}
              >
                Last 30 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickRange("year")}
                className={period === "year" ? "bg-accent text-accent-foreground" : ""}
              >
                Last year
              </Button>
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`justify-start text-left${period === "custom" ? " bg-accent text-accent-foreground" : ""}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from && dateRange.to ? (
                      <>{format(dateRange.from, "MMM dd, yyyy")} - {format(dateRange.to, "MMM dd, yyyy")}</>
                    ) : (
                      <span>Pick date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <div className="p-3">
                    <div className="mb-2 flex flex-row gap-4">
                      <div className="space-y-2">
                        <h4 className="text-center text-sm font-medium">Start Date</h4>
                        <Calendar
                          mode="single"
                          selected={tempDateRange.from}
                          onSelect={(date) => setTempDateRange((prev) => ({ ...prev, from: date }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-center text-sm font-medium">End Date</h4>
                        <Calendar
                          mode="single"
                          selected={tempDateRange.to}
                          onSelect={(date) => setTempDateRange((prev) => ({ ...prev, to: date }))}
                          disabled={(date) => (tempDateRange.from ? date < tempDateRange.from : false)}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 border-t pt-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsPopoverOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={!tempDateRange.from || !tempDateRange.to}
                        onClick={() => {
                          setCustomDateRange(tempDateRange)
                          setPeriod("custom")
                          setIsPopoverOpen(false)
                        }}
                      >
                        Apply Range
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className={`flex items-center gap-1 ${period !== "week" || hasActiveReportFilters
                  ? "bg-primary/15 text-primary"
                  : "bg-primary/10 text-primary"
                }`}
            >
              <Filter className="h-3 w-3" />
              <span>
                {period === "day" && "Today"}
                {period === "week" && "Last 7 days"}
                {period === "month" && "Last 30 days"}
                {period === "year" && "Last year"}
                {period === "custom" && dateRange.from && dateRange.to
                  ? `${format(dateRange.from, "MMM dd")} – ${format(dateRange.to, "MMM dd, yyyy")}`
                  : period === "custom" ? "Custom range" : ""}
                {hasActiveReportFilters && " · Filtered"}
              </span>
              {(period !== "week" || hasActiveReportFilters) && (
                <button
                  className="ml-1 rounded-full hover:bg-primary/20 p-0.5 transition-colors"
                  aria-label="Clear date filter"
                  onClick={() => {
                    setQuickRange("week")
                    setSelectedState("")
                    setSelectedPharmacy("")
                    setSelectedVariant("")
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>Failed to load analytics reports. Please refresh and try again.</AlertDescription>
        </Alert>
      )}

      {aggregates && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            title="Total Orders"
            value={aggregates.summary.totalOrders}
            icon={ShoppingCart}
            iconTone="text-blue-600"
            chipTone="bg-blue-100"
          />
          <SummaryCard
            title="Total Sales"
            value={`$${aggregates.summary.totalSales.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
            icon={DollarSign}
            iconTone="text-emerald-600"
            chipTone="bg-emerald-100"
          />
          <SummaryCard
            title="States"
            value={aggregates.summary.totalStates}
            icon={Building2}
            iconTone="text-indigo-600"
            chipTone="bg-indigo-100"
          />
          <SummaryCard
            title="Pharmacies"
            value={aggregates.summary.totalPharmacies}
            icon={Building2}
            iconTone="text-amber-600"
            chipTone="bg-amber-100"
          />
          <SummaryCard
            title="Product Variants"
            value={aggregates.summary.totalVariants}
            icon={Package}
            iconTone="text-violet-600"
            chipTone="bg-violet-100"
          />
        </div>
      )}

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-primary">Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">State</label>
              <Select value={selectedState || "all"} onValueChange={(val) => setSelectedState(val === "all" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {states.length === 0 && <p className="text-xs text-muted-foreground">No states for current date/filter scope.</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Pharmacy</label>
              <Select value={selectedPharmacy || "all"} onValueChange={(val) => setSelectedPharmacy(val === "all" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Pharmacies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pharmacies</SelectItem>
                  {pharmacies.map((pharmacy) => (
                    <SelectItem key={String(pharmacy.id)} value={String(pharmacy.id)}>
                      {pharmacy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {pharmacies.length === 0 && <p className="text-xs text-muted-foreground">No pharmacies for current date/filter scope.</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Variant</label>
              <Select value={selectedVariant || "all"} onValueChange={(val) => setSelectedVariant(val === "all" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Variants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Variants</SelectItem>
                  {variants.map((variant) => (
                    <SelectItem key={String(variant.id)} value={String(variant.id)}>
                      {variant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {variants.length === 0 && <p className="text-xs text-muted-foreground">No variants for current date/filter scope.</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <SectionHeader
              title="Orders by State"
              searchValue={stateSearch}
              onSearchChange={setStateSearch}
              onExport={() => exportToCSV(filteredStateData as Record<string, unknown>[], "orders_by_state")}
              placeholder="Search states..."
              showExport={false}
            />
          </CardHeader>
          <CardContent>
            {filteredStateData.length > 0 ? (
              <div className="rounded-md border">
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>State</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Sales</TableHead>
                        <TableHead className="text-right">Avg Order</TableHead>
                        <TableHead className="text-right">Fulfillment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(filteredStateData as AggregateByState[]).map((item, index) => (
                        <TableRow
                          key={`${item.state}-${index}`}
                          className="transition-colors odd:bg-muted/20 hover:bg-primary/5"
                        >
                          <TableCell className="font-medium">{item.state}</TableCell>
                          <TableCell className="text-right">{item.totalOrders}</TableCell>
                          <TableCell className="text-right">${item.totalSales.toLocaleString()}</TableCell>
                          <TableCell className="text-right">${item.averageOrderValue.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <CompletionCell
                              completed={item.completedOrders}
                              pending={item.pendingOrders}
                              total={item.totalOrders}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <SectionHeader
              title="Orders by Pharmacy"
              searchValue={pharmacySearch}
              onSearchChange={setPharmacySearch}
              onExport={() => exportToCSV(filteredPharmacyData as Record<string, unknown>[], "orders_by_pharmacy")}
              placeholder="Search pharmacies..."
              showExport={false}
            />
          </CardHeader>
          <CardContent>
            {filteredPharmacyData.length > 0 ? (
              <div className="rounded-md border">
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>Pharmacy</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Sales</TableHead>
                        <TableHead className="text-right">Avg Order</TableHead>
                        <TableHead className="text-right">Fulfillment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(filteredPharmacyData as AggregateByPharmacy[]).map((item, index) => (
                        <TableRow
                          key={`${item.pharmacy}-${index}`}
                          className="transition-colors odd:bg-muted/20 hover:bg-primary/5"
                        >
                          <TableCell className="font-medium">{item.pharmacy}</TableCell>
                          <TableCell className="text-right">{item.totalOrders}</TableCell>
                          <TableCell className="text-right">${item.totalSales.toLocaleString()}</TableCell>
                          <TableCell className="text-right">${item.averageOrderValue.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <CompletionCell
                              completed={item.completedOrders}
                              pending={item.pendingOrders}
                              total={item.totalOrders}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <SectionHeader
            title="Orders by Product Variant"
            searchValue={variantSearch}
            onSearchChange={setVariantSearch}
            onExport={() => exportToCSV(filteredVariantData as Record<string, unknown>[], "orders_by_variant")}
            placeholder="Search variants..."
            showExport={false}
          />
        </CardHeader>
        <CardContent>
          {filteredVariantData.length > 0 ? (
            <div className="rounded-md border">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead>Product Variant</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Sales</TableHead>
                      <TableHead className="text-right">Avg Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(filteredVariantData as AggregateByVariant[]).map((item, index) => {
                      let displayVariant = item.variant
                      if (item.productName && item.variant.startsWith(item.productName)) {
                        displayVariant = item.variant.replace(item.productName, "").replace(/^[\s-]+/, "")
                      }
                      const showSubLabel = displayVariant.trim() !== "" && displayVariant.trim() !== (item.productName || "").trim()

                      return (
                        <TableRow
                          key={`${item.variant}-${index}`}
                          className="transition-colors odd:bg-muted/20 hover:bg-primary/5"
                        >
                          <TableCell className="font-medium">
                            <div className="text-base font-semibold">{item.productName || item.variant}</div>
                            {showSubLabel && <div className="text-sm text-muted-foreground">{displayVariant}</div>}
                          </TableCell>
                          <TableCell className="text-right">{item.totalOrders}</TableCell>
                          <TableCell className="text-right">{item.totalQuantity}</TableCell>
                          <TableCell className="text-right">${item.totalSales.toLocaleString()}</TableCell>
                          <TableCell className="text-right">${item.averagePrice.toFixed(2)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground">No data available</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
