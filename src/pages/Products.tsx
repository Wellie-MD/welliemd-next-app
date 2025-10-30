// src/pages/dashboard/Products.tsx
import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Pencil } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { productApi, Product, TREATMENT_OPTIONS, PURCHASE_TYPE_OPTIONS } from "@/api/products"
import AddProductForm from "@/components/products/AddProductForm"
import { StatCard } from "@/components/ui/stat-card"
import { useToast } from "@/hooks/use-toast"

function money(n: number | string) {
  const num = typeof n === "string" ? parseFloat(n) : n
  if (Number.isNaN(num)) return "-"
  return `$${num.toFixed(2)}`
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const items = await productApi.listProducts()
      setProducts(items)
    } catch (e) {
      console.error("Failed to fetch products:", e)
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      })
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        p.ndc_number,
        p.treatment,
        p.generic_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    )
  }, [products, search])

  const getTreatmentLabel = (value: string) => {
    return TREATMENT_OPTIONS.find((opt) => opt.value === value)?.label || value
  }

  const getPurchaseTypeLabel = (value: string) => {
    return PURCHASE_TYPE_OPTIONS.find((opt) => opt.value === value)?.label || value
  }

  const columns = [
    { 
      key: "name", 
      label: "Product Name",
      render: (value: unknown, row: Product) => {
        return (
          <div className="flex flex-col">
            <span className="font-medium">{row.name}</span>
            {row.generic_name && (
              <span className="text-xs text-muted-foreground">{row.generic_name}</span>
            )}
          </div>
        )
      }
    },
    {
      key: "treatment",
      label: "Treatment",
      render: (value: unknown, row: Product) => {
        return <Badge variant="outline">{getTreatmentLabel(row.treatment)}</Badge>
      },
    },
    {
      key: "manufacturer_name",
      label: "Manufacturer",
      render: (v: string) => v || "-",
    },
    {
      key: "rx_drug_form",
      label: "Form",
      render: (v: string) => v ? v.charAt(0).toUpperCase() + v.slice(1) : "-",
    },
    {
      key: "purchase_type",
      label: "Type",
      render: (value: unknown, row: Product) => {
        return <Badge variant="secondary">{getPurchaseTypeLabel(row.purchase_type)}</Badge>
      },
    },
    {
      key: "base_price",
      label: "Price",
      render: (value: unknown, row: Product) => {
        return money(row.base_price)
      },
    },
    {
      key: "quantity",
      label: "Qty",
      render: (v: string) => v || "-",
    },
    {
      key: "is_active",
      label: "Status",
      render: (value: unknown, row: Product) => {
        return (
          <Badge variant={row.is_active ? "default" : "secondary"}>
            {row.is_active ? "Active" : "Inactive"}
          </Badge>
        )
      },
    },
    {
      key: "__actions",
      label: "",
      render: (value: unknown, row: Product) => {
        return (
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="hover:opacity-80 text-blue-600"
              title="Edit"
              onClick={() => setEditing(row)}
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage products assigned to you by the admin
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={products.length.toString()}
          className="bg-muted/30"
        />
        <StatCard
          title="Active Products"
          value={products.filter(p => p.is_active).length.toString()}
          className="bg-muted/30"
        />
        <StatCard
          title="RX Products"
          value={products.filter(p => p.rx_or_otc === "rx").length.toString()}
          className="bg-muted/30"
        />
        <StatCard
          title="OTC Products"
          value={products.filter(p => p.rx_or_otc === "otc").length.toString()}
          className="bg-muted/30"
        />
      </div>

      {/* Edit modal */}
      {editing && (
        <AddProductForm
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
      )}

      {/* Table */}
      <DataTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search by name, manufacturer, treatment, or NDC number"
        showDatePicker={false}
        showExport={true}
        onSearch={setSearch}
        onRefresh={fetchProducts}
      />
    </div>
  )
}
