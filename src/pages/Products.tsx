// src/pages/dashboard/Products.tsx
import { useEffect, useMemo, useState, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Pencil } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { productApi, Product, TREATMENT_OPTIONS, PURCHASE_TYPE_OPTIONS } from "@/api/products"
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

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [activeStatusFilter, setActiveStatusFilter] = useState("All")
  const [activeTreatmentFilter, setActiveTreatmentFilter] = useState("All Treatments")
  const [date, setDate] = useState<DateRange | undefined>()
  const [categoryOptions, setCategoryOptions] = useState<{ id: string; name: string }[]>([])
  
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
      
      // Add category filter (dynamic per-tenant)
      if (activeTreatmentFilter !== "All Treatments") {
        const matched = categoryOptions.find((c) => c.name === activeTreatmentFilter)
        if (matched) params.category = matched.id
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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await productApi.getCouponCategories()
        setCategoryOptions(res.categories || [])
      } catch (e) {
        console.error("Failed to fetch product categories:", e)
        setCategoryOptions([])
      }
    }
    fetchCategories()
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
  }, [search, activeStatusFilter, activeTreatmentFilter, categoryOptions])

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

  const dynamicTreatmentFilters = useMemo(() => {
    const names = categoryOptions.map((c) => c.name).filter(Boolean)
    return ["All Treatments", ...names]
  }, [categoryOptions])

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
    ...dynamicTreatmentFilters.map((treatment) => ({
      key: `treatment-${treatment}`,
      label: treatment,
      type: "button" as const,
      value: activeTreatmentFilter === treatment ? treatment : undefined,
      onClick: () => setActiveTreatmentFilter(treatment),
    })),
  ]

  const handleResetFilters = useCallback(() => {
    setActiveStatusFilter("All")
    setActiveTreatmentFilter("All Treatments")
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
      key: "base_price",
      label: "Price",
      width: "100px",
      render: (value: unknown, row: Product) => {
        return money(row.base_price)
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
