import { useState, useMemo, useCallback, useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarDays, RotateCcw, TrendingUp, Download, RefreshCw, Grid3X3, Eye } from "lucide-react"
import { DateRange } from "react-day-picker"
import { isWithinInterval } from "date-fns"
import { format } from "date-fns"
import mockData from "@/data/mockData.json"
import { ordersApi, Order } from "@/api/ordersApi"
import { exportToCSV } from "@/utils/exportUtils"
import { OrderDetailsSheet } from "@/components/orders/OrderDetailsSheet"

// Helper function to parse date strings. Handles ISO timestamps and DD/MM/YYYY.
const parseDate = (dateString?: string | null) => {
  if (!dateString) return new Date()

  // If it's an ISO-like string with a 'T' or '-' assume Date can parse it
  if (dateString.includes('T') || /\d{4}-\d{2}-\d{2}/.test(dateString)) {
    const d = new Date(dateString)
    if (!isNaN(d.getTime())) return d
  }

  // Fallback: try DD/MM/YYYY format
  const parts = dateString.split('/')
  if (parts.length === 3) {
    const [day, month, year] = parts
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  }

  // Final fallback
  return new Date(dateString)
}

const formatDate = (dateString?: string | null) => {
  if (!dateString) return '-'
  const date = parseDate(dateString)
  return isNaN(date.getTime()) ? '-' : format(date, 'dd/MM/yyyy')
}

const orderColumns = [
  { key: "name", label: "Name", width: "150px" },
  { key: "email", label: "Email", width: "200px" },
  { key: "phone", label: "Phone", width: "130px" },
  { key: "pharmacy_display", label: "Pharmacy", width: "150px" },
  { key: "orderDate", label: "Order Date", width: "100px", render: (_: any, row: any) => formatDate(row.orderDate) },
  { key: "datePrescribed", label: "Date Prescribed", width: "100px", render: (_: any, row: any) => formatDate(row.datePrescribed) },
  { key: "datePrintedShipped", label: "Date Printed / Shipped", width: "100px", render: (_: any, row: any) => formatDate(row.datePrintedShipped) },
  { key: "paymentDate", label: "Payment Date", width: "100px", render: (_: any, row: any) => formatDate(row.paymentDate) },
  { key: "mrn", label: "MRN#", width: "120px" },
  { key: "paymentStatus", label: "Payment Status", width: "100px" },
  { key: "visitStatus", label: "Visit Status", width: "100px" },
  { key: "address", label: "Address", width: "150px" },
  { key: "orderStatus", label: "Order Status", width: "100px" },
  { key: "orderTotal", label: "Order Total", width: "100px" },
  { key: "tracking_number", label: "Tracking #", width: "100px" },
  { key: "actions", label: "Actions", width: "100px", render: (_: any, row: any) => null }
]

// Meaningful filters based on the orders data structure
const paymentStatusFilters = ["All", "Paid", "Pending", "Failed", "Refunded"]
const visitStatusFilters = ["All", "Scheduled", "Completed", "Missed", "Rescheduled"]

// Backend order status choices (value, label)
const ORDER_STATUS_CHOICES = [
  { value: 'created', label: 'Created' },
  { value: 'processing', label: 'Processing' },
  { value: 'visit_failed', label: 'Visit Failed' },
  { value: 'visit_pending', label: 'Visit Pending' },
  { value: 'consult_canceled', label: 'Consult Canceled' },
  { value: 'referred', label: 'Referred' },
  { value: 'prescribed', label: 'Prescribed' },
  { value: 'billing_pending', label: 'Billing Pending' },
  { value: 'rx_sent', label: 'Rx Sent' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'canceled', label: 'Canceled' },
]

// Additional filter buttons (keeping the original ones from your design)
const additionalFilters = [
  "Sort",
  "Product",
  "Pharmacies",
  "Pharmacy Status",
  "Extra Filters"
]



