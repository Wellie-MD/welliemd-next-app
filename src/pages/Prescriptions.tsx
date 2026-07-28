import { useState, useMemo, useCallback, useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Eye, Settings } from "lucide-react"
import { DateRange } from "react-day-picker"
import { isWithinInterval } from "date-fns"
import { exportToCSV } from "@/utils/exportUtils"
import { ordersApi } from "@/api/ordersApi"
import type { Order } from "@/api/ordersApi"
import { TREATMENT_CLINICAL_STATUS_LABELS } from "@/features/treatments/orders/constants"

const prescriptionColumns = [
  { key: "user", label: "User" },
  { key: "prescriptionNumber", label: "Prescription #" },
  { key: "products", label: "Products" },
  { key: "date", label: "Date" },
  { key: "prescriptionStatus", label: "Prescription Status" },
  { key: "refillStatus", label: "Refill Status" },
  { key: "remainingRefills", label: "Remaining Refills" },
  { key: "nextRefillDate", label: "Next Refill Date" },
  { key: "expirationDate", label: "Expiration Date" },
  { key: "sentToGoGoMeds", label: "Sent To GoGoMeds" },
  { key: "sentAt", label: "Sent At" },
  { key: "pharmacyName", label: "Pharmacy Name" }
]

// Adjusted filters based on the actual data values shown in your table
const prescriptionStatusFilters = [
  "All", "Active", "Pending", "Completed", "On Hold",
  ...Object.values(TREATMENT_CLINICAL_STATUS_LABELS),
]
const refillStatusFilters = ["All", "Eligible", "Pending", "Not Eligible"]

