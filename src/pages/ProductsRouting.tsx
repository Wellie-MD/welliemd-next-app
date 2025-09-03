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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

const routingColumns = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "createdAt", label: "Created At" }
]

export default function ProductsRouting() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    groupId: "",
  })

  const handleCreate = () => {
    // Handle routing creation here
    setOpen(false)
    setFormData({ name: "", groupId: "" })
  }

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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Routing Config</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupId">
                  Group ID <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.groupId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, groupId: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Please select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semaglutide">Semaglutide</SelectItem>
                    <SelectItem value="NAD">NAD</SelectItem>
                    <SelectItem value="GTH">GTH</SelectItem>
                    <SelectItem value="Remi">Remi</SelectItem>
                    <SelectItem value="Tirzep">Tirzep</SelectItem>
                    <SelectItem value="LockLab">LockLab</SelectItem>
                    <SelectItem value="Brand-Name-GLPs">Brand Name GLPs</SelectItem>
                    <SelectItem value="VitD">VitD</SelectItem>
                    <SelectItem value="Sublingual">Sublingual Sema</SelectItem>
                    <SelectItem value="Everyday">Everyday +</SelectItem>
                    <SelectItem value="micb12">micb12</SelectItem>
                    <SelectItem value="Zofran">Zofran</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!formData.name || !formData.groupId}
                >
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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