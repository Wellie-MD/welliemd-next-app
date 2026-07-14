import { useState, useMemo, useCallback, useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { AlertCircle } from "lucide-react"
import { DateRange } from "react-day-picker"
import { useNavigate } from "react-router-dom"
import { isWithinInterval, parseISO, format } from "date-fns"
import { exportToCSV } from "@/utils/exportUtils"
import { patientService, type Patient } from "@/services/patientService"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Transform backend patient data to table row format
interface PatientTableRow {
  id: string
  name: string
  startDate: string
  mrn: string
  productName: string
  email: string
  phone: string
  orders: number
  location: string
  patientStatus: string
  visitStatus: string
  lastOrder: string
}

const getPatientStatusLabel = (engagementStatus?: string) => {
  const normalized = (engagementStatus || "").trim().toLowerCase()
  if (normalized === "active") return "Active"
  if (normalized === "in_review") return "In Review"
  if (normalized === "lapsed" || normalized === "inactive") return "Lapsed"
  if (normalized === "registered") return "Registered"
  if (normalized === "dropoff" || normalized === "drop_off" || normalized === "abandon") {
    return "Registered"
  }
  return "-"
}

const transformPatientData = (patient: Patient, productName?: string, visitStatus?: string): PatientTableRow => {
  const lastOrderDate = patient.last_order_at ? format(new Date(patient.last_order_at), 'dd/MM/yyyy') : '-'
  const lastOrderRef = patient.last_order_id ? `#${patient.last_order_id}` : (patient.last_order_display_id ? `#${patient.last_order_display_id}` : '')
  const lastOrderLabel = lastOrderRef && lastOrderDate !== '-' ? `${lastOrderRef} • ${lastOrderDate}` : (lastOrderDate !== '-' ? lastOrderDate : lastOrderRef || '-')

  return {
    id: patient.id,
    name: patient.full_name || `${patient.first_name} ${patient.last_name}`.trim() || patient.email,
    startDate: format(new Date(patient.created_at), 'dd/MM/yyyy'),
    mrn: patient.id.substring(0, 8).toUpperCase(), // Use first 8 chars of UUID as MRN
    productName: productName || "-",
    email: patient.email,
    phone: patient.phone,
    orders: patient.orders_count ?? 0,
    location: patient.city && patient.state ? `${patient.city}, ${patient.state}` : patient.state || "-",
    patientStatus: getPatientStatusLabel(patient.engagement_status),
    visitStatus: visitStatus || "-",
    lastOrder: lastOrderLabel,
  }
}

const patientColumns = [
  { key: "name", label: "Name", width: "150px" },
  { key: "startDate", label: "Start Date", width: "100px" },
  { key: "mrn", label: "MRN #", width: "120px" },
  { key: "productName", label: "Product Name", width: "150px" },
  { key: "email", label: "Email", width: "200px" },
  { 
    key: "phone", 
    label: "Phone Number",
    width: "130px",
    render: (value: string) => (
      <span className="font-mono text-sm">{value}</span>
    )
  },
  { key: "orders", label: "Order(s)", width: "120px" },
  { key: "location", label: "Location", width: "120px" },
  { key: "patientStatus", label: "Patient Status", width: "100px" },
  { key: "visitStatus", label: "Visit Status", width: "100px" },
  { key: "lastOrder", label: "Last Order", width: "100px" }
]

const statusFilters = ["All", "Active", "In Review", "Lapsed", "Registered"]

// Helper function to parse date in DD/MM/YYYY format
const parseDate = (dateString: string) => {
  const [day, month, year] = dateString.split('/')
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

export default function Patients() {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState("") // User input
  const [searchTerm, setSearchTerm] = useState("") // Debounced value for API
  const [activeFilter, setActiveFilter] = useState("All")
  const [activeAdditionalFilters, setActiveAdditionalFilters] = useState<string[]>([])
  const [date, setDate] = useState<DateRange | undefined>()
  const [patients, setPatients] = useState<PatientTableRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Server-side pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalCount, setTotalCount] = useState(0)
  
  // Debounce search input and reset page on search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput)
      setPage(1) // Reset to first page on search
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Map UI filter to backend engagement_status
  const getEngagementStatus = (filter: string): string | undefined => {
    if (filter === "Active") return "active"
    if (filter === "In Review") return "in_review"
    if (filter === "Lapsed") return "lapsed"
    if (filter === "Registered") return "registered"
    if (filter === "All") return "all"
    return undefined
  }

  const handleStatusFilterChange = useCallback((status: string) => {
    setActiveFilter(status)
    setPage(1)
  }, [])

  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    setDate(range)
    setPage(1)
  }, [])

  // Fetch patients from backend with server-side pagination
  const fetchPatients = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const engagementStatus = getEngagementStatus(activeFilter)
      const response = await patientService.getPatients({
        page,
        page_size: pageSize,
        search: searchTerm || undefined,
        engagement_status: engagementStatus,
      })
      
      const patientIds = response.results.map(p => p.id)
      
      // Batch fetch product names and visit statuses in parallel (2 API calls instead of N+1)
      const [productNameMap, visitStatusMap] = await Promise.all([
        patientService.getProductNamesForPatients(patientIds),
        patientService.getLatestVisitsForPatients(patientIds),
      ])
      
      const transformedData = response.results.map(patient => 
        transformPatientData(patient, productNameMap[patient.id], visitStatusMap[patient.id])
      )
      setPatients(transformedData)
      setTotalCount(response.count)
    } catch (err: any) {
      console.error('Error fetching patients:', err)
      setError(err.message || 'Failed to load patients')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, searchTerm, activeFilter])

  // Fetch patients when pagination or search changes
  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  // Transform the patients data for the table
  const filteredPatients = useMemo(() => {
    // We already filter by search and status on the server in fetchPatients.
    // However, if the user has local UI filters like 'date' or 'additionalFilters' 
    // that are not yet implemented on the server, we still apply them here.
    return patients.filter(patient => {
      // Date range filter (local for now)
      let matchesDateRange = true
      if (date?.from || date?.to) {
        const patientStartDate = parseDate(patient.startDate)
        
        if (date.from && date.to) {
          matchesDateRange = isWithinInterval(patientStartDate, {
            start: date.from,
            end: date.to
          })
        } else if (date.from) {
          matchesDateRange = patientStartDate >= date.from
        } else if (date.to) {
          matchesDateRange = patientStartDate <= date.to
        }
      }

      // Additional filters logic (local for now)
      let matchesAdditionalFilters = true
      if (activeAdditionalFilters.length > 0) {
        if (activeAdditionalFilters.includes("Refills")) {
          matchesAdditionalFilters = patient.orders > 1
        }
        // Add more local filter logic if needed
      }

      // We handle search and primary status filter on server side now 
      // but if the server response doesn't exactly match the local state 
      // (e.g. during transitions), this local filter keeps the UI consistent.
      return matchesDateRange && matchesAdditionalFilters
    })
  }, [patients, date, activeAdditionalFilters])

  // Create filter configuration for DataTable
  const filters = [
    // Status filters
    ...statusFilters.map(status => ({
      key: `status-${status}`,
      label: status,
      type: 'button' as const,
      value: activeFilter === status ? status : undefined,
      onClick: () => handleStatusFilterChange(status)
    })),
  ]

  const handleResetFilters = useCallback(() => {
    setActiveFilter("All")
    setActiveAdditionalFilters([])
    setDate(undefined)
    setSearchInput("") // Reset search input (debounce will update searchTerm)
    setSearchTerm("")
    setPage(1) // Reset to first page
  }, [])

  const handleRefresh = useCallback(() => {
    fetchPatients()
  }, [fetchPatients])

  const handleExport = useCallback(() => {
    exportToCSV(filteredPatients, patientColumns, 'patients_export')
  }, [filteredPatients])

  const handleRowClick = useCallback((row: any) => {
    navigate(`/dashboard/patients/${row.id}`)
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Patients</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <DataTable
        data={filteredPatients}
        columns={patientColumns}
        searchPlaceholder="Search by patient, Ex: name or email phone number, MRN#"
        showDatePicker={true}
        showExport={true}
        showResetFilters={true}
        filters={filters}
        dateRange={date}
        onDateRangeChange={handleDateRangeChange}
        onSearch={setSearchInput}
        onResetFilters={handleResetFilters}
        onExport={handleExport}
        onRefresh={handleRefresh}
        onRowClick={handleRowClick}
        loading={loading}
        pagination={{
          currentPage: page,
          totalPages: Math.ceil(totalCount / pageSize),
          pageSize: pageSize,
          totalCount: totalCount,
          onPageChange: setPage,
          onPageSizeChange: (newSize) => {
            setPageSize(newSize)
            setPage(1) // Reset to first page when changing page size
          }
        }}
      />

    </div>
  )
}
