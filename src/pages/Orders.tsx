import { useState, useMemo, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, Grid3X3, Eye, RefreshCw, Calendar as CalendarIcon, Download, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { DateRange } from "react-day-picker"
import { ordersApi, Order } from "@/api/ordersApi"
import { exportToCSV } from "@/utils/exportUtils"
import { clientLabsApi } from "@/api/labs"
import { cn } from "@/lib/utils"

/** Match admin portal order status filter pills → API `status` param */
const ORDER_STATUS_FILTER_LABELS = [
  "All",
  "Created",
  "Payment Pending",
  "Processing",
  "Visit Failed",
  "Visit Pending",
  "Consult Scheduled",
  "Consult Rescheduled",
  "Consult Canceled",
  "No Show",
  "Referred",
  "Prescribed",
  "Billing Pending",
  "Rx Sent",
  "Shipped",
  "Canceled",
] as const

const ORDER_STATUS_TO_API: Record<string, string> = {
  Created: "created",
  "Payment Pending": "payment_pending",
  Processing: "processing",
  "Visit Failed": "visit_failed",
  "Visit Pending": "visit_pending",
  "Consult Scheduled": "consult_scheduled",
  "Consult Rescheduled": "consult_rescheduled",
  "Consult Canceled": "consult_canceled",
  "No Show": "no_show",
  Referred: "referred",
  Prescribed: "prescribed",
  "Billing Pending": "billing_pending",
  "Rx Sent": "rx_sent",
  Shipped: "shipped",
  Canceled: "canceled",
}

const PAYMENT_STATUS_FILTER_LABELS = ["All", "Paid", "Pending", "Failed"] as const

const orderColumns = [
  { key: "order_id", label: "Order #", minWidth: "120px", className: "font-medium" },
  { key: "patient_name", label: "Patient", minWidth: "160px", className: "max-w-[220px]" },
  { key: "email", label: "Email", minWidth: "200px", headerClassName: "hidden lg:table-cell", className: "hidden lg:table-cell max-w-[220px]" },
  { key: "phone", label: "Phone", minWidth: "130px", headerClassName: "hidden xl:table-cell", className: "hidden xl:table-cell max-w-[140px]" },
  { key: "pharmacy_display", label: "Pharmacy", minWidth: "150px", headerClassName: "hidden xl:table-cell", className: "hidden xl:table-cell max-w-[180px]" },
  { key: "orderDate", label: "Order Date", minWidth: "120px" },
  { key: "datePrescribed", label: "Date Prescribed", minWidth: "130px", headerClassName: "hidden lg:table-cell", className: "hidden lg:table-cell" },
  { key: "paymentDate", label: "Payment Date", minWidth: "120px", headerClassName: "hidden xl:table-cell", className: "hidden xl:table-cell" },
  { key: "mrn", label: "MRN#", minWidth: "120px", headerClassName: "hidden xl:table-cell", className: "hidden xl:table-cell" },
  { key: "paymentStatus", label: "Payment Status", minWidth: "130px", headerClassName: "hidden lg:table-cell", className: "hidden lg:table-cell" },
  { key: "visitStatus", label: "Visit Status", minWidth: "120px", headerClassName: "hidden lg:table-cell", className: "hidden lg:table-cell" },
  { key: "orderStatus", label: "Order Status", minWidth: "150px" },
  { key: "orderTotal", label: "Order Total", minWidth: "110px" },
  { key: "tracking_number", label: "Tracking #", minWidth: "140px", headerClassName: "hidden xl:table-cell", className: "hidden xl:table-cell max-w-[160px]" },
  { key: "actions", label: "Actions", minWidth: "110px", render: (_: any, row: any) => null }
]

// Backend order status choices for row editor (value, label) — aligned with Order.ORDER_STATUS_CHOICES
const ORDER_STATUS_CHOICES = [
  { value: "created", label: "Created" },
  { value: "payment_pending", label: "Payment Pending" },
  { value: "processing", label: "Processing" },
  { value: "visit_failed", label: "Visit Failed" },
  { value: "visit_pending", label: "Visit Pending" },
  { value: "consult_scheduled", label: "Consult Scheduled" },
  { value: "consult_rescheduled", label: "Consult Rescheduled" },
  { value: "consult_canceled", label: "Consult Canceled" },
  { value: "no_show", label: "No Show" },
  { value: "referred", label: "Referred" },
  { value: "prescribed", label: "Prescribed" },
  { value: "billing_pending", label: "Billing Pending" },
  { value: "rx_sent", label: "Rx Sent" },
  { value: "shipped", label: "Shipped" },
  { value: "canceled", label: "Canceled" },
]

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

const formatDateLabel = (dateString?: string | null) => {
  if (!dateString) return "-"
  const date = parseDate(dateString)
  if (isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })
}

