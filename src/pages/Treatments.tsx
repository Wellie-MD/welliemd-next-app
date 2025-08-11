import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { TableFilters } from "@/components/shared/TableFilters"
import mockData from "@/data/mockData.json"

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

export default function Treatments() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedStatus, setSelectedStatus] = useState("All")

  const handleAddNew = () => {
    console.log("Add new treatment clicked")
    // Implement add new treatment logic
  }

  const handleExport = () => {
    console.log("Export clicked")
    // Implement export logic
  }

  const handleReset = () => {
    setSearchQuery("")
    setSelectedDate(undefined)
    setSelectedStatus("All")
  }

  const additionalFilters = [
    { label: "Refills", onClick: () => console.log("Refills clicked") },
    { label: "Visit Status", onClick: () => console.log("Visit Status clicked") },
    { label: "Patient Status", onClick: () => console.log("Patient Status clicked") }
  ]

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
      </div>

      <TableFilters
        searchPlaceholder="Search by Patient ID, name, email, phone number, MRN#"
        statusFilters={statusFilters}
        onSearch={setSearchQuery}
        onStatusChange={setSelectedStatus}
        onDateChange={setSelectedDate}
        onReset={handleReset}
        onExport={handleExport}
        additionalFilters={additionalFilters}
      />

      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <DataTable
            data={mockData.treatments.treatments}
            columns={treatmentColumns}
            searchPlaceholder="Search treatments..."
          />
        </div>
      </div>
    </div>
  );
}