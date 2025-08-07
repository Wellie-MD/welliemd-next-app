import { useState } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import mockData from "@/data/mockData.json"

const resolutionColumns = [
  { key: "createdAt", label: "Created At" },
  { key: "patientId", label: "Patient ID" },
  { key: "patientName", label: "Patient Name" },
  { key: "patientEmail", label: "Patient Email" },
  { key: "orderNumber", label: "Order #" },
  { key: "friendlyId", label: "Friendly ID" },
  { key: "status", label: "Status" },
  { key: "gateway", label: "Gateway" },
  { key: "card", label: "Card" },
  { key: "paymentMethod", label: "Payment Method" },
  { key: "totalPrice", label: "Total Price" },
  { key: "discount", label: "Discount" },
  { key: "processingFee", label: "Processing Fee" },
  { key: "amountPaid", label: "Amount Paid" },
  { key: "net", label: "Net" }
]

const statusFilters = ["Pending", "Paid", "Failed", "Cancelled", "Expired", "Requires Capture", "Draft"]
const tabs = ["Payments", "Subscriptions", "Subscription Invoices"]

export default function Payments() {
  const [activeTab, setActiveTab] = useState("Payments")

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Orders</span>
            <span>›</span>
            <span>Payments</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </Button>
        ))}
      </div>

      {/* Status Filters */}
      <div className="flex items-center gap-2 flex-wrap">
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
        <Button variant="outline" size="sm">Extra Filters</Button>
      </div>

      <DataTable
        data={mockData.Payments}
        columns={resolutionColumns}
        searchPlaceholder="Search by order#, order ID, patient name or payment ID"
      />
    </div>
  )
}