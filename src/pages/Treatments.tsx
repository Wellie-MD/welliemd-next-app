import { useState, useMemo, useCallback } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { DateRange } from "react-day-picker"
import { isWithinInterval } from "date-fns"
import mockData from "@/data/mockData.json"
import { exportToCSV } from "@/utils/exportUtils"


const treatmentColumns = [
  { key: "name", label: "Name" },
  { key: "startDate", label: "Start Date" },
  { key: "mrn", label: "MRN #" },
  { key: "email", label: "Email" },
  { key: "phoneNumber", label: "Phone Number" },
  { key: "orders", label: "Order(s)" },
  { key: "location", label: "Location" },
  { key: "treatStatus", label: "Treat Status" },
  { key: "fulfilStatus", label: "Fulfil Status" },
  { key: "lastOrder", label: "Last Order" },
  { key: "nextShippingDate", label: "Next Shipping Date" },
  { key: "visitMasterid", label: "visitMasterid" },
  { key: "archivedAt", label: "Archived At" },
  { key: "failedOrderPay", label: "Failed Draft Payment" },
  { key: "TestMode", label: "Test Mode" },
  { key: "UnreadMsg", label: "Unread Messages" }
]

const statusFilters = ["All", "Active", "Pending", "Abandon", "Canceled"]
const additionalFilters = ["Refills", "Visit Status", "Patient Status"]

// Helper function to parse date in DD/MM/YYYY format (same as Patients page)
const parseDate = (dateString: string) => {
  const [day, month, year] = dateString.split('/')
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

export default function Treatments() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState("All")
  const [activeAdditionalFilters, setActiveAdditionalFilters] = useState<string[]>([])
  const [date, setDate] = useState<DateRange | undefined>()
  const [refreshKey, setRefreshKey] = useState(0) // For triggering refresh

  // Comprehensive filtering logic
  const filteredTreatments = useMemo(() => {
    return mockData.treatments.treatments.filter(treatment => {
      // Search filter
      const matchesSearch = !searchTerm || 
        treatment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        treatment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        treatment.phoneNumber.includes(searchTerm) ||
        treatment.mrn.toLowerCase().includes(searchTerm.toLowerCase())

      // Status filter - using treatStatus field
      const matchesStatus = activeFilter === "All" || treatment.treatStatus === activeFilter

      // Date range filter
      let matchesDateRange = true
      if (date?.from || date?.to) {
        const treatmentStartDate = parseDate(treatment.startDate)
        
        if (date.from && date.to) {
          matchesDateRange = isWithinInterval(treatmentStartDate, {
            start: date.from,
            end: date.to
          })
        } else if (date.from) {
          matchesDateRange = treatmentStartDate >= date.from
        } else if (date.to) {
          matchesDateRange = treatmentStartDate <= date.to
        }
      }

      // Additional filters logic
      let matchesAdditionalFilters = true
      if (activeAdditionalFilters.length > 0) {
        if (activeAdditionalFilters.includes("Visit Status")) {
          // Add specific logic here based on your business requirements
        }
        if (activeAdditionalFilters.includes("Patient Status")) {
          // Add specific logic here based on your business requirements  
        }
        if (activeAdditionalFilters.includes("Refills")) {
          // Filter treatments with more than 1 order as an example
          matchesAdditionalFilters = treatment.orders > 1
        }
      }

      return matchesSearch && matchesStatus && matchesDateRange && matchesAdditionalFilters
    })
  }, [mockData.treatments.treatments, searchTerm, activeFilter, date, activeAdditionalFilters, refreshKey])

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
    setSearchTerm("")
  }, [])

  const handleRefresh = useCallback(() => {
    // Increment refresh key to trigger re-render and data refresh
    setRefreshKey(prev => prev + 1)
    console.log("Refreshing treatment data...")
  }, [])

  const handleExport = useCallback(() => {
    exportToCSV(filteredTreatments, treatmentColumns, 'treatments_export')
  }, [filteredTreatments])

  const handleAddNew = () => {
    console.log("Add new treatment clicked")
    // Implement add new treatment logic
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Treatments</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Treatments</span>
            <span>›</span>
            <span>Treatments</span>
          </div>
        </div>
        <Button onClick={handleAddNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New
        </Button>
      </div>

      <DataTable
        data={filteredTreatments}
        columns={treatmentColumns}
        searchPlaceholder="Search by Patient ID, name, email, phone number, MRN#"
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
    </div>
  )
}
