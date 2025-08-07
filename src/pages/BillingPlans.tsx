import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import mockData from "@/data/mockData.json"

const billingColumns = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "variants", label: "Variants" }
]

export default function BillingPlans() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Billing Plans</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Products</span>
            <span>›</span>
            <span>Billing Plans</span>
          </div>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Plan
        </Button>
      </div>

      <DataTable
        data={mockData.billingPlans}
        columns={billingColumns}
        searchPlaceholder="Search by name"
        showDatePicker={false}
        showExport={false}
      />
    </div>
  )
}