// src/pages/dashboard/Products.tsx
import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2 } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import axiosInstance from "@/api/axiosInstance"
import AddProductForm from "@/components/products/AddProductForm"
import { StatCard } from "@/components/ui/stat-card"

type Product = {
  id: number | string
  name: string
  description?: string | null
  application_directions?: string | null
  product_image?: string | null

  // Pricing
  price: string | number
  cost: string | number
  base_shipping_cost: string | number
  shipping_fee: string | number

  // Dosage / Quantity
  dose?: string | null
  quantity: number
  refills: number
  rx_quantity: number
  rx_days_supply: number
  rx_drug_form?: string | null

  // Extra Info
  ndic_number?: string | null
  manufacturer_name?: string | null
  purchase_type: string
  safety_info?: string | null
  side_effects?: string | null

  created_at: string
}

function money(n: number | string) {
  const num = typeof n === "string" ? parseFloat(n) : n
  if (Number.isNaN(num)) return "-"
  return `$${num.toFixed(2)}`
}

function dateOnly(iso?: string) {
  if (!iso) return "-"
  try {
    return new Date(iso).toLocaleDateString()
  } catch {
    return "-"
  }
}

// tolerant to DataTable render(value,row) vs render(row)
const getRow = <T,>(...args: any[]): T => (args.length >= 2 ? args[1] : args[0])

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<Product | null>(null)

  const fetchProducts = async () => {
    try {
      const res = await axiosInstance.get("/products/")
      const items: Product[] = res.data?.results ?? res.data ?? []
      setProducts(items)
    } catch (e) {
      console.error("Failed to fetch products:", e)
      setProducts([])
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) =>
      [
        p.id,
        p.name,
        p.manufacturer_name,
        p.rx_drug_form,
        p.purchase_type,
        p.ndic_number,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    )
  }, [products, search])

  const onDelete = async (row: Product) => {
    if (!row) return
    const ok = window.confirm(`Delete product “${row.name}”?`)
    if (!ok) return
    try {
      await axiosInstance.delete(`/products/${row.id}/`)
      alert("Product deleted")
      fetchProducts()
    } catch (e) {
      console.error(e)
      alert("Failed to delete product")
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    {
      key: "manufacturer_name",
      label: "Manufacturer",
      render: (v: string) => v || "-",
    },
    {
      key: "rx_drug_form",
      label: "Drug Form",
      render: (v: string) => v || "-",
    },
    {
      key: "purchase_type",
      label: "Purchase Type",
      render: (v: string) => <Badge variant="secondary">{v || "-"}</Badge>,
    },
    {
      key: "price",
      label: "Price",
      render: (v: number | string) => money(v),
    },
    {
      key: "created_at",
      label: "Created At",
      render: (...args: any[]) => dateOnly(getRow<Product>(...args).created_at),
    },
    {
      key: "__actions",
      label: "",
      render: (...args: any[]) => {
        const row = getRow<Product>(...args)
        return (
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="hover:opacity-80"
              title="Edit"
              onClick={() => setEditing(row)}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="text-red-600 hover:opacity-80"
              title="Delete"
              onClick={() => onDelete(row)}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header (Add New removed) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Products</span>
            <span>›</span>
            <span>Products</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Active Products"
          value={`${products.length} -`}
          className="bg-muted/30 md:col-span-3 md:max-w-md"
        />
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="border p-4 rounded-md bg-white shadow">
          <AddProductForm
            mode="edit"
            product={editing}
            open={!!editing}
            onOpenChange={(v) => {
              if (!v) setEditing(null)
            }}
            onSuccess={() => {
              setEditing(null)
              fetchProducts()
            }}
          />
        </div>
      )}

      {/* Table */}
      <DataTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search by name, product ID, pharmacy, manufacturer or generic form"
        showDatePicker={false}
        showExport={false}
        onSearch={setSearch}
        onRefresh={fetchProducts}
      />
    </div>
  )
}
