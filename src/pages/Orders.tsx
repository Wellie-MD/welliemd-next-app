import { useState, useMemo, useCallback } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, RotateCcw, TrendingUp, Download, RefreshCw, Grid3X3 } from "lucide-react"
import { DateRange } from "react-day-picker"
import { isWithinInterval } from "date-fns"
import mockData from "@/data/mockData.json"
import { exportToCSV } from "@/utils/exportUtils"

const orderColumns = [
  { key: "name", label: "Name", width: "150px" },
  { key: "email", label: "Email", width: "200px" },
  { key: "phone", label: "Phone", width: "130px" },
  { key: "pharmacy", label: "Pharmacy", width: "150px" },
  { key: "orderDate", label: "Order Date", width: "100px" },
  { key: "datePrescribed", label: "Date Prescribed", width: "100px" },
  { key: "datePrintedShipped", label: "Date Printed / Shipped", width: "100px" },
  { key: "paymentDate", label: "Payment Date", width: "100px" },
  { key: "mrn", label: "MRN#", width: "120px" },
  { key: "paymentStatus", label: "Payment Status", width: "100px" },
  { key: "visitStatus", label: "Visit Status", width: "100px" },
  { key: "address", label: "Address", width: "150px" },
  { key: "orderStatus", label: "Order Status", width: "100px" },
  { key: "orderTotal", label: "Order Total", width: "100px" }
]

// Meaningful filters based on the orders data structure
const paymentStatusFilters = ["All", "Paid", "Pending", "Failed", "Refunded"]
const orderStatusFilters = ["All", "Processing", "Shipped", "Delivered", "Cancelled"]
const visitStatusFilters = ["All", "Scheduled", "Completed", "Missed", "Rescheduled"]

// Additional filter buttons (keeping the original ones from your design)
const additionalFilters = [
  "Sort", 
  "Product", 
  "Pharmacies", 
  "Pharmacy Status", 
  "Extra Filters"
]

// Helper function to parse date in DD/MM/YYYY format
const parseDate = (dateString: string) => {
  if (!dateString) return new Date()
  const [day, month, year] = dateString.split('/')
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activePaymentStatusFilter, setActivePaymentStatusFilter] = useState("All")
  const [activeOrderStatusFilter, setActiveOrderStatusFilter] = useState("All")
  const [activeVisitStatusFilter, setActiveVisitStatusFilter] = useState("All")
  const [activeAdditionalFilters, setActiveAdditionalFilters] = useState<string[]>([])
  const [date, setDate] = useState<DateRange | undefined>()
  const [refreshKey, setRefreshKey] = useState(0)

  // Comprehensive filtering logic based on actual order data
  const filteredOrders = useMemo(() => {
    return mockData.orders.filter(order => {
      // Search filter - search across multiple fields
      const matchesSearch = !searchTerm || 
        order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phone.includes(searchTerm) ||
        order.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.pharmacy.toLowerCase().includes(searchTerm.toLowerCase())

      // Payment Status filter
      const matchesPaymentStatus = activePaymentStatusFilter === "All" || order.paymentStatus === activePaymentStatusFilter

      // Order Status filter
      const matchesOrderStatus = activeOrderStatusFilter === "All" || order.orderStatus === activeOrderStatusFilter

      // Visit Status filter
      const matchesVisitStatus = activeVisitStatusFilter === "All" || order.visitStatus === activeVisitStatusFilter

      // Date range filter based on orderDate
      let matchesDateRange = true
      if (date?.from || date?.to) {
        const orderDate = parseDate(order.orderDate)
        
        if (date.from && date.to) {
          matchesDateRange = isWithinInterval(orderDate, {
            start: date.from,
            end: date.to
          })
        } else if (date.from) {
          matchesDateRange = orderDate >= date.from
        } else if (date.to) {
          matchesDateRange = orderDate <= date.to
        }
      }

      // Additional filters logic
      let matchesAdditionalFilters = true
      if (activeAdditionalFilters.length > 0) {
        // Add your custom logic here based on the additional filters
        // For now, we'll just show all results when additional filters are active
      }

      return matchesSearch && matchesPaymentStatus && matchesOrderStatus && matchesVisitStatus && matchesDateRange && matchesAdditionalFilters
    })
  }, [mockData.orders, searchTerm, activePaymentStatusFilter, activeOrderStatusFilter, activeVisitStatusFilter, date, activeAdditionalFilters, refreshKey])

  // Create filter configuration - combining all filter types
  const filters = [
    // Payment Status filters
    ...paymentStatusFilters.map(status => ({
      key: `payment-${status}`,
      label: status === "All" ? "Payment status" : status,
      type: 'button' as const,
      value: activePaymentStatusFilter === status ? status : undefined,
      onClick: () => setActivePaymentStatusFilter(status)
    })),
    // Order Status filters  
    ...orderStatusFilters.slice(1).map(status => ({ // Skip "All" to avoid duplicate
      key: `order-${status}`,
      label: status,
      type: 'button' as const,
      value: activeOrderStatusFilter === status ? status : undefined,
      onClick: () => setActiveOrderStatusFilter(status)
    })),
    // Visit Status filters
    ...visitStatusFilters.slice(1).map(status => ({ // Skip "All" to avoid duplicate
      key: `visit-${status}`,
      label: status,
      type: 'button' as const,
      value: activeVisitStatusFilter === status ? status : undefined,
      onClick: () => setActiveVisitStatusFilter(status)
    })),
    // Additional filter buttons
    ...additionalFilters.map(filter => ({
      key: `additional-${filter}`,
      label: filter,
      type: 'button' as const,
      value: activeAdditionalFilters.includes(filter) ? filter : undefined,
      onClick: () => {
        setActiveAdditionalFilters(prev => 
          prev.includes(filter) 
            ? prev.filter(f => f !== filter)
            : [...prev, filter]
        )
      }
    }))
  ]

  const handleResetFilters = useCallback(() => {
    setActivePaymentStatusFilter("All")
    setActiveOrderStatusFilter("All") 
    setActiveVisitStatusFilter("All")
    setActiveAdditionalFilters([])
    setDate(undefined)
    setSearchTerm("")
  }, [])

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1)
    console.log("Refreshing orders data...")
  }, [])

  const handleExport = useCallback(() => {
    exportToCSV(filteredOrders, orderColumns, 'orders_export')
  }, [filteredOrders])

  const handleUpgrade = () => {
    console.log("Upgrade clicked")
    // Implement upgrade logic
  }

  const handleGridView = () => {
    console.log("Grid view clicked") 
    // Implement grid view toggle logic
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Orders</span>
            <span>›</span>
            <span>Orders</span>
          </div>
        </div>
        {/* Right side buttons that were originally in the top row */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleUpgrade}>
            <TrendingUp className="h-4 w-4" />
            Upgrade
          </Button>
          <Button variant="outline" size="sm" onClick={handleGridView}>
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <DataTable
        data={filteredOrders}
        columns={orderColumns}
        searchPlaceholder="Search by Order#, affiliate order #, MRN#, patient name, phone number"
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
