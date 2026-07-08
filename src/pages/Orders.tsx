import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, RotateCcw, TrendingUp, Download, RefreshCw, Grid3X3 } from "lucide-react"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { useAdminOrders } from "@/hooks/useAdminOrders"
import { exportToCSV } from "@/utils/exportUtils"
import { AdminOrder } from "@/api/dashboardApi"
import { OrderDetailDrawer } from "@/components/orders/OrderDetailDrawer"

// Status filters based on Order model
const orderStatusFilters = [
  "All",
  "Created",
  "Payment Pending",
  "Processing",
  "Visit Failed",
  "Visit Pending",
  "Consult Canceled",
  "Referred",
  "Prescribed",
  "Billing Pending",
  "Rx Sent",
  "Shipped",
  "Canceled"
]

const paymentStatusFilters = ["All", "Paid", "Pending", "Failed"]

const formatPaymentStatusLabel = (status: string): string => {
  const value = String(status || "").trim().toLowerCase()
  if (!value) return "Pending"
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

const formatVisitStatusLabel = (status?: string | null): string => {
  const value = String(status || "").trim()
  if (!value) return "N/A"
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeOrderStatusFilter, setActiveOrderStatusFilter] = useState("All")
  const [activePaymentStatusFilter, setActivePaymentStatusFilter] = useState("All")
  const [date, setDate] = useState<DateRange | undefined>()
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  
  const {
    orders,
    loading,
    error,
    pagination,
    setPage,
    setFilters,
    refetch
  } = useAdminOrders()

  const handleOrderClick = useCallback((row: any) => {
    // Reconstruct raw AdminOrder from the formatted row
    const rawOrder: AdminOrder = {
      id: row.id,
      display_id: row._raw_display_id ?? row.display_id,
      order_id: row.order_id ?? null,
      master_id: row.master_id ?? null,
      patient_name: row.patient_name,
      patient_email: row.patient_email,
      patient_phone: row.patient_phone,
      product_name: row.product_name,
      pharmacy_name: row.pharmacy_name,
      status: row.status,
      status_display: row.status_display,
      visit_status: row._raw_visit_status,
      amount: row._raw_amount,
      payment_recovery_state: row.payment_recovery_state ?? null,
      remaining_supplemental_amount: row.remaining_supplemental_amount ?? null,
      chargeable_amount: row.chargeable_amount ?? row._raw_amount,
      chargeable_amount_source: row.chargeable_amount_source ?? null,
      discount_amount: row.discount_amount,
      requested_medicine_name: row.requested_medicine_name ?? null,
      prescribed_medicine_name: row.prescribed_medicine_name ?? null,
      doctor_name: row.doctor_name ?? null,
      payment_status: row._raw_payment_status,
      created_at: row._raw_created_at,
      prescribed_at: row._raw_prescribed_at,
      shipped_at: row._raw_shipped_at,
      tracking_number: row.tracking_number,
      client_name: row.client_name,
      client_id: row.client_id,
    }
    setSelectedOrder(rawOrder)
    setDrawerOpen(true)
  }, [])

  const handleOrderUpdated = useCallback((updatedOrder: AdminOrder) => {
    refetch()
  }, [refetch])

  // Column definitions with clickable order number
  const orderColumns = useMemo(() => [
    {
      key: "display_id",
      label: "Order #",
      render: (_value: unknown, row: unknown) => {
        const r = row as any
        return (
          <button
            className="text-primary hover:underline font-medium text-left cursor-pointer"
            onClick={() => handleOrderClick(r)}
          >
            {r.display_id}
          </button>
        )
      }
    },
    { key: "patient_name", label: "Patient Name" },
    { key: "patient_email", label: "Email" },
    { key: "patient_phone", label: "Phone" },
    { key: "client_name", label: "Client" },
    { key: "product_name", label: "Product" },
    { key: "pharmacy_name", label: "Pharmacy" },
    {
      key: "status_display",
      label: "Order Status",
      render: (_value: unknown, row: unknown) => {
        const r = row as any
        const recovery = String(r.payment_recovery_state || "").toLowerCase()
        const isPrescribedStatus = String(r.status || "").toLowerCase() === "prescribed"
        const remaining = Number.parseFloat(String(r.remaining_supplemental_amount || "0"))
        const hasRemaining = Number.isFinite(remaining) && remaining > 0
        const showRecoveryPending =
          isPrescribedStatus && (recovery === "recovery_pending" || hasRemaining)
        return (
          <div className="space-y-1">
            <div>{r.status_display}</div>
            {showRecoveryPending ? (
              <Badge className="bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-100">
                Recovery Pending
              </Badge>
            ) : null}
          </div>
        )
      },
    },
    { key: "payment_status", label: "Payment Status" },
    { key: "visit_status", label: "Visit Status" },
    {
      key: "amount",
      label: "Amount",
      render: (_value: unknown, row: unknown) => {
        const r = row as any
        const remaining = Number.parseFloat(String(r.remaining_supplemental_amount || "0"))
        const hasRemaining = Number.isFinite(remaining) && remaining > 0
        return (
          <div className="space-y-1">
            <div>{r.amount}</div>
            {hasRemaining ? (
              <div className="text-[11px] text-amber-700">Remaining ${remaining.toFixed(2)}</div>
            ) : null}
          </div>
        )
      },
    },
    { key: "created_at", label: "Order Date" },
  ], [handleOrderClick])

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
          "Payment Pending": "payment_pending",
          "Processing": "processing",
          "Visit Failed": "visit_failed",
          "Visit Pending": "visit_pending",
          "Consult Canceled": "consult_canceled",
          "Referred": "referred",
          "Prescribed": "prescribed",
          "Billing Pending": "billing_pending",
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

  // Format orders for display while preserving raw data for the detail drawer
  const formattedOrders = useMemo(() => {
    return orders
      .filter(order => {
        // Client-side payment status filter
        if (activePaymentStatusFilter !== "All") {
          const current = String(order.payment_status || "").toLowerCase()
          const wanted = activePaymentStatusFilter.toLowerCase()
          if (wanted === "paid") {
            return current === "paid" || current === "partially_paid"
          }
          return current === wanted
        }
        return true
      })
      .map(order => {
        const canonicalOrderNumber = order.order_id || order.display_id
        return {
        ...order,
        display_id: canonicalOrderNumber,
        order_id: order.order_id ?? null,
        // Keep raw values under _raw prefix for the drawer
        _raw_display_id: order.display_id,
        _raw_amount: order.amount,
        _raw_created_at: order.created_at,
        _raw_prescribed_at: order.prescribed_at,
        _raw_shipped_at: order.shipped_at,
        _raw_payment_status: order.payment_status,
        _raw_visit_status: order.visit_status || null,
        // Formatted display values
        amount: `$${order.amount.toFixed(2)}`,
        created_at: order.created_at ? format(new Date(order.created_at), 'MM/dd/yyyy') : '',
        prescribed_at: order.prescribed_at ? format(new Date(order.prescribed_at), 'MM/dd/yyyy') : '',
        shipped_at: order.shipped_at ? format(new Date(order.shipped_at), 'MM/dd/yyyy') : '',
        payment_status: formatPaymentStatusLabel(order.payment_status),
        visit_status: formatVisitStatusLabel(order.visit_status),
        payment_recovery_state: order.payment_recovery_state || null,
        remaining_supplemental_amount: order.remaining_supplemental_amount || null,
      }})
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
  }, [formattedOrders, orderColumns])

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
        loadingMessage="Loading orders"
        pagination={{
          currentPage: pagination.page,
          totalPages: pagination.total_pages,
          pageSize: pagination.page_size,
          totalCount: pagination.total_count,
          onPageChange: setPage,
          onPageSizeChange: (newPageSize) => setFilters({ page_size: newPageSize }),
        }}
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

      {/* Order Detail Drawer */}
      <OrderDetailDrawer
        order={selectedOrder}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onOrderUpdated={handleOrderUpdated}
      />
    </div>
  )
}
