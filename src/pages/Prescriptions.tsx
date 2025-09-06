import { useState, useMemo, useCallback } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Download, Settings, TestTube, Archive } from "lucide-react"
import { DateRange } from "react-day-picker"
import { isWithinInterval } from "date-fns"
import mockData from "@/data/mockData.json"
import { exportToCSV } from "@/utils/exportUtils"

const prescriptionColumns = [
  { key: "user", label: "User" },
  { key: "prescriptionNumber", label: "Prescription #" },
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
const prescriptionStatusFilters = ["All", "Active", "Completed", "Expired", "On Hold"]
const refillStatusFilters = ["All", "Eligible", "Pending", "Not Eligible"]
const pharmacyFilters = ["All", "CityCare Pharmacy", "HealthFirst Pharmacy", "Wellness Hub Pharmacy", "CarePlus Pharmacy", "LifeLine Pharmacy", "MedTrust Pharmacy", "QuickMeds Pharmacy", "PrimeCare Pharmacy"]

// Helper function to parse date in DD/MM/YYYY format
const parseDate = (dateString: string) => {
  if (!dateString) return new Date()
  const [day, month, year] = dateString.split('/')
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
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

  // Comprehensive filtering logic based on prescription data
  const filteredPrescriptions = useMemo(() => {
    return mockData.prescriptions.filter(prescription => {
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
  }, [mockData.prescriptions, searchTerm, activePrescriptionStatusFilter, activeRefillStatusFilter, activePharmacyFilter, date, refreshKey])

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
    // Pharmacy filters - using actual pharmacy names from your table (shortened for display)
    {
      key: 'pharmacy-gogoMeds',
      label: 'GoGoMeds',
      type: 'button' as const,
      value: activePharmacyFilter.includes('GoGoMeds') ? 'GoGoMeds' : undefined,
      onClick: () => setActivePharmacyFilter(activePharmacyFilter === 'All' ? 'GoGoMeds' : 'All')
    },
    {
      key: 'pharmacy-cvs',
      label: 'CVS',
      type: 'button' as const,
      value: activePharmacyFilter.includes('CVS') ? 'CVS' : undefined,
      onClick: () => setActivePharmacyFilter(activePharmacyFilter === 'All' ? 'CVS' : 'All')
    },
    {
      key: 'pharmacy-walgreens',
      label: 'Walgreens',
      type: 'button' as const,
      value: activePharmacyFilter.includes('Walgreens') ? 'Walgreens' : undefined,
      onClick: () => setActivePharmacyFilter(activePharmacyFilter === 'All' ? 'Walgreens' : 'All')
    },
    {
      key: 'pharmacy-riteaid',
      label: 'Rite Aid',
      type: 'button' as const,
      value: activePharmacyFilter.includes('Rite Aid') ? 'Rite Aid' : undefined,
      onClick: () => setActivePharmacyFilter(activePharmacyFilter === 'All' ? 'Rite Aid' : 'All')
    },
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
    console.log("Refreshing prescriptions data...")
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
    </div>
  )
}
