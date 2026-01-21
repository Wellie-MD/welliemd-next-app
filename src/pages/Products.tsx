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
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize, setPageSize] = useState(5)

  const fetchProducts = async (page: number = 1, customPageSize?: number) => {
    try {
      setLoading(true)
      
      // Use custom page size if provided, otherwise use state
      const currentPageSize = customPageSize !== undefined ? customPageSize : pageSize
      
      // Build filter params
      const params: any = {
        page,
        page_size: currentPageSize,
      }
      
      // Add search
      if (search.trim()) {
        params.search = search.trim()
      }
      
      // Add status filter
      if (activeStatusFilter !== "All") {
        params.is_active = activeStatusFilter === "Active"
      }
      
      // Add treatment filter
      if (activeTreatmentFilter !== "All Treatments") {
        const treatmentMapping: Record<string, string> = {
          "Weight Loss": "weight_loss",
          "Erectile Dysfunction": "ed",
          "GLP": "glp",
          "Individualized GLP": "individualized_glp",
          "General": "general",
        }
        params.treatment = treatmentMapping[activeTreatmentFilter]
      }
      
      // Add purchase type filter
      if (activePurchaseTypeFilter !== "All Types") {
        const purchaseTypeMapping: Record<string, string> = {
          "One Time": "one_time",
          "Subscription": "subscription",
        }
        params.purchase_type = purchaseTypeMapping[activePurchaseTypeFilter]
      }
      
      // Add RX/OTC filter
      if (activeRxOtcFilter !== "All") {
        const rxOtcMapping: Record<string, string> = {
          "RX": "rx",
          "OTC": "otc",
        }
        params.rx_or_otc = rxOtcMapping[activeRxOtcFilter]
      }
      
      const response = (await productApi.listProducts(params)) as any
      
      // Handle paginated response
      if (response && typeof response === "object" && "results" in response) {
        const items: Product[] = response.results ?? []
        setProducts(items)
        setTotalCount(response.count || 0)
        setTotalPages(Math.ceil((response.count || 0) / currentPageSize))
        setCurrentPage(page)
      } else if (Array.isArray(response)) {
        setProducts(response)
        setTotalCount(response.length)
        setTotalPages(1)
        setCurrentPage(1)
      }
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
    fetchProducts(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Refetch when filters change
  useEffect(() => {
    if (currentPage === 1) {
      fetchProducts(1, pageSize)
    } else {
      setCurrentPage(1)
      fetchProducts(1, pageSize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, activeStatusFilter, activeTreatmentFilter, activePurchaseTypeFilter, activeRxOtcFilter])

  // Apply only client-side date filter since backend doesn't support it
  const filtered = useMemo(() => {
    if (!date?.from && !date?.to) {
      return products
    }
    
    return products.filter((product) => {
      // Date range filter
      try {
        const productDate = parseISO(product.created_at)
        if (date.from && date.to) {
          return isWithinInterval(productDate, {
            start: date.from,
            end: date.to,
          })
        } else if (date.from) {
          return productDate >= date.from
        } else if (date.to) {
          return productDate <= date.to
        }
      } catch {
        return false
      }
      return true
    })
  }, [products, date])

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
    setCurrentPage(1)
  }, [])

  const handleRefresh = useCallback(() => {
    fetchProducts(currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage])
  
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    fetchProducts(page, pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize])
  
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
    fetchProducts(1, newPageSize)
  }, [fetchProducts])

  const columns = [
    { 
      key: "name", 
      label: "Product Name",
      width: "150px",
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
      width: "100px",
      render: (value: unknown, row: Product) => {
        return <Badge variant="outline">{getTreatmentLabel(row.treatment)}</Badge>
      },
    },
    {
      key: "category_name",
      label: "Category",
      width: "120px",
      render: (v: string) => v || "-",
    },
    {
      key: "manufacturer_name",
      label: "Manufacturer",
      width: "150px",
      render: (v: string) => v || "-",
    },
    {
      key: "rx_drug_form",
      label: "Form",
      width: "100px",
      render: (v: string) => v ? v.charAt(0).toUpperCase() + v.slice(1) : "-",
    },
    {
      key: "purchase_type",
      label: "Type",
      width: "100px",
      render: (value: unknown, row: Product) => {
        return <Badge variant="secondary">{getPurchaseTypeLabel(row.purchase_type)}</Badge>
      },
    },
    {
      key: "cost_to_client",
      label: "Price",
      width: "100px",
      render: (value: unknown, row: Product) => {
        return money(row.cost_to_client ?? row.base_price)
      },
    },
    {
      key: "quantity",
      label: "Qty",
      width: "100px",
      render: (v: string) => v || "-",
    },
    {
      key: "is_active",
      label: "Status",
      width: "100px",
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
      width: "50px",
      render: (value: unknown, row: Product) => {
        return (
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="hover:opacity-80 text-blue-600 px-2"
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
          value={totalCount.toString()}
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
        loading={loading}
        pagination={{
          currentPage,
          totalPages,
          pageSize,
          totalCount,
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange,
        }}
      />
    </div>
  )
}
