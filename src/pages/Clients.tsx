// src/pages/clients/Clients.tsx
import { useMemo, useState } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import mockData from "@/data/mockData.json"

type ClientRow = {
  name: string
  startDate: string
  mrn: string
  subscription: string | number
  productName: string
  email: string
  phone: string
  orders: number | string
  // optional fields present in mock dataset
  status?: string
  patientStatus?: string
}

const clientColumns = [
  { key: "name", label: "Name" },
  { key: "startDate", label: "Start Date" },
  { key: "mrn", label: "MRN #" },
  { key: "subscription", label: "Subscription" },
  { key: "productName", label: "Product Name" },
  { key: "email", label: "Email" },
  {
    key: "phone",
    label: "Phone Number",
    render: (value: string) => <span className="font-mono text-sm">{value}</span>,
  },
  { key: "orders", label: "Order(s)" },
]

const statusPills = ["All", "Active", "Pending", "Abandon", "Canceled"]

export default function Clients() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>("All")

  // Normalize data to ensure we always have a `status` we can filter on
  const base: ClientRow[] = useMemo(
    () =>
      (mockData.patients as ClientRow[]).map((p) => ({
        ...p,
        status: p.status ?? p.patientStatus ?? "Active",
      })),
    []
  )

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return base
      .filter((r) =>
        status === "All" ? true : (r.status || "").toLowerCase() === status.toLowerCase()
      )
      .filter((r) =>
        [
          r.name,
          r.mrn,
          r.email,
          r.phone,
          String(r.subscription),
          r.productName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
  }, [base, status, search])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clients</h1>
        <div className="flex items-center gap-2">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add New
          </Button>
        </div>
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-2">
        {statusPills.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={status === s ? "default" : "outline"}
            onClick={() => setStatus(s)}
            className={status === s ? "bg-primary text-primary-foreground" : ""}
          >
            {s}
          </Button>
        ))}
      </div>

      {/* Table: built-in toolbar provides search, date range, Reset Filters, Export */}
      <DataTable
        data={rows}
        columns={clientColumns}
        searchPlaceholder="Search by Patient ID, name, email, phone number, MRN#"
        showDatePicker
        showExport
        onSearch={setSearch}
        // Optionally wire these if your DataTable supports them:
        // onFilter={() => setStatus("All")}
        // onRefresh={() => {/* fetch from API when you switch off mock data */}}
      />
    </div>
  )
}
