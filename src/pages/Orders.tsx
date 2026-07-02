import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { ordersApi, Order, FilterOption } from "@/api/ordersApi"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { exportToCSV } from "@/utils/exportUtils"
import { ChevronLeft, ChevronRight, Eye, RotateCcw, Calendar, Download, Search, X } from "lucide-react"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarUI } from "@/components/ui/calendar"

const ORDER_STATUSES = [
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
  All: "",
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

const PAYMENT_STATUSES = ["All", "Paid", "Pending", "Failed", "Refunded"]

const parseMoney = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null
  const n = Number.parseFloat(String(value))
  return Number.isFinite(n) ? n : null
}

const formatMoney = (value: unknown) => {
  const amount = parseMoney(value)
  if (amount == null) return "0.00"
  return `$${amount.toFixed(2)}`
}

const formatDate = (dateString?: string | null) => {
  if (!dateString) return "-"
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return "-"
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
}

const formatStatus = (value?: string | null) => {
  if (!value) return "-"
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

const statusBadgeClass = (s: string) => {
  const lower = s.toLowerCase().replace(/_/g, " ")
  if (["prescribed", "shipped", "rx sent"].includes(lower)) return "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 border-green-300 dark:border-green-800"
  if (["payment pending", "billing pending", "pending", "visit pending", "consult scheduled", "consult rescheduled", "processing"].includes(lower)) return "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800"
  return "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600"
}

const columns = [
  { key: "order_number", label: "Order #", minWidth: "140px" },
  { key: "patient_name", label: "Patient Name", minWidth: "160px" },
  { key: "patient_email", label: "Patient Email", minWidth: "200px" },
  { key: "patient_phone", label: "Patient Phone", minWidth: "140px" },
  { key: "product_name", label: "Product Name", minWidth: "220px" },
  { key: "pharmacy_name", label: "Pharmacy Name", minWidth: "160px" },
  { key: "order_date", label: "Order Date", minWidth: "120px" },
  { key: "amount", label: "Order Amount", minWidth: "120px" },
  { key: "status", label: "Order Status", minWidth: "140px" },
  { key: "actions", label: "Actions", minWidth: "60px" },
]

export default function Orders() {
  const navigate = useNavigate()

  const [orders, setOrders] = useState<Order[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [orderStatus, setOrderStatus] = useState("All")
  const [categoryId, setCategoryId] = useState("all")
  const [pharmacyId, setPharmacyId] = useState("all")
  const [paymentStatus, setPaymentStatus] = useState("All")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const [categories, setCategories] = useState<FilterOption[]>([])
  const [pharmacies, setPharmacies] = useState<FilterOption[]>([])
  const filterOptionsLoadedRef = useRef(false)

  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(timeout)
  }, [search])

  const hasActiveFilters = orderStatus !== "All" || categoryId !== "all" || pharmacyId !== "all" || paymentStatus !== "All" || debouncedSearch || dateRange?.from || dateRange?.to

  const displayOrders = useMemo(() => orders.map((o) => ({
    ...o,
    order_number: o.order_id || o.display_id || "-",
    patient_name: o.patient?.full_name || (o as any).patient_name || o.name || o.email || "-",
    patient_email: (o as any).patient_email || o.email || "-",
    patient_phone: (o as any).patient_phone || o.phone || "-",
    product_name: o.product_name || "-",
    pharmacy_name: o.pharmacy_name || o.pharmacy_display || "-",
    order_date: o.created_at,
    amount: o.pricing?.grand_total || o.grand_total || o.payable_amount || o.amount || "0.00",
    status: o.status || "created",
  })), [orders])

  const loadOrders = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (!filterOptionsLoadedRef.current) {
        const [cats, pharms] = await Promise.all([
          ordersApi.fetchCategories(),
          ordersApi.fetchPharmacies(),
        ])
        if (cats.length > 0) setCategories(cats)
        if (pharms.length > 0) setPharmacies(pharms)
        if (cats.length > 0 || pharms.length > 0) filterOptionsLoadedRef.current = true
      }

      const params: Record<string, string | number> = {
        page: currentPage,
        page_size: pageSize,
      }
      if (debouncedSearch) params.search = debouncedSearch
      if (orderStatus !== "All") {
        const apiStatus = ORDER_STATUS_TO_API[orderStatus]
        if (apiStatus) params.status = apiStatus
      }
      if (categoryId !== "all") params["product__category__id"] = categoryId
      if (pharmacyId !== "all") params["pharmacy__id"] = pharmacyId
      if (paymentStatus !== "All") params.payment_status = paymentStatus.toLowerCase()
      if (dateRange?.from) {
        const startDate = new Date(dateRange.from)
        startDate.setHours(0, 0, 0, 0)
        params["created_at__gte"] = startDate.toISOString()

        const endDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from)
        endDate.setHours(23, 59, 59, 999)
        params["created_at__lte"] = endDate.toISOString()
      }

      const data = await ordersApi.fetchOrders(params)
      setOrders(data.results)
      setTotalCount(data.count ?? data.results.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders")
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, debouncedSearch, orderStatus, categoryId, pharmacyId, paymentStatus, dateRange])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, orderStatus, categoryId, pharmacyId, paymentStatus, dateRange])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const showingStart = totalCount ? (currentPage - 1) * pageSize + 1 : 0
  const showingEnd = Math.min(currentPage * pageSize, totalCount)

  const resetFilters = () => {
    setOrderStatus("All")
    setCategoryId("all")
    setPharmacyId("all")
    setPaymentStatus("All")
    setSearch("")
    setDebouncedSearch("")
    setDateRange(undefined)
    setCurrentPage(1)
  }

  const handleExport = () => {
    exportToCSV(displayOrders, columns.map((c) => ({ key: c.key, label: c.label })), "orders_export")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault()
      searchRef.current?.focus()
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background" onKeyDown={handleKeyDown}>
      <div className="flex-1 p-6 lg:p-8">
        <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Orders</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Orders <span className="text-muted-foreground mx-1">›</span> <span className="text-foreground font-medium">All Orders</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-muted-foreground bg-card border border-border rounded-lg hover:bg-accent"
                >
                  <Calendar className="h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    "Date range"
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarUI
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-muted-foreground bg-card border border-border rounded-lg hover:bg-accent"
            >
              <Download className="h-4 w-4" /> Export
            </button>
            <button
              type="button"
              onClick={loadOrders}
              className="inline-flex items-center justify-center w-9 h-9 text-sm font-semibold text-muted-foreground bg-card border border-border rounded-lg hover:bg-accent"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mb-5">
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex flex-col gap-1.5 min-w-[150px]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Order Status</label>
              <Select value={orderStatus} onValueChange={setOrderStatus}>
                <SelectTrigger className="h-10 bg-card border-border text-sm">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  {ORDER_STATUSES.filter((s) => s !== "All").map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5 min-w-[150px]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Product Category</label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="h-10 bg-card border-border text-sm">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5 min-w-[150px]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pharmacy</label>
              <Select value={pharmacyId} onValueChange={setPharmacyId}>
                <SelectTrigger className="h-10 bg-card border-border text-sm">
                  <SelectValue placeholder="All Pharmacies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pharmacies</SelectItem>
                  {pharmacies.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5 min-w-[150px]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Payment Status</label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger className="h-10 bg-card border-border text-sm">
                  <SelectValue placeholder="All Payment Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Payment Statuses</SelectItem>
                  {PAYMENT_STATUSES.filter((s) => s !== "All").map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5 flex-1 min-w-[220px]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search order #, name, email, or phone"
                  className="w-full border border-border rounded-lg bg-card text-sm pl-9 pr-3.5 py-2.5 focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => { setSearch(""); setDebouncedSearch("") }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className={`text-sm font-semibold text-primary hover:underline pb-2.5 ${hasActiveFilters ? "" : "invisible"}`}
            >
              Reset filters
            </button>

            <span className="text-sm text-muted-foreground whitespace-nowrap pb-2.5">
              {totalCount > 0 ? `Showing ${showingStart}-${showingEnd} of ${totalCount}` : `Showing 0 of ${totalCount}`}
            </span>


          </div>
        </div>

        {error && (
          <div className="text-sm text-destructive mb-4">{error}</div>
        )}

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      style={{ minWidth: col.minWidth }}
                      className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3.5 border-b border-border bg-card whitespace-nowrap"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : displayOrders.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length}>
                      <div className="py-12 text-center text-sm text-muted-foreground">
                        <div className="font-semibold text-foreground mb-1">No orders match these filters.</div>
                        Try clearing a filter or resetting.
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayOrders.map((row) => (
                    <tr key={row.id} className="hover:bg-accent/50 border-b border-border last:border-b-0">
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard/orders/details/${row.id}`)}
                          className="text-primary font-semibold text-sm hover:underline text-left"
                        >
                          {row.order_number}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => {
                            const pid = row.patient?.id
                            if (pid) navigate(`/dashboard/patients/${pid}`)
                          }}
                          className="text-primary font-semibold text-sm hover:underline text-left whitespace-nowrap"
                        >
                          {row.patient_name}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground">{row.patient_email}</td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground">{row.patient_phone}</td>
                      <td className="px-4 py-3.5 text-sm text-foreground max-w-[220px]">{row.product_name}</td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground">{row.pharmacy_name}</td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground whitespace-nowrap">{formatDate(row.order_date)}</td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-foreground whitespace-nowrap">{formatMoney(row.amount)}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center border rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${statusBadgeClass(row.status)}`}
                        >
                          {row.status_display || formatStatus(row.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard/orders/details/${row.id}`)}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && displayOrders.length > 0 && (
            <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-3.5 border-t border-border text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1) }}
                >
                  <SelectTrigger className="h-8 w-[70px] bg-card border-border text-sm">
                    <SelectValue placeholder="20" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 text-foreground font-medium">
                <span className="text-muted-foreground font-normal">Page {currentPage} of {totalPages}</span>
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="w-8 h-8 border border-border rounded-lg bg-card text-muted-foreground flex items-center justify-center hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="w-8 h-8 border border-border rounded-lg bg-card text-muted-foreground flex items-center justify-center hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
