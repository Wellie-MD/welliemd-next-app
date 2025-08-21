import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import mockData from "@/data/mockData.json"

const couponColumns = [
  { key: "createdAt", label: "Created At" },
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "code", label: "Code" },
  { key: "couponType", label: "Coupon Type" },
  { key: "limit", label: "Limit" },
  { key: "discountType", label: "Discount Type" },
  { key: "couponType2", label: "Coupon Type" },
  { key: "validUntil", label: "Valid Until" },
  { key: "duration", label: "Duration" },
  { key: "ordersQty", label: "Orders Qty" },
  { key: "usedCount", label: "Used Count" },
  { key: "updatedAt", label: "Updated At" },
  { key: "archivedAt", label: "Archived At" },
  { key: "status", label: "Status" }
]

export default function CouponCodes() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Coupons Codes</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            Links
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add new
          </Button>
        </div>
      </div>

      <DataTable
        data={mockData.couponCodes}
        columns={couponColumns}
        searchPlaceholder="Search by coupon name, code, or ID"
        showDatePicker={false}
        showExport={false}
      />
    </div>
  )
}