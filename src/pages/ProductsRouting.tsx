import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import mockData from "@/data/mockData.json"

const routingColumns = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "createdAt", label: "Created At" }
]

export default function ProductsRouting() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products Routing</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Products</span>
            <span>›</span>
            <span>Routing</span>
          </div>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add New
        </Button>
      </div>

      <DataTable
        data={mockData.routing}
        columns={routingColumns}
        searchPlaceholder="Search by name"
        showDatePicker={false}
        showExport={false}
      />
    </div>
  )
}