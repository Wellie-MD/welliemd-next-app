import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import mockData from "@/data/mockData.json"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { useState } from "react"

const disputeColumns = [
  { key: "patientName", label: "Patient Name" },
  { key: "order", label: "Order" },
  { key: "disputeId", label: "Dispute ID" },
  { key: "payment", label: "Payment" },
  { key: "paymentAmount", label: "Payment Amount" },
  { key: "disputeAmount", label: "Dispute Amount" },
  { key: "refundAmount", label: "Refund Amount" },
  { key: "status", label: "Status" },
  { key: "date", label: "Date" },
  { key: "hasEvidence", label: "Has Evidence" },
  { key: "evidenceDueBy", label: "Evidence Due By" },
  { key: "evidenceSubmissionCount", label: "Evidence Submission Count" },
  { key: "evidenceDueDate", label: "Evidence Due Date" }
]

const statusOptions = [
  { id: "lost", label: "Lost" },
  { id: "won", label: "Won" },
  { id: "needs-response", label: "Needs response" },
  { id: "under-review", label: "Under review" },
  { id: "warning-closed", label: "Warning closed" },
  { id: "warning-needs-response", label: "Warning needs response" },
  { id: "warning-under-review", label: "Warning under review" },
]

export default function Disputes() {
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])

  const toggleStatus = (statusId: string) => {
    setSelectedStatuses(prev =>
      prev.includes(statusId)
        ? prev.filter(id => id !== statusId)
        : [...prev, statusId]
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Disputes</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Orders</span>
            <span>›</span>
            <span>Disputes</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Dispute Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 p-2">
            {statusOptions.map((status) => (
              <div key={status.id} className="flex items-center space-x-2 p-2">
                <Checkbox
                  id={status.id}
                  checked={selectedStatuses.includes(status.id)}
                  onCheckedChange={() => toggleStatus(status.id)}
                />
                <label
                  htmlFor={status.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {status.label}
                </label>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DataTable
        data={mockData.disputes}
        columns={disputeColumns}
        searchPlaceholder="Search by patient name, or dispute ID"
      />
    </div>
  )
}