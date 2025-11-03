// src/pages/dashboard/Products.tsx
import { useEffect, useMemo, useState, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Pencil } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { productApi, Product, TREATMENT_OPTIONS, PURCHASE_TYPE_OPTIONS, RX_OTC_OPTIONS, PRODUCT_TYPE_OPTIONS } from "@/api/products"
import AddProductForm from "@/components/products/AddProductForm"
import { StatCard } from "@/components/ui/stat-card"
import { useToast } from "@/hooks/use-toast"
import { DateRange } from "react-day-picker"
import { isWithinInterval, parseISO, format } from "date-fns"

function money(n: number | string) {
  const num = typeof n === "string" ? parseFloat(n) : n
  if (Number.isNaN(num)) return "-"
  return `$${num.toFixed(2)}`
}

const statusFilters = ["All", "Active", "Inactive"];
const treatmentFilters = ["All Treatments", ...TREATMENT_OPTIONS.map(opt => opt.label)];
const purchaseTypeFilters = ["All Types", ...PURCHASE_TYPE_OPTIONS.map(opt => opt.label)];
const rxOtcFilters = ["All", ...RX_OTC_OPTIONS.map(opt => opt.label)];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [activeStatusFilter, setActiveStatusFilter] = useState("All")
  const [activeTreatmentFilter, setActiveTreatmentFilter] = useState("All Treatments")
  const [activePurchaseTypeFilter, setActivePurchaseTypeFilter] = useState("All Types")
  const [activeRxOtcFilter, setActiveRxOtcFilter] = useState("All")
  const [date, setDate] = useState<DateRange | undefined>()

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
    return products.filter((product) => {
      // Search filter
      const q = search.trim().toLowerCase()
      const matchesSearch = !q || [
        product.id,
        product.name,
        product.manufacturer_name,
        product.rx_drug_form,
        product.purchase_type,
        product.ndc_number,
        product.treatment,
        product.generic_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)

      // Status filter
      const matchesStatus =
        activeStatusFilter === "All" ||
        (activeStatusFilter === "Active" && product.is_active) ||
        (activeStatusFilter === "Inactive" && !product.is_active)

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
        product.treatment === treatmentMapping[activeTreatmentFilter]

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
        product.rx_or_otc === rxOtcMapping[activeRxOtcFilter]

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

  const getTreatmentLabel = (value: string) => {
    return TREATMENT_OPTIONS.find((opt) => opt.value === value)?.label || value
  }

  const getPurchaseTypeLabel = (value: string) => {
    return PURCHASE_TYPE_OPTIONS.find((opt) => opt.value === value)?.label || value
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
        showDatePicker={true}
        showResetFilters={true}
        showExport={true}
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
