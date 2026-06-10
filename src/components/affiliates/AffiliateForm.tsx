import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import axiosInstance from "@/api/axiosInstance"

type Props = {
  mode: "create" | "edit"
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  affiliate?: any
}

export default function AffiliateForm({ mode, open, onOpenChange, onSuccess, affiliate }: Props) {
  const [form, setForm] = useState({
    name: affiliate?.name || "",
    slug: affiliate?.slug || "",
    commission_type: affiliate?.commission_type || "flat",
    commission_value: affiliate?.commission_value || 0,
    discount_type: affiliate?.discount_type || "flat",
    discount_value: affiliate?.discount_value || 0,
    is_active: affiliate?.is_active ?? true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    try {
      if (mode === "create") {
        await axiosInstance.post("/affiliates/", form)
      } else if (mode === "edit" && affiliate?.id) {
        await axiosInstance.put(`/affiliates/${affiliate.id}/`, form)
      }
      onSuccess()
    } catch (e) {
      console.error("Error saving affiliate", e)
      alert("Failed to save affiliate")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Affiliate" : "Edit Affiliate"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
          <Input name="slug" placeholder="Slug" value={form.slug} onChange={handleChange} required />

          <div>
            <label className="text-sm font-medium">Commission Type</label>
            <select
              name="commission_type"
              value={form.commission_type}
              onChange={handleChange}
              className="w-full border rounded p-2 bg-background text-foreground dark:bg-slate-900 dark:border-slate-700"
            >
              <option value="flat">Flat</option>
              <option value="percent">Percent</option>
            </select>
          </div>
          <Input
            name="commission_value"
            type="number"
            placeholder="Commission"
            value={form.commission_value}
            onChange={handleChange}
          />

          <div>
            <label className="text-sm font-medium">Discount Type</label>
            <select
              name="discount_type"
              value={form.discount_type}
              onChange={handleChange}
              className="w-full border rounded p-2 bg-background text-foreground dark:bg-slate-900 dark:border-slate-700"
            >
              <option value="flat">Flat</option>
              <option value="percent">Percent</option>
            </select>
          </div>
          <Input
            name="discount_value"
            type="number"
            placeholder="Discount"
            value={form.discount_value}
            onChange={handleChange}
          />

          <div>
            <label className="text-sm font-medium">Status</label>
            <select
              name="is_active"
              value={form.is_active ? "true" : "false"}
              onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.value === "true" }))}
              className="w-full border rounded p-2 bg-background text-foreground dark:bg-slate-900 dark:border-slate-700"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