const parseMoney = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null
  const n = Number.parseFloat(String(value))
  return Number.isFinite(n) ? n : null
}

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [activePaymentStatusFilter, setActivePaymentStatusFilter] = useState("All")
  const [activeOrderStatusFilter, setActiveOrderStatusFilter] = useState("All")
  const [date, setDate] = useState<DateRange | undefined>()
  /** Remount DataTable so toolbar search input clears when filters reset */
  const [dataTableKey, setDataTableKey] = useState(0)
  const [activeTab, setActiveTab] = useState<"all" | "rx" | "lab">("all")
  const [orders, setOrders] = useState<Order[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editedStatuses, setEditedStatuses] = useState<Record<string, string>>({})
  const [editedTrackingNumbers, setEditedTrackingNumbers] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  const [labOrderStatusFilter, setLabOrderStatusFilter] = useState("All")
  const [labPaymentStatusFilter, setLabPaymentStatusFilter] = useState("All")
  const [labVisitStateFilter, setLabVisitStateFilter] = useState("All")
  const [labFulfillmentFilter, setLabFulfillmentFilter] = useState("All")
  const [labSearchTerm, setLabSearchTerm] = useState("")

  const handleResetLabFilters = () => {
    setLabOrderStatusFilter("All")
    setLabPaymentStatusFilter("All")
    setLabVisitStateFilter("All")
    setLabFulfillmentFilter("All")
    setLabSearchTerm("")
  }

  const filteredLabOrders = useMemo(() => {
    const mockOrders = clientLabsApi.getLabOrders()
    return mockOrders.filter((mo) => {
      // Search term
      if (labSearchTerm) {
        const s = labSearchTerm.toLowerCase()
        const matchesName = mo.patient_name.toLowerCase().includes(s)
        const matchesEmail = mo.patient_email.toLowerCase().includes(s)
        const matchesId = mo.id.toLowerCase().includes(s)
        const matchesProd = mo.product_name.toLowerCase().includes(s)
        const matchesPhone = mo.patient_phone.toLowerCase().includes(s)
        if (!matchesName && !matchesEmail && !matchesId && !matchesProd && !matchesPhone) {
          return false
        }
      }
      // Order status
      if (labOrderStatusFilter !== "All") {
        if (mo.status.toLowerCase() !== labOrderStatusFilter.toLowerCase()) {
          return false
        }
      }
      // Payment status
      if (labPaymentStatusFilter !== "All") {
        if (mo.payment_status.toLowerCase() !== labPaymentStatusFilter.toLowerCase()) {
          return false
        }
      }
      // Visit state
      if (labVisitStateFilter !== "All") {
        if (labVisitStateFilter === "Prescribed" && mo.status !== "Completed" && mo.status !== "In Process") {
          return false
        }
      }
      // Fulfillment status
      if (labFulfillmentFilter !== "All") {
        const actualFulfillment = mo.resultsReady ? "Results Ready" : "At Lab"
        if (actualFulfillment.toLowerCase() !== labFulfillmentFilter.toLowerCase()) {
          return false
        }
      }
      return true
    })
  }, [labSearchTerm, labOrderStatusFilter, labPaymentStatusFilter, labVisitStateFilter, labFulfillmentFilter])

  // Order Details Sheet state
  const navigate = useNavigate()

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim())
    }, 350)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (activeTab === "rx") {
        if (order.visitStatus === "Lab" || (order as any).is_lab) {
          return false
        }
      } else if (activeTab === "lab") {
        if (order.visitStatus !== "Lab" && !(order as any).is_lab) {
          return false
        }
      }
      return true
    })
  }, [orders, activeTab])

  // Same pill layout as admin portal: Order Status group, then Payment Status group
  const filters = useMemo(
    () => [
      ...ORDER_STATUS_FILTER_LABELS.map((status) => ({
        key: `order-${status}`,
        label: status === "All" ? "Order Status" : status,
        type: "button" as const,
        value: activeOrderStatusFilter === status ? status : undefined,
        onClick: () => setActiveOrderStatusFilter(status),
      })),
      ...PAYMENT_STATUS_FILTER_LABELS.map((status) => ({
        key: `payment-${status}`,
        label: status === "All" ? "Payment Status" : status,
        type: "button" as const,
        value: activePaymentStatusFilter === status ? status : undefined,
        onClick: () => setActivePaymentStatusFilter(status),
      })),
    ],
    [activeOrderStatusFilter, activePaymentStatusFilter]
  )

  const handleResetFilters = useCallback(() => {
    setActivePaymentStatusFilter("All")
    setActiveOrderStatusFilter("All")
    setDate(undefined)
    setSearchTerm("")
    setDebouncedSearchTerm("")
    setCurrentPage(1)
    setDataTableKey((k) => k + 1)
  }, [])

  const normalizePaymentStatus = (status: string) => {
    if (status === "All") return undefined
    return status.toLowerCase()
  }

  const loadOrders = useCallback(async () => {
    setIsLoadingOrders(true)
    setError(null)
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        page_size: pageSize,
      }
      if (debouncedSearchTerm) params.search = debouncedSearchTerm
      if (activeOrderStatusFilter !== "All") {
        const apiStatus = ORDER_STATUS_TO_API[activeOrderStatusFilter]
        if (apiStatus) params.status = apiStatus
      }
      const paymentStatus = normalizePaymentStatus(activePaymentStatusFilter)
      // Backend maps captured/approved → "paid" (same as admin dashboard), not raw NMI status
      if (paymentStatus) params.payment_status = paymentStatus
      if (date?.from) params["created_at__gte"] = date.from.toISOString().slice(0, 10)
      if (date?.to) params["created_at__lte"] = date.to.toISOString().slice(0, 10)

      const data = await ordersApi.fetchOrders(params)
      const mockLabOrders = clientLabsApi.getLabOrders()

      // Filter mock orders based on the search/status/payment/date params
      const filteredMockLabOrders = mockLabOrders.filter((mo) => {
        if (debouncedSearchTerm) {
          const s = debouncedSearchTerm.toLowerCase()
          const matchesName = mo.patient_name.toLowerCase().includes(s)
          const matchesEmail = mo.patient_email.toLowerCase().includes(s)
          const matchesId = mo.id.toLowerCase().includes(s)
          const matchesProd = mo.product_name.toLowerCase().includes(s)
          if (!matchesName && !matchesEmail && !matchesId && !matchesProd) {
            return false
          }
        }
        if (activeOrderStatusFilter !== "All") {
          const apiStatus = ORDER_STATUS_TO_API[activeOrderStatusFilter]
          const mappedStatus = mo.status.toLowerCase().replace(" ", "_")
          if (mappedStatus !== apiStatus) {
            return false
          }
        }
        const paymentStatus = normalizePaymentStatus(activePaymentStatusFilter)
        if (paymentStatus) {
          if (mo.payment_status.toLowerCase() !== paymentStatus) {
            return false
          }
        }
        if (date?.from || date?.to) {
          const orderedDateStr = mo.timeline.ordered
          if (orderedDateStr) {
            const orderedDate = new Date(orderedDateStr)
            if (date.from && orderedDate < date.from) return false
            if (date.to && orderedDate > date.to) return false
          }
        }
        return true
      })

      const apiOrders = data.results || []
      const mergedOrders = [...apiOrders]

      filteredMockLabOrders.forEach((mockOrd) => {
        if (!mergedOrders.some((o) => o.id === mockOrd.id)) {
          mergedOrders.push({
            id: mockOrd.id,
            display_id: mockOrd.id,
            order_id: mockOrd.id,
            name: mockOrd.patient_name,
            patient: {
              id: `p-${mockOrd.id}`,
              full_name: mockOrd.patient_name,
            },
            email: mockOrd.patient_email,
            phone: mockOrd.patient_phone,
            product_name: mockOrd.product_name,
            pharmacy_display: mockOrd.lab_provider,
            orderDate: mockOrd.timeline.ordered,
            paymentStatus: mockOrd.payment_status.toLowerCase(),
            visitStatus: "Lab",
            orderStatus: mockOrd.status.toLowerCase().replace(" ", "_"),
            orderTotal: mockOrd.price.toString(),
            is_lab: true,
            timeline: mockOrd.timeline,
            resultsReady: mockOrd.resultsReady,
            resultsReleased: mockOrd.resultsReleased || false,
            releasedAt: mockOrd.releasedAt || null,
            releasedBy: mockOrd.releasedBy || null,
            biomarkers: mockOrd.biomarkers,
          } as any)
        }
      })

      setOrders(mergedOrders)
      setTotalCount(data.count ?? mergedOrders.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders')
      console.error('Error loading orders:', err)
    } finally {
      setIsLoadingOrders(false)
    }
  }, [
    currentPage,
    pageSize,
    debouncedSearchTerm,
    activeOrderStatusFilter,
    activePaymentStatusFilter,
    date,
  ])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, activePaymentStatusFilter, activeOrderStatusFilter, date, activeTab])

  const handleRefresh = useCallback(() => {
    loadOrders()
  }, [loadOrders])

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
            <span>All Orders</span>
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

      {/* Horizontal Tabs for All, Rx, and Lab Orders */}
      <div className="border-b border-border mb-6 pb-4">
        <div className="flex gap-3 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-4 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-all shadow-sm",
              activeTab === "all"
                ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50"
                : "bg-white text-slate-650 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-850"
            )}
          >
            All orders
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rx")}
            className={cn(
              "px-4 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-all shadow-sm",
              activeTab === "rx"
                ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50"
                : "bg-white text-slate-650 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-850"
            )}
          >
            Rx orders
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("lab")}
            className={cn(
              "px-4 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-all shadow-sm",
              activeTab === "lab"
                ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50"
                : "bg-white text-slate-650 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-850"
            )}
          >
            Lab orders
          </button>
        </div>
      </div>

      {activeTab === "lab" && (
        <div className="space-y-6">
          {/* Custom Search & Filters Panel */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm space-y-4">
            {/* Row 1: Select Dropdowns & Reset Button */}
            <div className="flex flex-wrap gap-3 items-center">
              <Select
                value={labOrderStatusFilter}
                onValueChange={setLabOrderStatusFilter}
              >
                <SelectTrigger className="w-[180px] bg-white dark:bg-gray-950 border-gray-200 text-gray-700 dark:text-gray-200">
                  <SelectValue placeholder="All order statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All order statuses</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="In Process">In Process</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={labPaymentStatusFilter}
                onValueChange={setLabPaymentStatusFilter}
              >
                <SelectTrigger className="w-[180px] bg-white dark:bg-gray-950 border-gray-200 text-gray-700 dark:text-gray-200">
                  <SelectValue placeholder="All payments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All payments</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={labVisitStateFilter}
                onValueChange={setLabVisitStateFilter}
              >
                <SelectTrigger className="w-[180px] bg-white dark:bg-gray-950 border-gray-200 text-gray-700 dark:text-gray-200">
                  <SelectValue placeholder="All visit states" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All visit states</SelectItem>
                  <SelectItem value="Prescribed">Prescribed</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={labFulfillmentFilter}
                onValueChange={setLabFulfillmentFilter}
              >
                <SelectTrigger className="w-[180px] bg-white dark:bg-gray-950 border-gray-200 text-gray-700 dark:text-gray-200">
                  <SelectValue placeholder="All fulfillment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All fulfillment</SelectItem>
                  <SelectItem value="Results Ready">Results Ready</SelectItem>
                  <SelectItem value="At Lab">At Lab</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleResetLabFilters}
                className="gap-1 text-xs text-gray-650 hover:text-gray-800 border-gray-200 h-9"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Reset
              </Button>
            </div>

            {/* Row 2: Search Input & Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by order number, patient name, email, or phone"
                  value={labSearchTerm}
                  onChange={(e) => setLabSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-white dark:bg-gray-950 border-gray-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2 text-xs h-9">
                  <CalendarIcon className="h-4 w-4 text-slate-400" />
                  Pick a date range
                </Button>
                <Button variant="outline" size="sm" className="gap-2 text-xs h-9">
                  <Download className="h-4 w-4 text-slate-400" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Custom Lab Orders Table */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
              <table className="w-full text-left text-sm border-collapse min-w-max table-auto">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-3">Order #</th>
                    <th className="px-3 py-3">Patient</th>
                    <th className="px-3 py-3">Email</th>
                    <th className="px-3 py-3">Phone</th>
                    <th className="px-3 py-3">Product</th>
                    <th className="px-3 py-3">Pharmacy / Lab</th>
                    <th className="px-3 py-3">Order Status</th>
                    <th className="px-3 py-3">Payment</th>
                    <th className="px-3 py-3">Visit</th>
                    <th className="px-3 py-3">Fulfillment</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                  {filteredLabOrders.length > 0 ? (
                    filteredLabOrders.map((row) => {
                      const isCompleted = row.status === "Completed"
                      const actualFulfillment = row.resultsReady ? "Results Ready" : "At Lab"
                      const formattedDate = new Date(row.timeline.ordered).toLocaleDateString("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      })
                      
                      return (
                        <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent dark:hover:from-gray-800/50 dark:hover:to-transparent transition-all duration-200 group">
                          <td className="px-3 py-4">
                            <button
                              type="button"
                              onClick={() => navigate(`/dashboard/orders/details/${row.id}`)}
                              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold text-left text-xs sm:text-sm whitespace-nowrap"
                            >
                              {row.id}
                            </button>
                          </td>
                          <td className="px-3 py-4 font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap text-xs sm:text-sm">
                            {row.patient_name}
                          </td>
                          <td className="px-3 py-4 text-gray-550 dark:text-gray-400 text-xs sm:text-sm">
                            {row.patient_email}
                          </td>
                          <td className="px-3 py-4 text-gray-550 dark:text-gray-400 text-xs sm:text-sm whitespace-nowrap">
                            {row.patient_phone}
                          </td>
                          <td className="px-3 py-4">
                            <div className="flex flex-col min-w-[180px]">
                              <span className="font-semibold text-gray-900 dark:text-gray-100 text-xs sm:text-sm">{row.product_name}</span>
                              <div>
                                <span className="bg-teal-50 text-teal-600 border border-teal-100 px-2 py-0.5 rounded text-[10px] font-semibold mt-1 inline-block dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900/40">
                                  Lab
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4 text-gray-700 dark:text-gray-300 font-medium text-xs sm:text-sm whitespace-nowrap">
                            {row.lab_provider}
                          </td>
                          <td className="px-3 py-4">
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap",
                              isCompleted
                                ? "bg-green-50 text-green-700 border-green-100 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900/40"
                                : "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40"
                            )}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-3 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900/40 whitespace-nowrap">
                              Paid
                            </span>
                          </td>
                          <td className="px-3 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900/40 whitespace-nowrap">
                              Prescribed
                            </span>
                          </td>
                          <td className="px-3 py-4">
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap",
                              row.resultsReady
                                ? "bg-green-50 text-green-700 border-green-100 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900/40"
                                : "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40"
                            )}>
                              {actualFulfillment}
                            </span>
                          </td>
                          <td className="px-3 py-4 font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm whitespace-nowrap">
                            ${row.price.toFixed(2)}
                          </td>
                          <td className="px-3 py-4 text-gray-550 dark:text-gray-400 text-xs sm:text-sm whitespace-nowrap">
                            {formattedDate}
                          </td>
                          <td className="px-3 py-4 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/dashboard/orders/details/${row.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={13} className="px-3 py-8 text-center text-slate-500">
                        No lab orders found matching filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination / Table Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Showing {filteredLabOrders.length} of {filteredLabOrders.length} orders
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            </div>
          </div>
      )}

      {activeTab !== "lab" && (
        <DataTable
          key={dataTableKey}
          data={filteredOrders.map(o => {
            const paymentSettlementAmount = (o as Order & { payment_settlement_amount?: string | number | null }).payment_settlement_amount
            const settlementState = String((o as Order & { payment_settlement_state?: string | null }).payment_settlement_state || "").toLowerCase()
            const settlementBasis = String((o as Order & { payment_settlement_basis?: string | null }).payment_settlement_basis || "").toLowerCase()
            const amountSource = String((o as Order & { chargeable_amount_source?: string | null }).chargeable_amount_source || "").toLowerCase()
            const hasSettlementAmount = paymentSettlementAmount != null && paymentSettlementAmount !== ""
            const shouldUsePrescribedAmount =
              hasSettlementAmount &&
              (
                settlementState === "captured" ||
                settlementBasis === "prescribed" ||
                amountSource === "prescribed_medicine"
              )

            return {
              ...o,
              patient_name: o.patient?.full_name || o.name || o.email || '-',
              orderTotal: shouldUsePrescribedAmount
                ? paymentSettlementAmount
                : (o.pricing?.grand_total || o.grand_total || o.payable_amount || o.orderTotal || o.amount || '0.00'),
            }
          })}
          columns={orderColumns.map(col => {
            // Canonical order number (matches invoice/admin priority).
            if (col.key === 'order_id') {
              return {
                ...col,
                render: (_: any, row: any) => {
                  const detailId = row.id
                  const orderLabel = row.order_id ?? row.display_id ?? '—'
                  if (!detailId) {
                    return <span className="text-sm font-medium">{orderLabel}</span>
                  }
                  return (
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/orders/details/${detailId}`)}
                      className="text-primary hover:underline font-medium text-left"
                    >
                      {orderLabel}
                    </button>
                  )
                },
              }
            }

            // Make the patient column clickable to open patient detail page
            if (col.key === 'patient_name') {
              return {
                ...col,
                render: (_: any, row: any) => {
                  const patientId = row.patient?.id
                  if (!patientId) {
                    return <span className="text-sm font-medium">{row.patient_name || '-'}</span>
                  }
                  return (
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/patients/${patientId}`)}
                      className="text-primary hover:underline font-medium text-left"
                    >
                      {row.patient_name || '-'}
                    </button>
                  )
                },
              }
            }

            if (col.key === 'actions') {
              return {
                ...col,
                render: (_: any, row: any) => {
                  const detailId = row.id
                  return (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => detailId && navigate(`/dashboard/orders/details/${detailId}`)}
                        disabled={!detailId}
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
                  )
                },
              }
            }

            if (['orderDate', 'datePrescribed', 'paymentDate'].includes(col.key)) {
              return {
                ...col,
                render: (_: any, row: any) => formatDateLabel(row[col.key]),
              }
            }

            if (col.key === 'orderStatus') {
              return {
                ...col,
                render: (_: any, row: any) => {
                  const currentStatus = row.orderStatus ?? 'created'
                  const isLocked = currentStatus === 'shipped' || currentStatus === 'canceled'
                  const isPrescribedStatus = String(currentStatus || "").toLowerCase() === "prescribed"
                  const recoveryState = String(row.payment_recovery_state || "").toLowerCase()
                  const remaining = parseMoney(row.remaining_supplemental_amount)
                  const hasRecoveryPending =
                    isPrescribedStatus &&
                    (
                      recoveryState === "recovery_pending" ||
                      (remaining != null && remaining > 0)
                    )

                  return (
                    <div className="relative space-y-1">
                      <Select
                        value={editedStatuses[row.id] ?? currentStatus}
                        onValueChange={(v) => handleStatusChange(row.id, v)}
                        disabled={isLocked}
                      >
                        <SelectTrigger className={`w-44 ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}>
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
                      {hasRecoveryPending ? (
                        <Badge className="bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-100">
                          Recovery Pending
                        </Badge>
                      ) : null}
                    </div>
                  )
                },
              }
            }

            if (col.key === 'orderTotal') {
              return {
                ...col,
                render: (_: any, row: any) => {
                  const remaining = parseMoney(row.remaining_supplemental_amount)
                  const hasRemaining = remaining != null && remaining > 0
                  return (
                    <div className="space-y-1">
                      <div>{row.orderTotal || '0.00'}</div>
                      {hasRemaining ? (
                        <div className="text-[11px] text-amber-700">Remaining ${remaining.toFixed(2)}</div>
                      ) : null}
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
          searchPlaceholder="Search by Order ID, Order#, affiliate order #, MRN#, patient name, phone number"
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
          pagination={{
            currentPage,
            totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
            pageSize,
            totalCount,
            onPageChange: setCurrentPage,
            onPageSizeChange: (nextSize) => {
              setPageSize(nextSize)
              setCurrentPage(1)
            },
          }}
          loading={isLoadingOrders || isSaving}
        />
      )}
    </div>
  )
}
