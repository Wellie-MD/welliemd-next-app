import { useState } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import mockData from "@/data/mockData.json"

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

export default function Patients() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState("All")

  const filteredPatients = mockData.patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Patients</h1>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add New
        </Button>
      </div>

      {/* Status Filter Pills */}
      <div className="flex items-center gap-2">
        {statusFilters.map((status) => (
          <Button
            key={status}
            variant={activeFilter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter(status)}
            className={activeFilter === status ? "bg-primary text-primary-foreground" : ""}
          >
            {status}
          </Button>
        ))}
      </div>

      {/* Additional Filter Buttons */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          Refills
        </Button>
        <Button variant="outline" size="sm">
          Visit Status
        </Button>
        <Button variant="outline" size="sm">
          Patient Status
        </Button>
      </div>

      <DataTable
        data={filteredPatients}
        columns={patientColumns}
        searchPlaceholder="Search by patient, Ex: name or email phone number, MRN#"
        onSearch={setSearchTerm}
      />
    </div>
  )
}