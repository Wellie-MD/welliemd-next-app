import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Download, Settings, TestTube, Archive } from "lucide-react"
import mockData from "@/data/mockData.json"

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

export default function Prescriptions() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Prescriptions</h1>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by prescription id, patient name, patient id or pharmacy name"
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Eye className="h-4 w-4" />
            View
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-2">
          <TestTube className="h-4 w-4" />
          Test Mode
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <Archive className="h-4 w-4" />
          Show Archived
        </Button>
      </div>

      <DataTable
        data={mockData.prescriptions}
        columns={prescriptionColumns}
        searchPlaceholder="Search prescriptions..."
        showDatePicker={false}
        showExport={false}
      />
    </div>
  )
}