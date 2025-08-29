"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus } from "lucide-react"

const defaultProducts = [
  "Alpha BioMed – GLP-1 Sema 0.25mg - GLP-1Sema (2mg)  0.25mg/week",
  "Alpha BioMed – GLP-1 Sema 1.5mg - GLP-1Sema (10mg) 10.0mg/2ml 2.0 ml",
  "Alpha BioMed – GLP-1 Sema 2.5mg - 2.5mg (GLP-1, 10mg/vial)",
  "Alpha BioMed – GLP-1 Sema 0.5mg - GLP-1 Sema (2mg) 0.5mg/week",
  "Alpha BioMed – GLP-1 Sema 1mg - GLP-1 Sema (5mg) 1.0mg/week",
  "Alpha BioMed – GLP-1 Sema 2mg - 2.0mg (GLP-1, 10mg/vial)",
  "Valiant – Semaglutide (2mg/mL) oral suspension Month 1",
  "Valiant – Semaglutide (2mg/mL) oral suspension Month 2",
  "Valiant – Semaglutide (3mg/mL) oral suspension Month 3",
  "Valiant – Sermorelin Acetate Olympia Injection – 9mg/10mL"
]

export default function CreateClientForm({ onCreate }: { onCreate: (data: any) => void }) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    domain: "",
    portal: "",
    host: "127.0.0.1",
    database: "",
    products: [] as string[],
    patientFee: "",
    asyncClientFee: "",
    asyncCost: "",
    syncClientFee: "",
    syncCost: "",
    monthlySaas: "",
    billingDate: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleCheckbox = (product: string) => {
    setFormData((prev) => {
      const exists = prev.products.includes(product)
      return {
        ...prev,
        products: exists
          ? prev.products.filter((p) => p !== product)
          : [...prev.products, product]
      }
    })
  }

  const handleSubmit = () => {
    onCreate(formData)
    setOpen(false)
    setFormData({
      domain: "",
      portal: "",
      host: "127.0.0.1",
      database: "",
      products: [],
      patientFee: "",
      asyncClientFee: "",
      asyncCost: "",
      syncClientFee: "",
      syncCost: "",
      monthlySaas: "",
      billingDate: ""
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-white">
          <Plus className="h-4 w-4 mr-2" />
          Create Client
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-4xl">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Client Admin Panel Domain*</Label>
            <Input name="domain" value={formData.domain} onChange={handleChange} required />
          </div>
          <div>
            <Label>Patient Portal Domain/Subdomain</Label>
            <Input name="portal" value={formData.portal} onChange={handleChange} />
          </div>
          <div>
            <Label>Database Host/Server</Label>
            <Input name="host" value={formData.host} onChange={handleChange} />
          </div>
          <div>
            <Label>Database Name*</Label>
            <Input name="database" value={formData.database} onChange={handleChange} required />
          </div>
        </div>

        <div className="mt-6">
          <Label className="block mb-2">Choose Products to Deploy</Label>
          <div className="grid grid-cols-2 gap-2">
            {defaultProducts.map((product, idx) => (
              <label key={idx} className="flex items-center gap-2">
                <Checkbox
                  checked={formData.products.includes(product)}
                  onCheckedChange={() => handleCheckbox(product)}
                />
                {product}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div>
            <Label>Patient Fee*</Label>
            <Input name="patientFee" value={formData.patientFee} onChange={handleChange} />
          </div>
          <div>
            <Label>Async Consult Fee to Client*</Label>
            <Input name="asyncClientFee" value={formData.asyncClientFee} onChange={handleChange} />
          </div>
          <div>
            <Label>Async Consult Cost*</Label>
            <Input name="asyncCost" value={formData.asyncCost} onChange={handleChange} />
          </div>
          <div>
            <Label>Sync(Video) Consult Fee to Client*</Label>
            <Input name="syncClientFee" value={formData.syncClientFee} onChange={handleChange} />
          </div>
          <div>
            <Label>Sync Consult Cost*</Label>
            <Input name="syncCost" value={formData.syncCost} onChange={handleChange} />
          </div>
          <div>
            <Label>Monthly SaaS Fee</Label>
            <Input name="monthlySaas" value={formData.monthlySaas} onChange={handleChange} />
          </div>
          <div>
            <Label>First/Next SaaS Fees Billing Date</Label>
            <Input name="billingDate" value={formData.billingDate} onChange={handleChange} type="date" />
          </div>
        </div>

        <div className="mt-6 text-right">
          <Button onClick={handleSubmit}>Create</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
