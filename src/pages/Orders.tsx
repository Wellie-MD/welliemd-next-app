import { useState, useMemo, useCallback, useEffect, useRef } from "react"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { CalendarDays, RotateCcw, TrendingUp, Download, RefreshCw, Grid3X3, Check, ChevronsUpDown } from "lucide-react"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useAdminOrders } from "@/hooks/useAdminOrders"
import { exportToCSV } from "@/utils/exportUtils"
import { AdminOrder, FilterOption, getOrderFilterOptions } from "@/api/dashboardApi"
import { clientApi, Client } from "@/api/clientApi"
import { OrderDetailDrawer } from "@/components/orders/OrderDetailDrawer"

// Order status options (display labels mapped to backend values)
const ORDER_STATUSES = [
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
]

const PAYMENT_STATUSES = [
  { label: "All", value: "all" },
  { label: "Paid", value: "paid" },
  { label: "Pending", value: "pending" },
  { label: "Failed", value: "failed" },
  { label: "Refunded", value: "refunded" },
]

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
  const [activeOrderStatusFilter, setActiveOrderStatusFilter] = useState("all")
  const [activePaymentStatusFilter, setActivePaymentStatusFilter] = useState("all")
  const [categoryId, setCategoryId] = useState("all")
  const [pharmacyId, setPharmacyId] = useState("all")
  const [clientId, setClientId] = useState("")
  const [clientSearchQuery, setClientSearchQuery] = useState("")
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false)
  const [date, setDate] = useState<DateRange | undefined>()
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Filter options loaded from backend
  const [categories, setCategories] = useState<FilterOption[]>([])
  const [pharmacies, setPharmacies] = useState<FilterOption[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true)

  const {
    orders,
    loading,
    error,
    pagination,
    setPage,
    setFilters,
    refetch
  } = useAdminOrders()

  // Load filter options (categories, pharmacies, clients) on mount
  useEffect(() => {
    let mounted = true
    async function loadFilterOptions() {
      setFilterOptionsLoading(true)
      const [optionsData, clientsData] = await Promise.all([
        getOrderFilterOptions(),
        clientApi.list().catch(() => [] as Client[]),
      ])
      if (!mounted) return
      setCategories(optionsData.categories ?? [])
      setPharmacies(optionsData.pharmacies ?? [])
      setClients(clientsData)
      setFilterOptionsLoading(false)
    }
    loadFilterOptions()
    return () => { mounted = false }
  }, [])

  // Resolve selected client name for the combobox trigger
  const selectedClientName = useMemo(() => {
    if (!clientId) return "All Clients"
    const found = clients.find(c => c.id === clientId)
    return found?.name ?? "All Clients"
  }, [clientId, clients])

  const handleOrderClick = useCallback((row: any) => {
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
      treatment_aggregate: row.treatment_aggregate ?? null,
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
    activeOrderStatusFilter: "all",
    activePaymentStatusFilter: "all",
    categoryId: "all",
    pharmacyId: "all",
    clientId: "",
    date: undefined as DateRange | undefined
  });

  // Apply filters when they change (with debouncing for search)
  useEffect(() => {
    const prev = prevFiltersRef.current;

    const filtersChanged =
      prev.searchTerm !== searchTerm ||
      prev.activeOrderStatusFilter !== activeOrderStatusFilter ||
      prev.activePaymentStatusFilter !== activePaymentStatusFilter ||
      prev.categoryId !== categoryId ||
      prev.pharmacyId !== pharmacyId ||
      prev.clientId !== clientId ||
      prev.date !== date;

    if (!filtersChanged) return;

    prevFiltersRef.current = {
      searchTerm,
      activeOrderStatusFilter,
      activePaymentStatusFilter,
      categoryId,
      pharmacyId,
      clientId,
      date
    };

    const timeoutId = setTimeout(() => {
      setFilters({
        status: activeOrderStatusFilter !== "all" ? activeOrderStatusFilter : undefined,
        payment_status: activePaymentStatusFilter !== "all" ? activePaymentStatusFilter : undefined,
        product__category__id: categoryId !== "all" ? categoryId : undefined,
        pharmacy__id: pharmacyId !== "all" ? pharmacyId : undefined,
        client_id: clientId || undefined,
        search: searchTerm || undefined,
        date_from: date?.from ? format(date.from, 'yyyy-MM-dd') : undefined,
        date_to: date?.to ? format(date.to, 'yyyy-MM-dd') : undefined,
      })
    }, searchTerm !== prev.searchTerm ? 500 : 0)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, activeOrderStatusFilter, activePaymentStatusFilter, categoryId, pharmacyId, clientId, date, setFilters])

  // Format orders for display while preserving raw data for the detail drawer
  const formattedOrders = useMemo(() => {
    return orders.map(order => {
      const canonicalOrderNumber = order.order_id || order.display_id
      return {
        ...order,
        display_id: canonicalOrderNumber,
        order_id: order.order_id ?? null,
        _raw_display_id: order.display_id,
        _raw_amount: order.amount,
        _raw_created_at: order.created_at,
        _raw_prescribed_at: order.prescribed_at,
        _raw_shipped_at: order.shipped_at,
        _raw_payment_status: order.payment_status,
        _raw_visit_status: order.visit_status || null,
        amount: `$${order.amount.toFixed(2)}`,
        created_at: order.created_at ? format(new Date(order.created_at), 'MM/dd/yyyy') : '',
        prescribed_at: order.prescribed_at ? format(new Date(order.prescribed_at), 'MM/dd/yyyy') : '',
        shipped_at: order.shipped_at ? format(new Date(order.shipped_at), 'MM/dd/yyyy') : '',
        payment_status: formatPaymentStatusLabel(order.payment_status),
        visit_status: formatVisitStatusLabel(order.visit_status),
        payment_recovery_state: order.payment_recovery_state || null,
        remaining_supplemental_amount: order.remaining_supplemental_amount || null,
      }
    })
  }, [orders])

  const handleResetFilters = useCallback(() => {
    setActiveOrderStatusFilter("all")
    setActivePaymentStatusFilter("all")
    setCategoryId("all")
    setPharmacyId("all")
    setClientId("")
    setClientSearchQuery("")
    setDate(undefined)
    setSearchTerm("")
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

  const hasActiveFilters = (activeOrderStatusFilter !== "all") || (activePaymentStatusFilter !== "all") ||
    (categoryId !== "all") || (pharmacyId !== "all") || clientId || searchTerm || date?.from

  // Filter clients by search query for the combobox
  const filteredClients = useMemo(() => {
    if (!clientSearchQuery) return clients
    const q = clientSearchQuery.toLowerCase()
    return clients.filter(c => c.name?.toLowerCase().includes(q))
  }, [clients, clientSearchQuery])

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

      {/* Filter Bar */}
      <div className="space-y-4">
        {/* Row 1: Dropdown filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Order Status */}
          <div className="flex flex-col gap-1.5 min-w-[150px]">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Order Status</label>
            <Select
              value={activeOrderStatusFilter}
              onValueChange={(v) => { setActiveOrderStatusFilter(v); setClientSearchQuery("") }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product Category */}
          <div className="flex flex-col gap-1.5 min-w-[150px]">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Product Category</label>
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
              disabled={filterOptionsLoading}
            >
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

          {/* Pharmacy */}
          <div className="flex flex-col gap-1.5 min-w-[150px]">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pharmacy</label>
            <Select
              value={pharmacyId}
              onValueChange={setPharmacyId}
              disabled={filterOptionsLoading}
            >
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

          {/* Payment Status */}
          <div className="flex flex-col gap-1.5 min-w-[150px]">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Payment Status</label>
            <Select
              value={activePaymentStatusFilter}
              onValueChange={setActivePaymentStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Payment Statuses" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Client Filter (Searchable Combobox) */}
          <div className="flex flex-col gap-1.5 min-w-[150px]">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Client</label>
            <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={clientPopoverOpen}
                className="w-[220px] justify-between font-normal"
                disabled={filterOptionsLoading}
              >
                <span className="truncate">{selectedClientName}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0">
              <Command>
                <CommandInput
                  placeholder="Search clients..."
                  value={clientSearchQuery}
                  onValueChange={setClientSearchQuery}
                />
                <CommandList>
                  <CommandEmpty>No clients found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all-clients"
                      onSelect={() => {
                        setClientId("")
                        setClientPopoverOpen(false)
                        setClientSearchQuery("")
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          !clientId ? "opacity-100" : "opacity-0"
                        )}
                      />
                      All Clients
                    </CommandItem>
                    {filteredClients.map((c) => (
                      <CommandItem
                        key={c.id}
                        value={c.name || c.id}
                        onSelect={() => {
                          setClientId(c.id)
                          setClientPopoverOpen(false)
                          setClientSearchQuery("")
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            clientId === c.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {c.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      <DataTable
        data={formattedOrders}
        columns={orderColumns}
        hideFilters={true}
        searchPlaceholder="Search by Order#, patient name, phone number, email"
        showDatePicker={true}
        showExport={true}
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
