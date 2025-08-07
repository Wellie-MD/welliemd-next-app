import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import mockData from "@/data/mockData.json"

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

export default function Disputes() {
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
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Dispute Status
        </Button>
      </div>

      <DataTable
        data={mockData.disputes}
        columns={disputeColumns}
        searchPlaceholder="Search by patient name, or dispute ID"
      />
    </div>
  )
}