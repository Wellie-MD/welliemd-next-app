import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import mockData from "@/data/mockData.json"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

const billingColumns = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "variants", label: "Variants" }
]

export default function BillingPlans() {
  const [open, setOpen] = useState(false)
  const [planName, setPlanName] = useState("")

  const handleCreate = () => {
    // Handle plan creation here
    setOpen(false)
    setPlanName("")
  }

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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add New Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Billing Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="Enter plan name"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!planName}>
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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