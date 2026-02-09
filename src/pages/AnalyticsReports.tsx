import { useEffect, useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  TableRow
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { AlertTriangle, CalendarIcon, Download, Loader2, Search } from "lucide-react"
import { format, subDays, subWeeks, subYears } from "date-fns"
import { cn } from "@/lib/utils"
import { getAggregates, getStates, getPharmacies, getVariants } from "@/api/analyticsReportsApi"

export default function AnalyticsReports() {
  // Date filter states
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: subDays(new Date(), 7),
    to: new Date(),
  })

  // 2. Temporary date range state (For UI selection only)
  const [tempDateRange, setTempDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>(dateRange)

  // 3. Popover open state
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  // Filter states for aggregates
  const [selectedState, setSelectedState] = useState<string>('')
  const [selectedPharmacy, setSelectedPharmacy] = useState<string>('')
  const [selectedVariant, setSelectedVariant] = useState<string>('')

  useEffect(() => {
    if (isPopoverOpen) {
      setTempDateRange(dateRange)
    }
  }, [isPopoverOpen, dateRange])

  // Search/filter states
  const [stateSearch, setStateSearch] = useState('')
  const [pharmacySearch, setPharmacySearch] = useState('')
  const [variantSearch, setVariantSearch] = useState('')

  // Build query parameters
  const queryParams = useMemo(() => ({
    ...(dateRange.from && { start_date: format(dateRange.from, "yyyy-MM-dd") }),
    ...(dateRange.to && { end_date: format(dateRange.to, "yyyy-MM-dd") }),
    ...(selectedState && { state: selectedState }),
    ...(selectedPharmacy && { pharmacy_id: selectedPharmacy }),
    ...(selectedVariant && { variant_id: selectedVariant }),
  }), [dateRange, selectedState, selectedPharmacy, selectedVariant])

  // Fetch aggregates data
  const { data: aggregates, isLoading, error } = useQuery({
    queryKey: ["aggregates", queryParams],
    queryFn: () => getAggregates(queryParams),
  })

  // Fetch filter options
  const { data: states = [] } = useQuery({
    queryKey: ["states"],
    queryFn: getStates,
    staleTime: 150000,
  })

  const { data: pharmacies = [] } = useQuery({
    queryKey: ["pharmacies"],
    queryFn: getPharmacies,
    staleTime: 150000,
  })

  const { data: variants = [] } = useQuery({
    queryKey: ["variants"],
    queryFn: getVariants,
    staleTime: 150000,
  })

  // Filter data based on search
  const filteredStateData = useMemo(() => {
    if (!aggregates?.byState) return []
    return aggregates.byState.filter(item =>
      item.state.toLowerCase().includes(stateSearch.toLowerCase())
    )
  }, [aggregates?.byState, stateSearch])

  const filteredPharmacyData = useMemo(() => {
    if (!aggregates?.byPharmacy) return []
    return aggregates.byPharmacy.filter(item =>
      item.pharmacy.toLowerCase().includes(pharmacySearch.toLowerCase())
    )
  }, [aggregates?.byPharmacy, pharmacySearch])

  const filteredVariantData = useMemo(() => {
    if (!aggregates?.byVariant) return []
    return aggregates.byVariant.filter(item =>
      item.variant.toLowerCase().includes(variantSearch.toLowerCase())
    )
  }, [aggregates?.byVariant, variantSearch])

  // Export to CSV
  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return

    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => Object.values(row).join(','))
    const csv = [headers, ...rows].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics Reports</h1>
        <div className="flex items-center gap-4">
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from && dateRange.to ? (
                  <>
                    {format(dateRange.from, "MMM dd, yyyy")} - {format(dateRange.to, "MMM dd, yyyy")}
                  </>
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3">
                <div className="flex flex-row gap-4 mb-2">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-center">Start Date</h4>
                    <Calendar
                      mode="single"
                      selected={tempDateRange.from}
                      onSelect={(date) => setTempDateRange(prev => ({ ...prev, from: date }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-center">End Date</h4>
                    <Calendar
                      mode="single"
                      selected={tempDateRange.to}
                      onSelect={(date) => setTempDateRange(prev => ({ ...prev, to: date }))}
                      disabled={(date) => tempDateRange.from ? date < tempDateRange.from : false}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPopoverOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setDateRange(tempDateRange)
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

      {/* Summary Cards */}
      {aggregates && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregates.summary.totalOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${aggregates.summary.totalSales.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">States</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregates.summary.totalStates}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pharmacies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregates.summary.totalPharmacies}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Product Variants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregates.summary.totalVariants}</div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Orders by State */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Orders by State</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search states..."
                  value={stateSearch}
                  onChange={(e) => setStateSearch(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(filteredStateData, 'orders_by_state')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStateData.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>State</TableHead>
                    <TableHead className="text-right">Total Orders</TableHead>
                    <TableHead className="text-right">Total Sales</TableHead>
                    <TableHead className="text-right">Avg Order Value</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStateData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.state}</TableCell>
                      <TableCell className="text-right">{item.totalOrders}</TableCell>
                      <TableCell className="text-right">${item.totalSales.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${item.averageOrderValue.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{item.completedOrders}</TableCell>
                      <TableCell className="text-right">{item.pendingOrders}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders by Pharmacy */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Orders by Pharmacy</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search pharmacies..."
                  value={pharmacySearch}
                  onChange={(e) => setPharmacySearch(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(filteredPharmacyData, 'orders_by_pharmacy')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPharmacyData.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pharmacy</TableHead>
                    <TableHead className="text-right">Total Orders</TableHead>
                    <TableHead className="text-right">Total Sales</TableHead>
                    <TableHead className="text-right">Avg Order Value</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPharmacyData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.pharmacy}</TableCell>
                      <TableCell className="text-right">{item.totalOrders}</TableCell>
                      <TableCell className="text-right">${item.totalSales.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${item.averageOrderValue.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{item.completedOrders}</TableCell>
                      <TableCell className="text-right">{item.pendingOrders}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders by Product Variant */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Orders by Product Variant</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search variants..."
                  value={variantSearch}
                  onChange={(e) => setVariantSearch(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(filteredVariantData, 'orders_by_variant')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredVariantData.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Variant</TableHead>
                    <TableHead className="text-right">Total Orders</TableHead>
                    <TableHead className="text-right">Total Quantity</TableHead>
                    <TableHead className="text-right">Total Sales</TableHead>
                    <TableHead className="text-right">Avg Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVariantData.map((item, index) => {
                    let displayVariant = item.variant;
                    if (item.productName && item.variant.startsWith(item.productName)) {
                      displayVariant = item.variant.replace(item.productName, '').replace(/^[\s-]+/, '');
                    }

                    // Fallback
                    if (!displayVariant.trim()) displayVariant = 'Default Variant';

                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          <div className="text-base font-semibold">
                            {/* Top Line: Product Name (from order.product_name) */}
                            {item.productName || item.variant}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {/* Bottom Line: Cleaned Variant Name */}
                            {displayVariant}
                          </div>
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
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Other Tabs (Premium Features)
        <TabsContent value="time-metrics" className="space-y-6">
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              This is a premium feature that is still in development. The data calculated might not be accurate and should be validated.
            </AlertDescription>
          </Alert>
          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No data</h3>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="retention" className="space-y-6">
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              This is a premium feature that is still in development. The data calculated might not be accurate and should be validated.
            </AlertDescription>
          </Alert>
          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No data</h3>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="segments" className="space-y-6">
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              This is a premium feature that is still in development. The data calculated might not be accurate and should be validated.
            </AlertDescription>
          </Alert>
          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No data</h3>
            </div>
          </div>
        </TabsContent> */}
    </div>
  )
}