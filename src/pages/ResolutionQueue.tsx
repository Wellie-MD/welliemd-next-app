import { useState, useMemo, useCallback } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp } from "lucide-react"
import { DateRange } from "react-day-picker"
import { isWithinInterval } from "date-fns"
import mockData from "@/data/mockData.json"
import { exportToCSV } from "@/utils/exportUtils"

const resolutionColumns = [
  { key: "createdAt", label: "Created At" },
  { key: "patientId", label: "Patient ID" },
  { key: "patientName", label: "Patient Name" },
  { key: "patientEmail", label: "Patient Email" },
  { key: "orderNumber", label: "Order #" },
  { key: "friendlyId", label: "Friendly ID" },
  { key: "status", label: "Status" },
  { key: "gateway", label: "Gateway" },
  { key: "card", label: "Card" },
  { key: "paymentMethod", label: "Payment Method" },
  { key: "totalPrice", label: "Total Price" },
  { key: "discount", label: "Discount" },
  { key: "processingFee", label: "Processing Fee" },
  { key: "amountPaid", label: "Amount Paid" },
  { key: "net", label: "Net" }
]

// Meaningful filters for resolution queue - focusing on problematic statuses
const statusFilters = ["All", "Pending", "Failed", "Cancelled", "Expired", "Requires Capture", "Draft"]
const priorityFilters = ["All", "High Priority", "Medium Priority", "Low Priority"]
const gatewayFilters = ["All", "Stripe", "PayPal", "Square", "Authorize.net"]

const tabs = ["Payments", "Subscriptions", "Subscription Invoices"]

// Helper function to parse date in DD/MM/YYYY format
const parseDate = (dateString: string) => {
  if (!dateString) return new Date()
  const [day, month, year] = dateString.split('/')
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

export default function ResolutionQueue() {
  const [activeTab, setActiveTab] = useState("Payments")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeStatusFilter, setActiveStatusFilter] = useState("All")
  const [activePriorityFilter, setActivePriorityFilter] = useState("All")
  const [activeGatewayFilter, setActiveGatewayFilter] = useState("All")
  const [additionalFilters, setAdditionalFilters] = useState<string[]>([])
  const [date, setDate] = useState<DateRange | undefined>()
  const [refreshKey, setRefreshKey] = useState(0)

  // Comprehensive filtering logic for resolution queue items
  const filteredResolutionQueue = useMemo(() => {
    return mockData.resolutionQueue.filter(item => {
      // Search filter - search across multiple fields
      const matchesSearch = !searchTerm || 
        item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.patientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.orderNumber.toString().includes(searchTerm) ||
        item.friendlyId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.patientId.toString().includes(searchTerm)

      // Status filter - focus on items that need resolution
      const matchesStatus = activeStatusFilter === "All" || item.status === activeStatusFilter

      // Priority filter (you might want to add a priority field to your data)
      const matchesPriority = activePriorityFilter === "All" // || item.priority === activePriorityFilter

      // Gateway filter
      const matchesGateway = activeGatewayFilter === "All" || item.gateway === activeGatewayFilter

      // Date range filter based on createdAt
      let matchesDateRange = true
      if (date?.from || date?.to) {
        const itemDate = parseDate(item.createdAt)
        
        if (date.from && date.to) {
          matchesDateRange = isWithinInterval(itemDate, {
            start: date.from,
            end: date.to
          })
        } else if (date.from) {
          matchesDateRange = itemDate >= date.from
        } else if (date.to) {
          matchesDateRange = itemDate <= date.to
        }
      }

      return matchesSearch && matchesStatus && matchesPriority && matchesGateway && matchesDateRange
    })
  }, [mockData.resolutionQueue, searchTerm, activeStatusFilter, activePriorityFilter, activeGatewayFilter, date, refreshKey])

  // Create filter configuration
  const filters = [
    // Sort button (as in original design)
    {
      key: 'sort',
      label: 'Sort',
      type: 'button' as const,
      value: additionalFilters.includes('Sort') ? 'Sort' : undefined,
      onClick: () => {
        setAdditionalFilters(prev => 
          prev.includes('Sort') 
            ? prev.filter(f => f !== 'Sort')
            : [...prev, 'Sort']
        )
      }
    },
    // Status filters - focusing on resolution-needed statuses
    ...statusFilters.map(status => ({
      key: `status-${status}`,
      label: status,
      type: 'button' as const,
      value: activeStatusFilter === status ? status : undefined,
      onClick: () => setActiveStatusFilter(status)
    })),
    // Priority filters
    ...priorityFilters.slice(1).map(priority => ({ // Skip "All" to avoid duplicate
      key: `priority-${priority}`,
      label: priority,
      type: 'button' as const,
      value: activePriorityFilter === priority ? priority : undefined,
      onClick: () => setActivePriorityFilter(priority)
    })),
    // Gateway filters
    ...gatewayFilters.slice(1).map(gateway => ({ // Skip "All" to avoid duplicate
      key: `gateway-${gateway}`,
      label: gateway,
      type: 'button' as const,
      value: activeGatewayFilter === gateway ? gateway : undefined,
      onClick: () => setActiveGatewayFilter(gateway)
    })),
    // Extra Filters button (as in original design)
    {
      key: 'extra-filters',
      label: 'Extra Filters',
      type: 'button' as const,
      value: additionalFilters.includes('Extra Filters') ? 'Extra Filters' : undefined,
      onClick: () => {
        setAdditionalFilters(prev => 
          prev.includes('Extra Filters') 
            ? prev.filter(f => f !== 'Extra Filters')
            : [...prev, 'Extra Filters']
        )
      }
    }
  ]

  const handleResetFilters = useCallback(() => {
    setActiveStatusFilter("All")
    setActivePriorityFilter("All")
    setActiveGatewayFilter("All")
    setAdditionalFilters([])
    setDate(undefined)
    setSearchTerm("")
  }, [])

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1)
    console.log("Refreshing resolution queue data...")
  }, [])

  const handleExport = useCallback(() => {
    exportToCSV(filteredResolutionQueue, resolutionColumns, 'resolution_queue_export')
  }, [filteredResolutionQueue])

  const handleUpgrade = () => {
    console.log("Upgrade clicked")
    // Implement upgrade logic
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Resolution Queue</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Orders</span>
            <span>›</span>
            <span>Resolution Queue</span>
          </div>
        </div>
        {/* Move Upgrade button to header area */}
        <Button variant="outline" size="sm" className="gap-2" onClick={handleUpgrade}>
          <TrendingUp className="h-4 w-4" />
          Upgrade
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </Button>
        ))}
      </div>

      <DataTable
        data={filteredResolutionQueue}
        columns={resolutionColumns}
        searchPlaceholder="Search by order#, order ID, patient name or payment ID"
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
