import { useState, useMemo, useCallback, useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2 } from "lucide-react"
import { DateRange } from "react-day-picker"
import { isWithinInterval } from "date-fns"
import { exportToCSV } from "@/utils/exportUtils"
import axiosInstance from "@/api/axiosInstance"
import { useToast } from "@/components/ui/use-toast"
import { RoutingModal } from "@/components/routing/RoutingModal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  const [routingData, setRoutingData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRouting, setSelectedRouting] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch routing configurations from backend
  useEffect(() => {
    fetchRoutingConfigs()
  }, [refreshKey])

  const fetchRoutingConfigs = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/routing-configurations/')
      
      // Transform backend data to match table format
      const transformed = response.data.map((config: any) => ({
        id: config.id,
        name: config.name,
        medication_group: config.medication_group,
        createdAt: new Date(config.created_at).toLocaleDateString('en-GB'),
        rawData: config // Store raw data for editing
      }))
      
      setRoutingData(transformed)
    } catch (error) {
      console.error('Error fetching routing configs:', error)
      toast({
        title: 'Error',
        description: 'Failed to load routing configurations',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return

    try {
      await axiosInstance.delete(`/routing-configurations/${deleteId}/`)
      toast({
        title: 'Success',
        description: 'Routing configuration deleted successfully'
      })
      handleRefresh()
    } catch (error) {
      console.error('Error deleting routing config:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete routing configuration',
        variant: 'destructive'
      })
    } finally {
      setDeleteId(null)
    }
  }

  const handleEdit = (id: string) => {
    const routing = routingData.find(r => r.id === id)
    if (routing) {
      setSelectedRouting(routing.rawData)
      setOpen(true)
    }
  }

  // FIXED: Comprehensive filtering logic based on actual routing data
  const filteredRouting = useMemo(() => {
    return routingData.filter(route => {
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
  }, [routingData, searchTerm, activeRegionFilter, activeRouteTypeFilter, date])

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
  }, [])

  const handleExport = useCallback(() => {
    exportToCSV(filteredRouting, routingColumns, 'products_routing_export')
  }, [filteredRouting])

  const handleSuccess = () => {
    handleRefresh()
    setSelectedRouting(null)
  }

  const routingColumns = useMemo(() => [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "medication_group", label: "Medication Group" },
    { key: "createdAt", label: "Created At" },
    { 
      key: "actions", 
      label: "Actions",
      render: (_, row: any) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(row.id)}
            className="h-8 w-8"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteId(row.id)}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ], [handleEdit])

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
        <Button className="gap-2" onClick={() => {
          setSelectedRouting(null)
          setOpen(true)
        }}>
          <Plus className="h-4 w-4" />
          Add New
        </Button>
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

      <RoutingModal
        open={open}
        onClose={() => {
          setOpen(false)
          setSelectedRouting(null)
        }}
        onSuccess={handleSuccess}
        initialData={selectedRouting}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the routing configuration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
