import { useState, useMemo, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Eye, RotateCcw } from "lucide-react"
import { DateRange } from "react-day-picker"
import { ordersApi, Order, FilterOption } from "@/api/ordersApi"
import { exportToCSV, fetchAllPaginatedResults } from "@/utils/exportUtils"

const ORDER_STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Created", value: "created" },
  { label: "Payment Pending", value: "payment_pending" },
  { label: "Processing", value: "processing" },
  { label: "Visit Failed", value: "visit_failed" },
  { label: "Visit Pending", value: "visit_pending" },
  { label: "Consult Scheduled", value: "consult_scheduled" },
  { label: "Consult Rescheduled", value: "consult_rescheduled" },
  { label: "Consult Canceled", value: "consult_canceled" },
  { label: "No Show", value: "no_show" },
  { label: "Referred", value: "referred" },
  { label: "Prescribed", value: "prescribed" },
  { label: "Billing Pending", value: "billing_pending" },
  { label: "Rx Sent", value: "rx_sent" },
  { label: "Shipped", value: "shipped" },
  { label: "In Transit", value: "in_transit" },
  { label: "Out for Delivery", value: "out_for_delivery" },
  { label: "Delivered", value: "delivered" },
  { label: "Delivery Failed", value: "delivery_failed" },
  { label: "Canceled", value: "canceled" },
] as const

const PAYMENT_STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Paid", value: "paid" },
  { label: "Pending", value: "pending" },
  { label: "Failed", value: "failed" },
  { label: "Refunded", value: "refunded" },
] as const

