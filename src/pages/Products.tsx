// src/pages/dashboard/Products.tsx
import { useEffect, useMemo, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Plus } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import axiosInstance from "@/api/axiosInstance"
import AddProductForm from "@/components/products/AddProductForm"
import { ProductFormModal } from "@/components/products/ProductFormModal"
import { StatCard } from "@/components/ui/stat-card"
import { DateRange } from "react-day-picker"
import { isWithinInterval, parseISO, format } from "date-fns"
import { 
  TREATMENT_OPTIONS, 
  PURCHASE_TYPE_OPTIONS, 
  RX_OTC_OPTIONS,
  PRODUCT_TYPE_OPTIONS 
} from "@/api/products"

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

function money(n: number | string | undefined | null) {
  if (n === undefined || n === null) return "-"
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
const getRow = <T,>(...args: unknown[]): T => (args.length >= 2 ? args[1] : args[0])

const statusFilters = ["All", "Active", "Inactive"];
const treatmentFilters = ["All Treatments", ...TREATMENT_OPTIONS.map(opt => opt.label)];
const purchaseTypeFilters = ["All Types", ...PURCHASE_TYPE_OPTIONS.map(opt => opt.label)];
const rxOtcFilters = ["All", ...RX_OTC_OPTIONS.map(opt => opt.label)];

export default function Products() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<Product | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [activeStatusFilter, setActiveStatusFilter] = useState("All")
  const [activeTreatmentFilter, setActiveTreatmentFilter] = useState("All Treatments")
  const [activePurchaseTypeFilter, setActivePurchaseTypeFilter] = useState("All Types")
  const [activeRxOtcFilter, setActiveRxOtcFilter] = useState("All")
  const [date, setDate] = useState<DateRange | undefined>()

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
    return products.filter((product) => {
      // Search filter
      const q = search.trim().toLowerCase()
      const matchesSearch = !q || [
        product.id,
        product.name,
        product.manufacturer_name,
        product.rx_drug_form,
        product.purchase_type,
        product.ndic_number,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)

      // Status filter - check if product has is_active field
      const isActive = (product as any).is_active !== undefined ? (product as any).is_active : true
      const matchesStatus =
        activeStatusFilter === "All" ||
        (activeStatusFilter === "Active" && isActive) ||
        (activeStatusFilter === "Inactive" && !isActive)

      // Treatment filter
      const treatmentMapping: Record<string, string> = {
        "Weight Loss": "weight_loss",
        "Erectile Dysfunction": "ed",
        "GLP": "glp",
        "Individualized GLP": "individualized_glp",
        "General": "general",
      }
      const matchesTreatment =
        activeTreatmentFilter === "All Treatments" ||
        (product as any).treatment === treatmentMapping[activeTreatmentFilter]

      // Purchase Type filter
      const purchaseTypeMapping: Record<string, string> = {
        "One Time": "one_time",
        "Subscription": "subscription",
      }
      const matchesPurchaseType =
        activePurchaseTypeFilter === "All Types" ||
        product.purchase_type === purchaseTypeMapping[activePurchaseTypeFilter]

      // RX/OTC filter
      const rxOtcMapping: Record<string, string> = {
        "RX": "rx",
        "OTC": "otc",
      }
      const matchesRxOtc =
        activeRxOtcFilter === "All" ||
        (product as any).rx_or_otc === rxOtcMapping[activeRxOtcFilter]

      // Date range filter
      let matchesDateRange = true
      if (date?.from || date?.to) {
        try {
          const productDate = parseISO(product.created_at)
          if (date.from && date.to) {
            matchesDateRange = isWithinInterval(productDate, {
              start: date.from,
              end: date.to,
            })
          } else if (date.from) {
            matchesDateRange = productDate >= date.from
          } else if (date.to) {
            matchesDateRange = productDate <= date.to
          }
        } catch {
          matchesDateRange = false
        }
      }

      return matchesSearch && matchesStatus && matchesTreatment && matchesPurchaseType && matchesRxOtc && matchesDateRange
    })
  }, [products, search, activeStatusFilter, activeTreatmentFilter, activePurchaseTypeFilter, activeRxOtcFilter, date])

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

  // Create filter configuration for DataTable
  const filters = [
    // Status filters
    ...statusFilters.map((status) => ({
      key: `status-${status}`,
      label: status,
      type: "button" as const,
      value: activeStatusFilter === status ? status : undefined,
      onClick: () => setActiveStatusFilter(status),
    })),
    // Treatment filters
    ...treatmentFilters.map((treatment) => ({
      key: `treatment-${treatment}`,
      label: treatment,
      type: "button" as const,
      value: activeTreatmentFilter === treatment ? treatment : undefined,
      onClick: () => setActiveTreatmentFilter(treatment),
    })),
    // Purchase Type filters
    ...purchaseTypeFilters.map((type) => ({
      key: `purchase-${type}`,
      label: type,
      type: "button" as const,
      value: activePurchaseTypeFilter === type ? type : undefined,
      onClick: () => setActivePurchaseTypeFilter(type),
    })),
    // RX/OTC filters
    ...rxOtcFilters.map((rxOtc) => ({
      key: `rxotc-${rxOtc}`,
      label: rxOtc,
      type: "button" as const,
      value: activeRxOtcFilter === rxOtc ? rxOtc : undefined,
      onClick: () => setActiveRxOtcFilter(rxOtc),
    })),
  ]

  const handleResetFilters = useCallback(() => {
    setActiveStatusFilter("All")
    setActiveTreatmentFilter("All Treatments")
    setActivePurchaseTypeFilter("All Types")
    setActiveRxOtcFilter("All")
    setDate(undefined)
    setSearch("")
  }, [])

  const handleRefresh = useCallback(() => {
    fetchProducts()
  }, [])

  const columns = [
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
      render: (v: string) => {
        const formatted = v === "one_time" ? "One Time" : v === "subscription" ? "Subscription" : v || "-";
        return <Badge variant="secondary">{formatted}</Badge>;
      },
    },
    {
      key: "price",
      label: "Price",
      render: (v: number | string) => money(v),
    },
    {
      key: "created_at",
      label: "Created At",
      render: (...args: unknown[]) => {
        const row = getRow<Product>(...args)
        try {
          const date = parseISO(row.created_at)
          return format(date, "MM/dd/yyyy")
        } catch {
          return dateOnly(row.created_at)
        }
      },
    },
    {
      key: "__actions",
      label: "",
      render: (...args: unknown[]) => {
        const row = getRow<Product>(...args)
        return (
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="hover:opacity-80"
              title="Edit"
              onClick={() => {
                setSelectedProduct(row);
                setModalOpen(true);
              }}
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Products</span>
            <span>›</span>
            <span>Products</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/products/assign")}
          >
            Assign Product
          </Button>
          <Button
            onClick={() => {
              setSelectedProduct(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
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

      {/* Product Form Modal */}
      <ProductFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        product={selectedProduct}
        onSuccess={() => {
          setModalOpen(false);
          setSelectedProduct(null);
          fetchProducts();
        }}
      />

      {/* Table */}
      <DataTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search by name, product ID, pharmacy, manufacturer or generic form"
        showDatePicker={true}
        showResetFilters={true}
        showExport={false}
        filters={filters}
        dateRange={date}
        onDateRangeChange={setDate}
        onSearch={setSearch}
        onResetFilters={handleResetFilters}
        onRefresh={handleRefresh}
      />
    </div>
  )
}