// Helper function to parse date in DD/MM/YYYY format
const parseDate = (dateString: string) => {
  if (!dateString) return new Date()
  const isoDate = new Date(dateString)
  if (!Number.isNaN(isoDate.getTime())) return isoDate
  const [day, month, year] = dateString.split('/')
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

type PrescriptionRow = {
  user: string
  prescriptionNumber: string
  products: string
  date: string
  prescriptionStatus: string
  refillStatus: string
  remainingRefills: number
  nextRefillDate: string
  expirationDate: string
  sentToGoGoMeds: string
  sentAt: string
  pharmacyName: string
  orderId: string
  lineItemId: string
}

function derivePrescriptionRows(orders: Order[]): PrescriptionRow[] {
  return orders.flatMap((order) => {
    const aggregate = order.treatment_aggregate
    if (aggregate) {
      const products = aggregate.reconciliation.prescribed_set.length
        ? aggregate.reconciliation.prescribed_set
        : aggregate.reconciliation.requested_set
      const clinicalStatus = TREATMENT_CLINICAL_STATUS_LABELS[aggregate.clinical_status] || aggregate.clinical_status.split("_").join(" ")
      const orderReference = order.order_id || order.display_id || order.id
      return [{
        user: order.patient?.full_name || order.name || order.email || "-",
        prescriptionNumber: String(orderReference),
        products: products.map((product) => product.name || product.med_id || `Product ${product.product_id || ""}`.trim()).join(", ") || "Awaiting provider decision",
        date: order.prescribed_at || order.created_at || "",
        prescriptionStatus: clinicalStatus,
        refillStatus: "Not Eligible",
        remainingRefills: 0,
        nextRefillDate: "—",
        expirationDate: "—",
        sentToGoGoMeds: order.status === "shipped" ? "Yes" : "No",
        sentAt: order.shipped_at || "—",
        pharmacyName: order.pharmacy_name || order.pharmacy_display || "—",
        orderId: String(order.id),
        lineItemId: aggregate.treatment_case_id,
      }]
    }
    const lines = Array.isArray(order.line_items) ? order.line_items : []
    return lines
      .filter((line) => line.item_type !== "supply" && line.item_type !== "shipping_adjustment")
      .map((line) => {
        const lineStatus = String(line.prescription_status || "pending").toLowerCase()
        const prescriptionStatus = lineStatus === "prescribed"
          ? "Active"
          : lineStatus === "cancelled" || line.refund_status === "refunded"
            ? "Completed"
            : lineStatus === "unresolved"
              ? "On Hold"
              : "Pending"
        const orderReference = order.order_id || order.display_id || order.id
        return {
          user: order.patient?.full_name || order.name || order.email || "-",
          prescriptionNumber: line.prescription_event_id || `${orderReference}-${line.id.slice(0, 8)}`,
          products: line.product_name || order.product_name || "Product",
          date: line.prescribed_at || order.prescribed_at || order.created_at || "",
          prescriptionStatus,
          refillStatus: "Not Eligible",
          remainingRefills: 0,
          nextRefillDate: "—",
          expirationDate: "—",
          sentToGoGoMeds: line.shipment_status === "shipped" ? "Yes" : "No",
          sentAt: line.shipped_at || "—",
          pharmacyName: order.pharmacy_name || order.pharmacy_display || "—",
          orderId: String(order.id),
          lineItemId: line.id,
        }
      })
  })
}

export default function Prescriptions() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activePrescriptionStatusFilter, setActivePrescriptionStatusFilter] = useState("All")
  const [activeRefillStatusFilter, setActiveRefillStatusFilter] = useState("All")
  const [activePharmacyFilter, setActivePharmacyFilter] = useState("All")
  const [showTestMode, setShowTestMode] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [date, setDate] = useState<DateRange | undefined>()
  const [refreshKey, setRefreshKey] = useState(0)
  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const pharmacyFilters = useMemo(
    () => ["All", ...Array.from(new Set(prescriptions.map((item) => item.pharmacyName).filter((name) => name !== "—")))],
    [prescriptions],
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    ordersApi.fetchOrders({ page: 1, page_size: 100, ordering: "-created_at" })
      .then((response) => {
        if (!cancelled) setPrescriptions(derivePrescriptionRows(response.results || []))
      })
      .catch(() => {
        if (!cancelled) {
          setPrescriptions([])
          setLoadError("Unable to load prescriptions. Please retry.")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [refreshKey])

  // Comprehensive filtering logic based on prescription data
  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter(prescription => {
      // Search filter - search across multiple fields
      const matchesSearch = !searchTerm || 
        prescription.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.prescriptionNumber.toString().includes(searchTerm) ||
        prescription.pharmacyName.toLowerCase().includes(searchTerm.toLowerCase())

      // Prescription Status filter - using actual values from your data
      const matchesPrescriptionStatus = activePrescriptionStatusFilter === "All" || 
        prescription.prescriptionStatus === activePrescriptionStatusFilter

      // Refill Status filter - using actual values from your data
      const matchesRefillStatus = activeRefillStatusFilter === "All" || 
        prescription.refillStatus === activeRefillStatusFilter

      // Pharmacy filter - using actual pharmacy names from your data
      const matchesPharmacy = activePharmacyFilter === "All" || 
        prescription.pharmacyName === activePharmacyFilter

      // Date range filter based on prescription date
      let matchesDateRange = true
      if (date?.from || date?.to) {
        const prescriptionDate = parseDate(prescription.date)
        
        if (date.from && date.to) {
          matchesDateRange = isWithinInterval(prescriptionDate, {
            start: date.from,
            end: date.to
          })
        } else if (date.from) {
          matchesDateRange = prescriptionDate >= date.from
        } else if (date.to) {
          matchesDateRange = prescriptionDate <= date.to
        }
      }

      return matchesSearch && matchesPrescriptionStatus && matchesRefillStatus && matchesPharmacy && matchesDateRange
    })
  }, [prescriptions, searchTerm, activePrescriptionStatusFilter, activeRefillStatusFilter, activePharmacyFilter, date])

  // Create filter configuration with actual data values
  const filters = [
    // Prescription Status filters - based on actual values in your data
    ...prescriptionStatusFilters.map(status => ({
      key: `prescription-status-${status}`,
      label: status,
      type: 'button' as const,
      value: activePrescriptionStatusFilter === status ? status : undefined,
      onClick: () => setActivePrescriptionStatusFilter(status)
    })),
    // Refill Status filters - based on actual values in your data
    ...refillStatusFilters.slice(1).map(status => ({ // Skip "All" to avoid duplicate
      key: `refill-status-${status}`,
      label: status,
      type: 'button' as const,
      value: activeRefillStatusFilter === status ? status : undefined,
      onClick: () => setActiveRefillStatusFilter(status)
    })),
    // Pharmacy filters are derived from the authoritative orders response.
    ...pharmacyFilters.slice(1).map((pharmacy) => ({
      key: `pharmacy-${pharmacy}`,
      label: pharmacy,
      type: 'button' as const,
      value: activePharmacyFilter === pharmacy ? pharmacy : undefined,
      onClick: () => setActivePharmacyFilter(activePharmacyFilter === pharmacy ? 'All' : pharmacy),
    })),
    // Test Mode toggle
    {
      key: 'test-mode',
      label: 'Test Mode',
      type: 'button' as const,
      value: showTestMode ? 'Test Mode' : undefined,
      onClick: () => setShowTestMode(prev => !prev)
    },
    // Show Archived toggle
    {
      key: 'show-archived',
      label: 'Show Archived',
      type: 'button' as const,
      value: showArchived ? 'Show Archived' : undefined,
      onClick: () => setShowArchived(prev => !prev)
    }
  ]

  const handleResetFilters = useCallback(() => {
    setActivePrescriptionStatusFilter("All")
    setActiveRefillStatusFilter("All")
    setActivePharmacyFilter("All")
    setShowTestMode(false)
    setShowArchived(false)
    setDate(undefined)
    setSearchTerm("")
  }, [])

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1)
  }, [])

  const handleExport = useCallback(() => {
    exportToCSV(filteredPrescriptions, prescriptionColumns, 'prescriptions_export')
  }, [filteredPrescriptions])

  const handleView = () => {
    console.log("View clicked")
    // Implement view functionality
  }

  const handleSettings = () => {
    console.log("Settings clicked")
    // Implement settings functionality
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Prescriptions</h1>
        </div>
        {/* Move some buttons to header area */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleView}>
            <Eye className="h-4 w-4" />
            View
          </Button>
          <Button variant="outline" size="sm" onClick={handleSettings}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loadError && (
        <div className="mb-4 flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <span>{loadError}</span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>Retry</Button>
        </div>
      )}
      {loading ? (
        <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">Loading prescriptions…</div>
      ) : (
        <DataTable
          data={filteredPrescriptions}
          columns={prescriptionColumns}
          searchPlaceholder="Search by prescription id, patient name, patient id or pharmacy name"
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
      )}
    </div>
  )
}
