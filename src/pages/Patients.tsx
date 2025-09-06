import { useState, useMemo, useCallback } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import mockData from "@/data/mockData.json"
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
import { isWithinInterval, parseISO } from "date-fns"
import { exportToCSV } from "@/utils/exportUtils"

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
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState("All")
  const [activeAdditionalFilters, setActiveAdditionalFilters] = useState<string[]>([])
  const [date, setDate] = useState<DateRange | undefined>()
  const [isOpen, setIsOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0) // For triggering refresh
  const [newPatient, setNewPatient] = useState({
    firstName: "",
    lastName: "",
    email: "",
  })

  // Comprehensive filtering logic
  const filteredPatients = useMemo(() => {
    return mockData.patients.filter(patient => {
      // Search filter
      const matchesSearch = !searchTerm || 
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm) ||
        patient.mrn.toLowerCase().includes(searchTerm.toLowerCase())

      // Status filter
      const matchesStatus = activeFilter === "All" || patient.patientStatus === activeFilter

      // Date range filter
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

      // Additional filters logic (you can customize this based on your needs)
      let matchesAdditionalFilters = true
      if (activeAdditionalFilters.length > 0) {
        // Example: if "Visit Status" is selected, you might want to filter by specific visit statuses
        // This is a placeholder - implement according to your business logic
        if (activeAdditionalFilters.includes("Visit Status")) {
          // You can add specific logic here
        }
        if (activeAdditionalFilters.includes("Patient Status")) {
          // You can add specific logic here  
        }
        if (activeAdditionalFilters.includes("Refills")) {
          // Filter patients with more than 1 order as an example
          matchesAdditionalFilters = patient.orders > 1
        }
      }

      return matchesSearch && matchesStatus && matchesDateRange && matchesAdditionalFilters
    })
  }, [mockData.patients, searchTerm, activeFilter, date, activeAdditionalFilters, refreshKey])

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
    
    // In a real app, you would also:
    // - Fetch fresh data from your API
    // - Show loading state
    // - Handle errors
    
    // For now, we'll simulate a refresh by forcing a re-computation
    console.log("Refreshing patient data...")
    
    // Optional: Show some feedback to user
    // You could add a toast notification here
  }, [])

  const handleExport = useCallback(() => {
    exportToCSV(filteredPatients, patientColumns, 'patients_export')
  }, [filteredPatients])

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
        onSearch={setSearchTerm}
        onResetFilters={handleResetFilters}
        onExport={handleExport}
        onRefresh={handleRefresh}
      />
    </div>
  )
}
