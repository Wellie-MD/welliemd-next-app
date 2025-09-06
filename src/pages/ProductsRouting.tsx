import { useState, useMemo, useCallback } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import mockData from "@/data/mockData.json"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DateRange } from "react-day-picker"
import { isWithinInterval } from "date-fns"
import { exportToCSV } from "@/utils/exportUtils"

const routingColumns = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "createdAt", label: "Created At" }
]

// Fixed filters to match exact data values shown in your table
const regionFilters = ["All", "North Region", "South Region", "East Coast", "West Coast", "Central"]
const routeTypeFilters = ["All", "Distribution", "Shipping", "Warehouse", "Delivery", "Supply"]

// Helper function to parse date in DD/MM/YYYY format
const parseDate = (dateString: string) => {
  if (!dateString) return new Date()
  const [day, month, year] = dateString.split('/')
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

export default function ProductsRouting() {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeRegionFilter, setActiveRegionFilter] = useState("All")
  const [activeRouteTypeFilter, setActiveRouteTypeFilter] = useState("All")
  const [date, setDate] = useState<DateRange | undefined>()
  const [refreshKey, setRefreshKey] = useState(0)
  const [formData, setFormData] = useState({
    name: "",
    groupId: "",
  })

  // FIXED: Comprehensive filtering logic based on actual routing data
  const filteredRouting = useMemo(() => {
    return mockData.routing.filter(route => {
      // Search filter - search by name or ID
      const matchesSearch = !searchTerm || 
        route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.id.toLowerCase().includes(searchTerm.toLowerCase())

      // FIXED: Region filter - match exact substrings with spaces preserved
      const matchesRegion = activeRegionFilter === "All" || 
        route.name.includes(activeRegionFilter)

      // FIXED: Route Type filter - match exact substrings with proper casing
      const matchesRouteType = activeRouteTypeFilter === "All" || 
        route.name.includes(activeRouteTypeFilter)

      // Date range filter based on createdAt
      let matchesDateRange = true
      if (date?.from || date?.to) {
        const routeDate = parseDate(route.createdAt)
        
        if (date.from && date.to) {
          matchesDateRange = isWithinInterval(routeDate, {
            start: date.from,
            end: date.to
          })
        } else if (date.from) {
          matchesDateRange = routeDate >= date.from
        } else if (date.to) {
          matchesDateRange = routeDate <= date.to
        }
      }

      return matchesSearch && matchesRegion && matchesRouteType && matchesDateRange
    })
  }, [mockData.routing, searchTerm, activeRegionFilter, activeRouteTypeFilter, date, refreshKey])

  // Create filter configuration based on routing data patterns
  const filters = [
    // Region filters
    ...regionFilters.map(region => ({
      key: `region-${region}`,
      label: region,
      type: 'button' as const,
      value: activeRegionFilter === region ? region : undefined,
      onClick: () => setActiveRegionFilter(region)
    })),
    // Route Type filters
    ...routeTypeFilters.slice(1).map(type => ({ // Skip "All" to avoid duplicate
      key: `route-type-${type}`,
      label: type,
      type: 'button' as const,
      value: activeRouteTypeFilter === type ? type : undefined,
      onClick: () => setActiveRouteTypeFilter(type)
    }))
  ]

  const handleResetFilters = useCallback(() => {
    setActiveRegionFilter("All")
    setActiveRouteTypeFilter("All")
    setDate(undefined)
    setSearchTerm("")
  }, [])

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1)
    console.log("Refreshing routing data...")
  }, [])

  const handleExport = useCallback(() => {
    exportToCSV(filteredRouting, routingColumns, 'products_routing_export')
  }, [filteredRouting])

  const handleCreate = () => {
    // Handle routing creation here
    console.log("Creating new routing:", formData)
    setOpen(false)
    setFormData({ name: "", groupId: "" })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products Routing</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Products</span>
            <span>›</span>
            <span>Routing</span>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Routing Config</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupId">
                  Group ID <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.groupId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, groupId: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Please select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semaglutide">Semaglutide</SelectItem>
                    <SelectItem value="NAD">NAD</SelectItem>
                    <SelectItem value="GTH">GTH</SelectItem>
                    <SelectItem value="Remi">Remi</SelectItem>
                    <SelectItem value="Tirzep">Tirzep</SelectItem>
                    <SelectItem value="LockLab">LockLab</SelectItem>
                    <SelectItem value="Brand-Name-GLPs">Brand Name GLPs</SelectItem>
                    <SelectItem value="VitD">VitD</SelectItem>
                    <SelectItem value="Sublingual">Sublingual Sema</SelectItem>
                    <SelectItem value="Everyday">Everyday +</SelectItem>
                    <SelectItem value="micb12">micb12</SelectItem>
                    <SelectItem value="Zofran">Zofran</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!formData.name || !formData.groupId}
                >
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        data={filteredRouting}
        columns={routingColumns}
        searchPlaceholder="Search by name"
        showDatePicker={true}
        showExport={true}
        showResetFilters={true}
        filters={filters}
        dateRange={date}
        onDateRangeChange={setDate}
        onSearch={setSearchTerm}
        onResetFilters={handleResetFilters}
        onExport={handleExport}
        onRefresh={handleRefresh}
      />
    </div>
  )
}
