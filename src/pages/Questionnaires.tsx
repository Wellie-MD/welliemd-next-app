import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import mockData from "@/data/mockData.json"

const questionnaireColumns = [
  { key: "name", label: "Name" },
  { key: "id", label: "ID" },
  { key: "createdDate", label: "Created Date" },
  { key: "questions", label: "Questions" },
  { key: "products", label: "Products" },
  { key: "checkoutPages", label: "Checkout Pages" },
  { key: "domain", label: "Domain" },
  { key: "slug", label: "Slug" },
  { 
    key: "review", 
    label: "Review",
    render: (value: string) => (
      <Badge variant={value === "Unpublished" ? "destructive" : "default"}>
        {value}
      </Badge>
    )
  },
  { 
    key: "status", 
    label: "Status",
    render: (value: string) => (
      <Badge variant={value === "Approved" ? "default" : "secondary"}>
        {value}
      </Badge>
    )
  }
]

const statusFilters = ["All", "Active", "Inactive", "Extra Filters"]

export default function Questionnaires() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Questionnaires</h1>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add New
        </Button>
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
        data={mockData.questionnaires}
        columns={questionnaireColumns}
        searchPlaceholder="Search by questionnaire name, slug, or ID"
      />
    </div>
  )
}