export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activePaymentStatusFilter, setActivePaymentStatusFilter] = useState("All")
  const [activeOrderStatusFilter, setActiveOrderStatusFilter] = useState("All")
  const [activeVisitStatusFilter, setActiveVisitStatusFilter] = useState("All")
  const [activeAdditionalFilters, setActiveAdditionalFilters] = useState<string[]>([])
  const [date, setDate] = useState<DateRange | undefined>()
  const [refreshKey, setRefreshKey] = useState(0)
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editedStatuses, setEditedStatuses] = useState<Record<string, string>>({})
  const [editedTrackingNumbers, setEditedTrackingNumbers] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  // Order Details Sheet state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Comprehensive filtering logic based on actual order data
  const filteredOrders = useMemo(() => {
    const lowerSearch = searchTerm.trim().toLowerCase()
    return orders.filter(order => {
      const matchesSearch = !lowerSearch ||
        (order.name ?? '').toLowerCase().includes(lowerSearch) ||
        (order.email ?? '').toLowerCase().includes(lowerSearch) ||
        (order.phone ?? '').includes(searchTerm) ||
        (order.mrn ?? '').toLowerCase().includes(lowerSearch) ||
        (order.pharmacy_display ?? '').toLowerCase().includes(lowerSearch)

      // Payment Status filter
      const matchesPaymentStatus = activePaymentStatusFilter === "All" || order.paymentStatus === activePaymentStatusFilter

      // Order Status filter
      const matchesOrderStatus = activeOrderStatusFilter === "All" || order.orderStatus === activeOrderStatusFilter

      // Visit Status filter
      const matchesVisitStatus = activeVisitStatusFilter === "All" || order.visitStatus === activeVisitStatusFilter

      // Date range filter based on orderDate
      let matchesDateRange = true
      if (date?.from || date?.to) {
        const orderDate = parseDate(order.orderDate as string)

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
  }, [orders, searchTerm, activePaymentStatusFilter, activeOrderStatusFilter, activeVisitStatusFilter, date, activeAdditionalFilters, refreshKey])

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
    // Order Status select (uses backend keys)
    {
      key: 'order-status',
      label: 'Order status',
      type: 'select' as const,
      options: [{ value: 'All', label: 'All' }, ...ORDER_STATUS_CHOICES],
      value: activeOrderStatusFilter === 'All' ? 'All' : activeOrderStatusFilter || undefined,
      onChange: (v: string) => setActiveOrderStatusFilter(v),
    },
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
    loadOrders()
  }, [])

  // Load orders from API
  const loadOrders = async () => {
    setIsLoadingOrders(true)
    setError(null)
    try {
      const data = await ordersApi.fetchOrders()
      setOrders(data.results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders')
      console.error('Error loading orders:', err)
    } finally {
      setIsLoadingOrders(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await ordersApi.deleteOrder(id)
      setSuccess('Order deleted')
      await loadOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete order')
      console.error('Delete order error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusChange = (id: string, value: string) => {
    setEditedStatuses(prev => ({ ...prev, [id]: value }))
  }

  const handleTrackingNumberChange = (id: string, value: string) => {
    setEditedTrackingNumbers(prev => ({ ...prev, [id]: value }))
  }

  const handleSaveOrder = async (id: string) => {
    const newStatus = editedStatuses[id]
    const newTrackingNumber = editedTrackingNumbers[id]

    if (newStatus == null && newTrackingNumber == null) return

    // Find the current order to get existing tracking number
    const currentOrder = orders.find(o => o.id === id)
    const existingTrackingNumber = currentOrder?.tracking_number

    // Validate: tracking number required when setting status to 'shipped'
    if (newStatus === 'shipped') {
      const trackingToUse = newTrackingNumber ?? existingTrackingNumber
      if (!trackingToUse || !trackingToUse.trim()) {
        setError('Tracking number is required when setting status to Shipped. Please enter a tracking number first.')
        return
      }
    }

    setSavingId(id)
    setError(null)
    setSuccess(null)
    try {
      const payload: Partial<Order> = {}
      if (newStatus != null) payload.status = newStatus
      if (newTrackingNumber != null) payload.tracking_number = newTrackingNumber

      await ordersApi.updateOrder(id, payload)
      setSuccess('Order updated')
      // clear local edited values for this row
      setEditedStatuses(prev => {
        const copy = { ...prev }
        delete copy[id]
        return copy
      })
      setEditedTrackingNumbers(prev => {
        const copy = { ...prev }
        delete copy[id]
        return copy
      })
      await loadOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order')
      console.error('Update order error:', err)
    } finally {
      setSavingId(null)
    }
  }


  const handleCreateOrder = async () => {
    const name = window.prompt('Patient name')
    if (!name) return
    const email = window.prompt('Email') || ''
    const amount = window.prompt('Amount (e.g. 49.00)') || '0.00'
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await ordersApi.createOrder({ name, email, amount })
      setSuccess('Order created')
      await loadOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order')
      console.error('Create order error:', err)
    } finally {
      setIsSaving(false)
    }
  }

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

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      <DataTable
        data={filteredOrders.map(o => ({ ...o }))}
        columns={orderColumns.map(col => {
          // Make the name column clickable to open order details
          if (col.key === 'name') {
            return {
              ...col,
              render: (_: any, row: any) => (
                <button
                  onClick={() => {
                    setSelectedOrder(row)
                    setSheetOpen(true)
                  }}
                  className="text-primary hover:underline font-medium text-left"
                >
                  {row.name || '-'}
                </button>
              ),
            }
          }

          if (col.key === 'actions') {
            return {
              ...col,
              render: (_: any, row: any) => (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedOrder(row)
                      setSheetOpen(true)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSaveOrder(row.id)}
                    disabled={
                      savingId === row.id ||
                      (!(editedStatuses[row.id] && editedStatuses[row.id] !== (row.orderStatus || '')) &&
                        !(editedTrackingNumbers[row.id] !== undefined && editedTrackingNumbers[row.id] !== (row.tracking_number || '')))
                    }
                  >
                    {savingId === row.id ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              ),
            }
          }

          if (col.key === 'orderStatus') {
            return {
              ...col,
              render: (_: any, row: any) => {
                const currentStatus = row.orderStatus ?? 'created'
                const isLocked = currentStatus === 'shipped' || currentStatus === 'canceled'

                return (
                  <div className="relative">
                    <Select
                      value={editedStatuses[row.id] ?? currentStatus}
                      onValueChange={(v) => handleStatusChange(row.id, v)}
                      disabled={isLocked}
                    >
                      <SelectTrigger className={`w-40 ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUS_CHOICES.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )
              },
            }
          }


          if (col.key === 'tracking_number') {
            return {
              ...col,
              render: (_: any, row: any) => {
                const originalStatus = row.orderStatus ?? 'created'
                const editedStatus = editedStatuses[row.id]
                const isAlreadyShipped = originalStatus === 'shipped'  // Already shipped in DB
                const isChangingToShipped = editedStatus === 'shipped' && !isAlreadyShipped  // User is changing TO shipped
                const showTrackingInput = isAlreadyShipped || isChangingToShipped

                if (!showTrackingInput) {
                  return <span className="text-sm text-muted-foreground italic">N/A</span>
                }

                // Already shipped - show as read-only
                if (isAlreadyShipped) {
                  return (
                    <span className="text-sm font-medium">{row.tracking_number || '-'}</span>
                  )
                }

                // Changing to shipped - show editable input
                return (
                  <input
                    type="text"
                    className="w-32 px-2 py-1 text-sm border rounded"
                    placeholder="Tracking # (required)"
                    value={editedTrackingNumbers[row.id] ?? (row.tracking_number ?? '')}
                    onChange={(e) => handleTrackingNumberChange(row.id, e.target.value)}
                  />
                )
              }
            }
          }


          return col
        })}
        searchPlaceholder="Search by Order#, affiliate order #, MRN#, patient name, phone number"
        showDatePicker={true}
        showExport={true}
        showResetFilters={false}
        // filters={filters}
        dateRange={date}
        onDateRangeChange={setDate}
        onSearch={setSearchTerm}
        onResetFilters={handleResetFilters}
        onExport={handleExport}
        onRefresh={handleRefresh}
        loading={isLoadingOrders || isSaving}
      />

      {/* Order Details Sheet */}
      <OrderDetailsSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        order={selectedOrder}
      />
    </div>
  )
}
