import { useState, useMemo, useCallback, useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DateRange } from "react-day-picker"
import { isWithinInterval, parseISO, format } from "date-fns"
import { exportToCSV } from "@/utils/exportUtils"
import { patientService, type Patient } from "@/services/patientService"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PatientDetailSheet } from "@/components/patients/PatientDetailSheet"

// Transform backend patient data to table row format
interface PatientTableRow {
  id: string
  name: string
  startDate: string
  mrn: string
  subscription: string
  productName: string
  email: string
  phone: string
  orders: number
  location: string
  patientStatus: string
  visitStatus: string
  lastOrder: string
}

const transformPatientData = (patient: Patient): PatientTableRow => {
  return {
    id: patient.id,
    name: patient.full_name || `${patient.first_name} ${patient.last_name}`.trim() || patient.email,
    startDate: format(new Date(patient.created_at), 'dd/MM/yyyy'),
    mrn: patient.id.substring(0, 8).toUpperCase(), // Use first 8 chars of UUID as MRN
    subscription: "Active", // TODO: Get from actual subscription data
    productName: "-", // TODO: Get from actual product/order data
    email: patient.email,
    phone: patient.phone,
    orders: 0, // TODO: Get from actual order count
    location: patient.city && patient.state ? `${patient.city}, ${patient.state}` : patient.state || "-",
    patientStatus: "Active", // TODO: Determine from actual patient status
    visitStatus: "-", // TODO: Get from visits data
    lastOrder: "-", // TODO: Get from last order date
  }
}

const patientColumns = [
  { key: "name", label: "Name" },
  { key: "startDate", label: "Start Date" },
  { key: "mrn", label: "MRN #" },
  { key: "subscription", label: "Subscription" },
  { key: "productName", label: "Product Name" },
  { key: "email", label: "Email" },
  { 
    key: "phone", 
    label: "Phone Number",
    render: (value: string) => (
      <span className="font-mono text-sm">{value}</span>
    )
  },
  { key: "orders", label: "Order(s)" },
  { key: "location", label: "Location" },
  { key: "patientStatus", label: "Patient Status" },
  { key: "visitStatus", label: "Visit Status" },
  { key: "lastOrder", label: "Last Order" }
]

const statusFilters = ["All", "Active", "Pending", "Abandon", "Canceled"]
const additionalFilters = ["Refills", "Visit Status", "Patient Status"]

// Helper function to parse date in DD/MM/YYYY format
const parseDate = (dateString: string) => {
  const [day, month, year] = dateString.split('/')
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

export default function Patients() {
  const [searchInput, setSearchInput] = useState("") // User input
  const [searchTerm, setSearchTerm] = useState("") // Debounced value for API
  const [activeFilter, setActiveFilter] = useState("All")
  const [activeAdditionalFilters, setActiveAdditionalFilters] = useState<string[]>([])
  const [date, setDate] = useState<DateRange | undefined>()
  const [isOpen, setIsOpen] = useState(false)
  const [patients, setPatients] = useState<PatientTableRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Server-side pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalCount, setTotalCount] = useState(0)
  
  // Patient details state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isFetchingDetail, setIsFetchingDetail] = useState(false)
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput)
      setPage(1) // Reset to first page on search
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const [newPatient, setNewPatient] = useState({
    firstName: "",
    lastName: "",
    email: "",
  })

  // Fetch patients from backend with server-side pagination
  const fetchPatients = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await patientService.getPatients({
        page,
        page_size: pageSize,
        search: searchTerm || undefined,
      })
      const transformedData = response.results.map(transformPatientData)
      setPatients(transformedData)
      setTotalCount(response.count)
    } catch (err: any) {
      console.error('Error fetching patients:', err)
      setError(err.message || 'Failed to load patients')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, searchTerm])

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
      onClick: () => setActiveFilter(status)
    })),
    // Additional filters
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

  const handleRowClick = useCallback(async (row: any) => {
    setIsFetchingDetail(true)
    try {
      const patient = await patientService.getPatient(row.id)
      setSelectedPatient(patient)
      setIsDetailOpen(true)
    } catch (err) {
      console.error('Failed to fetch patient details:', err)
      // Fallback: create a partial patient object from the row data
      // This is a safety measure if getPatient fails
      setSelectedPatient({
        id: row.id,
        email: row.email,
        first_name: row.name.split(' ')[0] || '',
        last_name: row.name.split(' ').slice(1).join(' ') || '',
        full_name: row.name,
        phone: row.phone,
        // Other fields will be missing but the UI handles N/A
      } as Patient)
      setIsDetailOpen(true)
    } finally {
      setIsFetchingDetail(false)
    }
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Patients</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName"
                  value={newPatient.firstName}
                  onChange={(e) => setNewPatient({...newPatient, firstName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName"
                  value={newPatient.lastName}
                  onChange={(e) => setNewPatient({...newPatient, lastName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  type="email"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsOpen(false)
                  setNewPatient({ firstName: "", lastName: "", email: "" })
                }}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  // Here you would typically save the patient data
                  console.log("Saving patient:", newPatient)
                  setIsOpen(false)
                  setNewPatient({ firstName: "", lastName: "", email: "" })
                }}>
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
        onDateRangeChange={setDate}
        onSearch={setSearchInput}
        onResetFilters={handleResetFilters}
        onExport={handleExport}
        onRefresh={handleRefresh}
        onRowClick={handleRowClick}
        loading={loading || isFetchingDetail}
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

      <PatientDetailSheet 
        patient={selectedPatient}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  )
}
