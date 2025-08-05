import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import mockData from "@/data/mockData.json"

const affiliateColumns = [
  { key: "name", label: "Name" },
  { key: "id", label: "ID" },
  { key: "createdAt", label: "Created At" },
  { key: "users", label: "Users" },
  { key: "conversions", label: "Conversions" },
  { key: "value", label: "Value" },
  { key: "commission", label: "Commission %" },
  { key: "commissionPercent", label: "Commission" },
  { 
    key: "status", 
    label: "Status",
    render: (value: string) => (
      <Badge variant={value === "Active" ? "default" : "secondary"}>
        {value}
      </Badge>
    )
  },
  {
    key: "actions",
    label: "Status",
    render: () => (
      <Button variant="outline" size="sm">
        Generate
      </Button>
    )
  }
]

const statusFilters = ["All", "Active", "Inactive"]

export default function Affiliates() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Affiliate Programs</h1>
        <div className="flex items-center gap-2">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add New
          </Button>
          <Button variant="outline">Links</Button>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Sort</span>
        {statusFilters.map((status) => (
          <Button
            key={status}
            variant="outline"
            size="sm"
          >
            {status}
          </Button>
        ))}
      </div>

      <DataTable
        data={mockData.affiliates}
        columns={affiliateColumns}
        searchPlaceholder="Search by affiliate name, slug, or ID"
      />
    </div>
  )
}

