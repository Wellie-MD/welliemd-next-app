import { StatCard } from "@/components/ui/stat-card"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import mockData from "@/data/mockData.json"

const productColumns = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "genericName", label: "Generic Name" },
  { key: "pharmacy", label: "Pharmacy" },
  { key: "type", label: "Type" },
  { key: "productType", label: "Product Type" },
  { 
    key: "status", 
    label: "Status",
    render: (value: string) => (
      <Badge variant="secondary">{value}</Badge>
    )
  },
  { key: "createdAt", label: "Created At" }
]

const filterButtons = ["Drug", "Digital", "Bundle", "Billing Plan", "Active", "Archive"]

export default function Products() {
  const { products } = mockData

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Products</span>
            <span>›</span>
            <span>Products</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add New
          </Button>
          <Button variant="outline">Browse products</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Active Products"
          value={`${products.summary.activeProducts} -`}
          className="bg-muted/30"
        />
        <StatCard
          title="Active Product Bundles"
          value={`${products.summary.activeProductBundles} -`}
          className="bg-muted/30"
        />
        <StatCard
          title="Total Orders"
          value={`${products.summary.totalOrders} -`}
          className="bg-muted/30"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Sort</span>
        {filterButtons.map((filter) => (
          <Button
            key={filter}
            variant="outline"
            size="sm"
          >
            {filter}
          </Button>
        ))}
      </div>

      <DataTable
        data={products.items}
        columns={productColumns}
        searchPlaceholder="Search by name, product ID, variant ID, pharmacy or generic name"
        showDatePicker={false}
      />
    </div>
  )
}