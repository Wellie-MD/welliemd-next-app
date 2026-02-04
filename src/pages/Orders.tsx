import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, RotateCcw, TrendingUp, Download, RefreshCw, Grid3X3 } from "lucide-react"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { useAdminOrders } from "@/hooks/useAdminOrders"
import { exportToCSV } from "@/utils/exportUtils"

const orderColumns = [
  { key: "display_id", label: "Order #" },
  { key: "patient_name", label: "Patient Name" },
  { key: "patient_email", label: "Email" },
  { key: "patient_phone", label: "Phone" },
  { key: "client_name", label: "Client" },
  { key: "product_name", label: "Product" },
  { key: "pharmacy_name", label: "Pharmacy" },
  { key: "status_display", label: "Order Status" },
  { key: "payment_status", label: "Payment Status" },
  { key: "amount", label: "Amount" },
  { key: "created_at", label: "Order Date" },
  { key: "prescribed_at", label: "Prescribed Date" },
  { key: "shipped_at", label: "Shipped Date" },
]

// Status filters based on Order model
const orderStatusFilters = [
  "All",
  "Created",
  "Processing",
  "Visit Pending",
  "Prescribed",
  "Rx Sent",
  "Shipped",
  "Canceled"
]

const paymentStatusFilters = ["All", "Paid", "Pending", "Failed"]

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeOrderStatusFilter, setActiveOrderStatusFilter] = useState("All")
  const [activePaymentStatusFilter, setActivePaymentStatusFilter] = useState("All")
  const [date, setDate] = useState<DateRange | undefined>()
  
  const {
    orders,
    loading,
    error,
    pagination,
    setPage,
    setFilters,
    refetch
  } = useAdminOrders()

  // Use ref to track previous filter values to prevent unnecessary updates
  const prevFiltersRef = useRef({
    searchTerm: "",
    activeOrderStatusFilter: "All",
    date: undefined as DateRange | undefined
  });

  // Apply filters when they change (with debouncing for search)
  useEffect(() => {
    const prev = prevFiltersRef.current;
    
    // Check if filters actually changed
    const filtersChanged = 
      prev.searchTerm !== searchTerm ||
      prev.activeOrderStatusFilter !== activeOrderStatusFilter ||
      prev.date !== date;
    
    if (!filtersChanged) {
      return;
    }
    
    // Update ref
    prevFiltersRef.current = {
      searchTerm,
      activeOrderStatusFilter,
      date
    };
    
    // Debounce search input
    const timeoutId = setTimeout(() => {
      const filters: any = {}
      
      if (searchTerm) {
        filters.search = searchTerm
      }
      
      if (activeOrderStatusFilter !== "All") {
        // Map display names to backend status values
        const statusMap: Record<string, string> = {
          "Created": "created",
          "Processing": "processing",
          "Visit Pending": "visit_pending",
          "Prescribed": "prescribed",
          "Rx Sent": "rx_sent",
          "Shipped": "shipped",
          "Canceled": "canceled"
        }
        filters.status = statusMap[activeOrderStatusFilter]
      }
      
      if (date?.from) {
        filters.date_from = format(date.from, 'yyyy-MM-dd')
      }
      
      if (date?.to) {
        filters.date_to = format(date.to, 'yyyy-MM-dd')
      }
      
      setFilters(filters)
    }, searchTerm !== prev.searchTerm ? 500 : 0) // Debounce search by 500ms
    
    return () => clearTimeout(timeoutId)
  }, [searchTerm, activeOrderStatusFilter, date, setFilters])

  // Format orders for display
  const formattedOrders = useMemo(() => {
    return orders
      .filter(order => {
        // Client-side payment status filter
        if (activePaymentStatusFilter !== "All") {
          return order.payment_status === activePaymentStatusFilter.toLowerCase()
        }
        return true
      })
      .map(order => ({
        ...order,
        amount: `$${order.amount.toFixed(2)}`,
        created_at: order.created_at ? format(new Date(order.created_at), 'MM/dd/yyyy') : '',
        prescribed_at: order.prescribed_at ? format(new Date(order.prescribed_at), 'MM/dd/yyyy') : '',
        shipped_at: order.shipped_at ? format(new Date(order.shipped_at), 'MM/dd/yyyy') : '',
        payment_status: order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1),
      }))
  }, [orders, activePaymentStatusFilter])

  // Create filter configuration
  const filters = [
    // Order Status filters
    ...orderStatusFilters.map(status => ({
      key: `order-${status}`,
      label: status === "All" ? "Order Status" : status,
      type: 'button' as const,
      value: activeOrderStatusFilter === status ? status : undefined,
      onClick: () => setActiveOrderStatusFilter(status)
    })),
    // Payment Status filters
    ...paymentStatusFilters.map(status => ({
      key: `payment-${status}`,
      label: status === "All" ? "Payment Status" : status,
      type: 'button' as const,
      value: activePaymentStatusFilter === status ? status : undefined,
      onClick: () => setActivePaymentStatusFilter(status)
    })),
  ]

  const handleResetFilters = useCallback(() => {
    setActiveOrderStatusFilter("All")
    setActivePaymentStatusFilter("All")
    setDate(undefined)
    setSearchTerm("")
    // Reset will trigger the useEffect which will call setFilters
  }, [])

  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  const handleExport = useCallback(() => {
    exportToCSV(formattedOrders, orderColumns, 'admin_orders_export')
  }, [formattedOrders])

  const handleUpgrade = () => {
    console.log("Upgrade clicked")
  }

  const handleGridView = () => {
    console.log("Grid view clicked")
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-500">Error loading orders: {error.message}</div>
        <Button onClick={handleRefresh} className="mt-4">Retry</Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Orders</span>
            <span>›</span>
            <span>All Orders</span>
          </div>
        </div>
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
        data={formattedOrders}
        columns={orderColumns}
        searchPlaceholder="Search by Order#, patient name, phone number, email"
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
        loading={loading}
      />
      
      {/* Pagination Info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {formattedOrders.length} of {pagination.total_count} orders
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(pagination.page - 1)}
            disabled={pagination.page === 1 || loading}
          >
            Previous
          </Button>
          <span>
            Page {pagination.page} of {pagination.total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.total_pages || loading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