const orderColumns = [
  { key: "order_id", label: "Order #", minWidth: "120px", className: "font-medium" },
  { key: "patient_name", label: "Patient", minWidth: "160px" },
  { key: "email", label: "Email", minWidth: "200px", headerClassName: "hidden lg:table-cell", className: "hidden lg:table-cell" },
  { key: "phone", label: "Phone", minWidth: "130px", headerClassName: "hidden xl:table-cell", className: "hidden xl:table-cell" },
  { key: "pharmacy_display", label: "Pharmacy", minWidth: "150px", headerClassName: "hidden xl:table-cell", className: "hidden xl:table-cell" },
  { key: "orderDate", label: "Order Date", minWidth: "120px" },
  { key: "datePrescribed", label: "Date Prescribed", minWidth: "130px", headerClassName: "hidden lg:table-cell", className: "hidden lg:table-cell" },
  { key: "paymentDate", label: "Payment Date", minWidth: "120px", headerClassName: "hidden xl:table-cell", className: "hidden xl:table-cell" },
  { key: "mrn", label: "MRN#", minWidth: "120px", headerClassName: "hidden xl:table-cell", className: "hidden xl:table-cell" },
  { key: "paymentStatus", label: "Payment Status", minWidth: "130px", headerClassName: "hidden lg:table-cell", className: "hidden lg:table-cell" },
  { key: "visitStatus", label: "Visit Status", minWidth: "120px", headerClassName: "hidden lg:table-cell", className: "hidden lg:table-cell" },
  { key: "orderStatus", label: "Order Status", minWidth: "150px" },
  { key: "orderTotal", label: "Order Total", minWidth: "110px" },
  { key: "tracking_number", label: "Tracking #", minWidth: "140px", headerClassName: "hidden xl:table-cell", className: "hidden xl:table-cell" },
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

const transformOrderForDisplay = (order: Order) => {
  const settlementOrder = order as Order & {
    payment_settlement_amount?: string | number | null
    payment_settlement_state?: string | null
    payment_settlement_basis?: string | null
    chargeable_amount_source?: string | null
    patient_name?: string | null
    patient_email?: string | null
    patient_phone?: string | null
  }
  const hasSettlementAmount =
    settlementOrder.payment_settlement_amount != null &&
    settlementOrder.payment_settlement_amount !== ""
  const shouldUsePrescribedAmount =
    hasSettlementAmount &&
    (
      String(settlementOrder.payment_settlement_state || "").toLowerCase() === "captured" ||
      String(settlementOrder.payment_settlement_basis || "").toLowerCase() === "prescribed" ||
      String(settlementOrder.chargeable_amount_source || "").toLowerCase() === "prescribed_medicine"
    )
  const orderTotal = shouldUsePrescribedAmount
    ? settlementOrder.payment_settlement_amount
    : (order.pricing?.grand_total || order.grand_total || order.payable_amount || order.orderTotal || order.amount || "0.00")

  return {
    ...order,
    order_number: order.order_id || order.display_id || "-",
    patient_name: order.patient?.full_name || settlementOrder.patient_name || order.name || order.email || "-",
    patient_email: settlementOrder.patient_email || order.email || "-",
    patient_phone: settlementOrder.patient_phone || order.phone || "-",
    product_name: order.product_name || "-",
    pharmacy_name_only: stripPharmacyAddress(order.pharmacy_name || order.pharmacy_display),
    orderDate: order.orderDate || order.created_at,
    orderStatus: order.orderStatus || order.status || "created",
    orderTotal,
  }
}

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [activePaymentStatusFilter, setActivePaymentStatusFilter] = useState("all")
  const [activeOrderStatusFilter, setActiveOrderStatusFilter] = useState("all")
  const [categoryId, setCategoryId] = useState("all")
  const [pharmacyId, setPharmacyId] = useState("all")
  const [categories, setCategories] = useState<FilterOption[]>([])
  const [pharmacies, setPharmacies] = useState<FilterOption[]>([])
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true)
  const [date, setDate] = useState<DateRange | undefined>()
  /** Remount DataTable so toolbar search input clears when filters reset */
  const [dataTableKey, setDataTableKey] = useState(0)
  const [orders, setOrders] = useState<Order[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Order Details Sheet state
  const navigate = useNavigate()

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim())
    }, 350)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  useEffect(() => {
    let mounted = true
    Promise.all([ordersApi.fetchCategories(), ordersApi.fetchPharmacies()]).then(
      ([categoriesData, pharmaciesData]) => {
        if (!mounted) return
        setCategories(categoriesData)
        setPharmacies(pharmaciesData)
        setFilterOptionsLoading(false)
      }
    )
    return () => { mounted = false }
  }, [])

  const displayOrders = useMemo(() => orders.map(transformOrderForDisplay), [orders])

  const filteredOrders = useMemo(() => displayOrders, [displayOrders])

  const hasActiveFilters = Boolean(
    activeOrderStatusFilter !== "all" ||
    activePaymentStatusFilter !== "all" ||
    categoryId !== "all" ||
    pharmacyId !== "all" ||
    searchTerm ||
    date?.from
  )

  const handleResetFilters = useCallback(() => {
    setActivePaymentStatusFilter("all")
    setActiveOrderStatusFilter("all")
    setCategoryId("all")
    setPharmacyId("all")
    setDate(undefined)
    setSearchTerm("")
    setDebouncedSearchTerm("")
    setCurrentPage(1)
    setDataTableKey((k) => k + 1)
  }, [])

  const getOrderParams = useCallback((page: number, requestedPageSize: number) => {
    const params: Record<string, string | number> = {
      page,
      page_size: requestedPageSize,
    }
    if (debouncedSearchTerm) params.search = debouncedSearchTerm
    if (activeOrderStatusFilter !== "all") params.status = activeOrderStatusFilter
    if (activePaymentStatusFilter !== "all") params.payment_status = activePaymentStatusFilter
    if (categoryId !== "all") params["product__category__id"] = categoryId
    if (pharmacyId !== "all") params["pharmacy__id"] = pharmacyId
    if (date?.from) params["created_at__gte"] = date.from.toISOString().slice(0, 10)
    if (date?.to) params["created_at__lte"] = date.to.toISOString().slice(0, 10)
    return params
  }, [
    debouncedSearchTerm,
    activeOrderStatusFilter,
    activePaymentStatusFilter,
    categoryId,
    pharmacyId,
    date,
  ])

  const loadOrders = useCallback(async () => {
    setIsLoadingOrders(true)
    setError(null)
    try {
      const data = await ordersApi.fetchOrders(getOrderParams(currentPage, pageSize))
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
    getOrderParams,
  ])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, activePaymentStatusFilter, activeOrderStatusFilter, categoryId, pharmacyId, date])

  const handleRefresh = useCallback(() => {
    loadOrders()
  }, [loadOrders])

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    setError(null)
    try {
      const allOrders = await fetchAllPaginatedResults((page, exportPageSize) =>
        ordersApi.fetchOrders(getOrderParams(page, exportPageSize))
      )
      exportToCSV(allOrders.map(transformOrderForDisplay), orderColumns, "orders_export")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export orders")
    } finally {
      setIsExporting(false)
    }
  }, [getOrderParams])

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

      <div className="flex items-end gap-3 flex-wrap">
        <div className="flex flex-col gap-1.5 min-w-[150px]">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Order Status</label>
          <Select value={activeOrderStatusFilter} onValueChange={setActiveOrderStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 min-w-[150px]">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Product Category</label>
          <Select value={categoryId} onValueChange={setCategoryId} disabled={filterOptionsLoading}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={String(c.id)} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 min-w-[150px]">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pharmacy</label>
          <Select value={pharmacyId} onValueChange={setPharmacyId} disabled={filterOptionsLoading}>
            <SelectTrigger>
              <SelectValue placeholder="All Pharmacies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pharmacies</SelectItem>
              {pharmacies.map((p) => (
                <SelectItem key={String(p.id)} value={String(p.id)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 min-w-[150px]">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Payment Status</label>
          <Select value={activePaymentStatusFilter} onValueChange={setActivePaymentStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Payment Statuses" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={handleResetFilters} className="gap-1">
            <RotateCcw className="h-3 w-3" />
            Reset Filters
          </Button>
        )}
      </div>

      <DataTable
        key={dataTableKey}
        data={filteredOrders}
        columns={orderColumns.map(col => {
          // Canonical order number (matches invoice/admin priority).
          if (col.key === 'order_id' || col.key === 'order_number') {
            return {
              ...col,
              render: (_: any, row: any) => {
                const detailId = row.id
                const orderLabel = row.order_number || row.order_id || '—'
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
                const isShipmentFinalized = originalStatus === 'shipped' || originalStatus === 'delivered' // Tracking should stay visible for delivered orders

                if (!isShipmentFinalized) {
                  return <span className="text-sm text-muted-foreground italic">N/A</span>
                }

                return (
                  <span className="text-sm font-medium">{row.tracking_number || '-'}</span>
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
        showResetFilters={false}
        dateRange={date}
        onDateRangeChange={setDate}
        onSearch={setSearchTerm}
        onResetFilters={handleResetFilters}
        onExport={handleExport}
        exportLoading={isExporting}
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
