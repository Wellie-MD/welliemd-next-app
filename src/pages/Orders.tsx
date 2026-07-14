import { useState, useMemo, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye } from "lucide-react"
import { DateRange } from "react-day-picker"
import { ordersApi, Order } from "@/api/ordersApi"
import { exportToCSV } from "@/utils/exportUtils"

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
  "In Fulfillment",
  "Shipped",
  "In Transit",
  "Out for Delivery",
  "Delivered",
  "Delivery Failed",
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
  "In Fulfillment": "in_fulfillment",
  Shipped: "shipped",
  "In Transit": "in_transit",
  "Out for Delivery": "out_for_delivery",
  Delivered: "delivered",
  "Delivery Failed": "delivery_failed",
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
  { value: "in_fulfillment", label: "In Fulfillment" },
  { value: "shipped", label: "Shipped" },
  { value: "in_transit", label: "In Transit" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "delivery_failed", label: "Delivery Failed" },
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

const stripPharmacyAddress = (value?: string | null) => {
  if (!value) return "-"
  const trimmed = value.trim()
  if (!trimmed) return "-"

  const addressPattern = /\b(?:\d{3,}|street|st\.?|avenue|ave\.?|road|rd\.?|boulevard|blvd\.?|drive|dr\.?|lane|ln\.?|suite|ste\.?|city|state|zip)\b/i
  const separators = [" - ", " | ", " · "]
  for (const separator of separators) {
    const [first, ...rest] = trimmed.split(separator)
    if (first && rest.length > 0 && rest.some((part) => addressPattern.test(part))) {
      return first.trim()
    }
  }

  const commaParts = trimmed.split(",").map((part) => part.trim()).filter(Boolean)
  if (commaParts.length > 1 && commaParts.slice(1).some((part) => addressPattern.test(part))) {
    return commaParts[0]
  }

  return trimmed
}

const formatMoneyLabel = (value: unknown) => {
  const amount = parseMoney(value)
  if (amount == null) return "0.00"
  return `$${amount.toFixed(2)}`
}

const formatStatusLabel = (value?: string | null) => {
  if (!value) return "-"
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [activePaymentStatusFilter, setActivePaymentStatusFilter] = useState("All")
  const [activeOrderStatusFilter, setActiveOrderStatusFilter] = useState("All")
  const [date, setDate] = useState<DateRange | undefined>()
  /** Remount DataTable so toolbar search input clears when filters reset */
  const [dataTableKey, setDataTableKey] = useState(0)
  const [orders, setOrders] = useState<Order[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Order Details Sheet state
  const navigate = useNavigate()

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim())
    }, 350)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  const displayOrders = useMemo(() => orders.map(o => {
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
    const rawTotal = shouldUsePrescribedAmount
      ? paymentSettlementAmount
      : (o.pricing?.grand_total || o.grand_total || o.payable_amount || o.orderTotal || o.amount || '0.00')

    return {
      ...o,
      order_number: o.order_id || o.display_id || "-",
      patient_name: o.patient?.full_name || (o as Order & { patient_name?: string | null }).patient_name || o.name || o.email || '-',
      patient_email: (o as Order & { patient_email?: string | null }).patient_email || o.email || '-',
      patient_phone: (o as Order & { patient_phone?: string | null }).patient_phone || o.phone || '-',
      product_name: o.product_name || '-',
      pharmacy_name_only: stripPharmacyAddress(o.pharmacy_name || o.pharmacy_display),
      orderDate: o.orderDate || o.created_at,
      orderStatus: o.orderStatus || o.status || 'created',
      orderTotal: rawTotal,
    }
  }), [orders])

  const filteredOrders = useMemo(() => displayOrders, [displayOrders])

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
      setOrders(data.results)
      setTotalCount(data.count ?? data.results.length)
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
  }, [debouncedSearchTerm, activePaymentStatusFilter, activeOrderStatusFilter, date])

  const handleRefresh = useCallback(() => {
    loadOrders()
  }, [loadOrders])

  const handleExport = useCallback(() => {
    exportToCSV(filteredOrders, orderColumns, 'orders_export')
  }, [filteredOrders])

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
      </div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      <DataTable
        key={dataTableKey}
        data={filteredOrders}
        columns={orderColumns.map(col => {
          // Canonical order number (matches invoice/admin priority).
          if (col.key === 'order_number') {
            return {
              ...col,
              render: (_: any, row: any) => {
                const detailId = row.id
                const orderLabel = row.order_number || '—'
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
                    className="text-primary hover:underline font-medium text-left break-words"
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
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => detailId && navigate(`/dashboard/orders/details/${detailId}`)}
                      disabled={!detailId}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                )
              },
            }
          }

          if (col.key === 'orderDate') {
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
                    <Badge variant="outline" className="max-w-full whitespace-normal text-left">
                      {row.status_display || formatStatusLabel(currentStatus)}
                    </Badge>
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
                    <div>{formatMoneyLabel(row.orderTotal)}</div>
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
                const isShipmentFinalized = originalStatus === 'shipped' || originalStatus === 'delivered' // Tracking should stay visible for delivered orders
                const isChangingToShipped = editedStatus === 'shipped' && !isShipmentFinalized // User is changing TO shipped
                const showTrackingInput = isShipmentFinalized || isChangingToShipped

                if (!showTrackingInput) {
                  return <span className="text-sm text-muted-foreground italic">N/A</span>
                }

                // Already shipped/delivered - show as read-only
                if (isShipmentFinalized) {
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
        fitToWidth={true}
        searchPlaceholder="Search by order number, patient name, email, or phone"
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
        loading={isLoadingOrders}
      />
    </div>
  )
}
