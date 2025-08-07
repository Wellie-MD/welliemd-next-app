import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, RotateCcw, TrendingUp, Download, RefreshCw, Grid3X3 } from "lucide-react"
import mockData from "@/data/mockData.json"

const orderColumns = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "pharmacy", label: "Pharmacy" },
  { key: "orderDate", label: "Order Date" },
  { key: "datePrescribed", label: "Date Prescribed" },
  { key: "datePrintedShipped", label: "Date Printed/Shipped" },
  { key: "paymentDate", label: "Payment Date" },
  { key: "mrn", label: "MRN#" },
  { key: "paymentStatus", label: "Payment Status" },
  { key: "visitStatus", label: "Visit Status" },
  { key: "address", label: "Address" },
  { key: "orderStatus", label: "Order Status" },
  { key: "orderTotal", label: "Order Total" }
]

const filterButtons = [
  "Sort",
  "Payment status",
  "Visit Status", 
  "Order Status",
  "Product",
  "Pharmacies",
  "Pharmacy Status",
  "Extra Filters"
]

export default function Orders() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Orders</span>
            <span>›</span>
            <span>Orders</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by Order#, affiliate order #, MRN#, patient name, phone number, or..."
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Pick a date
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset Filters
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Upgrade
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {filterButtons.map((filter) => (
          <Button key={filter} variant="outline" size="sm">
            {filter}
          </Button>
        ))}
      </div>

      <DataTable
        data={mockData.orders}
        columns={orderColumns}
        searchPlaceholder="Search orders..."
        showDatePicker={false}
        showExport={false}
      />
    </div>
  )
}