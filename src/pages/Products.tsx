// src/pages/dashboard/Products.tsx
import { useCallback, useEffect, useMemo, useState } from "react"
import { format, parseISO } from "date-fns"
import { ChevronLeft, ChevronRight, Loader2, RotateCcw, Search } from "lucide-react"

import { productApi, Product, ProductListParams, PURCHASE_TYPE_OPTIONS } from "@/api/products"
import AddProductForm from "@/components/products/AddProductForm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const ALL_VALUE = "all"
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50]

type Option = {
  value: string
  label: string
}

function formatDate(value?: string) {
  if (!value) return "-"
  try {
    return format(parseISO(value), "MM/dd/yyyy")
  } catch {
    return "-"
  }
}

function formatDrugForm(value?: string) {
  if (!value) return "-"
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

function getPurchaseTypeLabel(value?: string) {
  if (!value) return "-"
  return PURCHASE_TYPE_OPTIONS.find((opt) => opt.value === value)?.label || value
}

function dedupeOptions(options: Option[]) {
  const seen = new Set<string>()
  return options.filter((option) => {
    if (!option.value || seen.has(option.value)) return false
    seen.add(option.value)
    return true
  })
}

function extractProducts(response: unknown): Product[] {
  if (response && typeof response === "object" && "results" in response) {
    return ((response as { results?: Product[] }).results ?? [])
  }
  return Array.isArray(response) ? response as Product[] : []
}

function getProductPharmacyName(product: Product) {
  return product.pharmacy_name?.trim() || ""
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [optionProducts, setOptionProducts] = useState<Product[]>([])
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState(ALL_VALUE)
  const [purchaseType, setPurchaseType] = useState(ALL_VALUE)
  const [pharmacy, setPharmacy] = useState(ALL_VALUE)
  const [status, setStatus] = useState(ALL_VALUE)
  const [treatmentType, setTreatmentType] = useState(ALL_VALUE)
  const [editing, setEditing] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize, setPageSize] = useState(50)
  const { toast } = useToast()

  const fetchProducts = useCallback(async (page = 1, size = pageSize) => {
    try {
      setLoading(true)

      const params: ProductListParams = {
        page,
        page_size: size,
      }

      if (search.trim()) params.search = search.trim()
      if (category !== ALL_VALUE) params.category = category
      if (purchaseType !== ALL_VALUE) params.purchase_type = purchaseType as ProductListParams["purchase_type"]
      if (pharmacy !== ALL_VALUE) params.pharmacy = pharmacy
      if (status !== ALL_VALUE) params.is_active = status === "active"
      if (treatmentType !== ALL_VALUE) params.treatment_type = treatmentType

      const response = await productApi.listProducts(params)

      if (response && typeof response === "object" && "results" in response) {
        const count = Number((response as { count?: number }).count || 0)
        setProducts(extractProducts(response))
        setTotalCount(count)
        setTotalPages(Math.max(1, Math.ceil(count / size)))
      } else {
        const items = extractProducts(response)
        setProducts(items)
        setTotalCount(items.length)
        setTotalPages(1)
      }

      setCurrentPage(page)
    } catch (e) {
      console.error("Failed to fetch products:", e)
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      })
      setProducts([])
      setTotalCount(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [category, pageSize, pharmacy, purchaseType, search, status, toast, treatmentType])

  useEffect(() => {
    fetchProducts(1, pageSize)
  }, [fetchProducts, pageSize])

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [categories, productsResponse] = await Promise.all([
          productApi.getCouponCategories(),
          productApi.listProducts({ page: 1, page_size: 1000 }),
        ])

        setCategoryOptions(
          (categories.categories || []).map((item) => ({
            value: String(item.id),
            label: item.name,
          }))
        )
        setOptionProducts(extractProducts(productsResponse))
      } catch (e) {
        console.error("Failed to fetch product filter options:", e)
        setCategoryOptions([])
        setOptionProducts([])
      }
    }

    fetchFilterOptions()
  }, [])

  const allKnownProducts = useMemo(
    () => dedupeOptions([...optionProducts, ...products].map((product) => ({
      value: product.id,
      label: product.name,
    }))).map((option) => option.value)
      .map((id) => [...optionProducts, ...products].find((product) => product.id === id))
      .filter(Boolean) as Product[],
    [optionProducts, products]
  )

  const mergedCategoryOptions = useMemo(() => {
    const fromProducts = allKnownProducts
      .filter((product) => product.category_name && product.category)
      .map((product) => ({
        value: String(product.category),
        label: product.category_name || String(product.category),
      }))

    return dedupeOptions([...categoryOptions, ...fromProducts]).sort((a, b) =>
      a.label.localeCompare(b.label)
    )
  }, [allKnownProducts, categoryOptions])

  const pharmacyOptions = useMemo(() => {
    const byPharmacyId = new Map<string, string>()

    for (const product of allKnownProducts) {
      const pharmacyId = product.pharmacy ? String(product.pharmacy) : ""
      const pharmacyName = getProductPharmacyName(product)
      if (pharmacyId && pharmacyName) {
        byPharmacyId.set(pharmacyId, pharmacyName)
      }
    }

    return Array.from(byPharmacyId.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [allKnownProducts])

  const treatmentTypeOptions = useMemo(
    () =>
      dedupeOptions(
        allKnownProducts
          .filter((product) => product.treatment_type_id && product.treatment_type_name)
          .map((product) => ({
            value: String(product.treatment_type_id),
            label: String(product.treatment_type_name),
          })),
      ).sort((a, b) => a.label.localeCompare(b.label)),
    [allKnownProducts],
  )

  const hasActiveFilters =
    category !== ALL_VALUE ||
    purchaseType !== ALL_VALUE ||
    pharmacy !== ALL_VALUE ||
    status !== ALL_VALUE ||
    treatmentType !== ALL_VALUE ||
    Boolean(search.trim())

  const showingStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const showingEnd = Math.min(currentPage * pageSize, totalCount)

  const resetFilters = () => {
    setCategory(ALL_VALUE)
    setPurchaseType(ALL_VALUE)
    setPharmacy(ALL_VALUE)
    setStatus(ALL_VALUE)
    setTreatmentType(ALL_VALUE)
    setSearch("")
    setCurrentPage(1)
  }

  const handlePageSizeChange = (value: string) => {
    const nextPageSize = Number(value)
    setPageSize(nextPageSize)
    setCurrentPage(1)
  }

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950/20 px-4 py-6 sm:px-7 lg:px-9">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-[26px] font-bold leading-8 tracking-normal text-slate-950 dark:text-slate-50">
            Products
          </h1>
          <div className="mt-1 flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <span>Home</span>
            <span className="text-slate-400 dark:text-slate-500">›</span>
            <span>Products</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-7">
            <FilterSelect
              label="Category"
              value={category}
              placeholder="All Categories"
              options={mergedCategoryOptions}
              onValueChange={(value) => {
                setCategory(value)
                setCurrentPage(1)
              }}
            />
            <FilterSelect
              label="Purchase Type"
              value={purchaseType}
              placeholder="All Types"
              options={PURCHASE_TYPE_OPTIONS}
              onValueChange={(value) => {
                setPurchaseType(value)
                setCurrentPage(1)
              }}
            />
            <FilterSelect
              label="Pharmacy"
              value={pharmacy}
              placeholder="All Pharmacies"
              options={pharmacyOptions}
              onValueChange={(value) => {
                setPharmacy(value)
                setCurrentPage(1)
              }}
            />
            <FilterSelect
              label="Treatment Type"
              value={treatmentType}
              placeholder="All Treatment Types"
              options={treatmentTypeOptions}
              onValueChange={(value) => {
                setTreatmentType(value)
                setCurrentPage(1)
              }}
            />
            <FilterSelect
              label="Status"
              value={status}
              placeholder="All Statuses"
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
              onValueChange={(value) => {
                setStatus(value)
                setCurrentPage(1)
              }}
            />
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-normal text-slate-500 dark:text-slate-400">
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Search products..."
                  className="h-11 w-full rounded-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 text-xs sm:text-[15px] text-slate-700 dark:text-slate-200 shadow-none placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-sky-300"
                />
              </div>
            </div>
            {hasActiveFilters && (
              <div className="flex items-end col-span-1 sm:col-span-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetFilters}
                  className="h-11 w-full sm:w-auto rounded-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 text-xs sm:text-[15px] font-semibold text-slate-950 dark:text-slate-200 shadow-none hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Filters
                </Button>
              </div>
            )}
          </div>

          <div className="pb-1 sm:pb-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400 2xl:text-right whitespace-nowrap">
            Showing {showingStart}-{showingEnd} of {totalCount}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {/* Mobile View (< md) */}
          <div className="block md:hidden divide-y divide-slate-200 dark:divide-slate-800">
            {loading ? (
              <div className="h-40 flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading products...</span>
              </div>
            ) : products.length > 0 ? (
              products.map((product) => (
                <div
                  key={product.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setEditing(product)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") setEditing(product)
                  }}
                  className="p-4 cursor-pointer space-y-2.5 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-sm text-slate-950 dark:text-slate-100">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {getProductPharmacyName(product) || "No Pharmacy"} • {formatDrugForm(product.rx_drug_form)}
                      </p>
                    </div>
                    <Pill tone={product.is_active ? "green" : "red"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </Pill>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1 text-xs">
                    <Pill tone="blue">{product.category_name || "Uncategorized"}</Pill>
                    <Pill tone="blue">{getPurchaseTypeLabel(product.purchase_type)}</Pill>
                    {product.treatment_type_name && (
                      <Pill tone="blue">{product.treatment_type_name}</Pill>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="h-36 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                No products found.
              </div>
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <Table className="min-w-[1120px] text-[15px]">
              <TableHeader>
                <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
                  <ProductTableHead className="w-[35%]">Name</ProductTableHead>
                  <ProductTableHead>Category</ProductTableHead>
                  <ProductTableHead>Pharmacy</ProductTableHead>
                  <ProductTableHead className="whitespace-nowrap">Drug Form</ProductTableHead>
                  <ProductTableHead>Status</ProductTableHead>
                  <ProductTableHead className="whitespace-nowrap">Purchase Type</ProductTableHead>
                  <ProductTableHead>
                    <span className="whitespace-nowrap">Treatment Type</span> /{" "}
                    <span className="whitespace-nowrap">Routing (New)</span>
                  </ProductTableHead>
                  <ProductTableHead className="whitespace-nowrap">Created At</ProductTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-40 text-center">
                      <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading products...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : products.length > 0 ? (
                  products.map((product) => (
                    <TableRow
                      key={product.id}
                      tabIndex={0}
                      role="button"
                      onClick={() => setEditing(product)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") setEditing(product)
                      }}
                      className="h-[62px] cursor-pointer border-slate-200 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    >
                      <ProductTableCell className="font-semibold text-slate-950 dark:text-slate-100">
                        {product.name}
                      </ProductTableCell>
                      <ProductTableCell>
                        <Pill tone="blue">{product.category_name || "-"}</Pill>
                      </ProductTableCell>
                      <ProductTableCell>{getProductPharmacyName(product) || "-"}</ProductTableCell>
                      <ProductTableCell>{formatDrugForm(product.rx_drug_form)}</ProductTableCell>
                      <ProductTableCell>
                        <Pill tone={product.is_active ? "green" : "red"}>
                          {product.is_active ? "Active" : "Inactive"}
                        </Pill>
                      </ProductTableCell>
                      <ProductTableCell>
                        <Pill tone="blue">{getPurchaseTypeLabel(product.purchase_type)}</Pill>
                      </ProductTableCell>
                      <ProductTableCell>
                        {product.product_type === "supply" ? (
                          <span className="text-xs text-slate-400">Not applicable</span>
                        ) : (
                          <div className="space-y-1">
                            <Pill tone={product.treatment_type_name ? "blue" : "red"}>
                              {product.treatment_type_name || "Unassigned"}
                            </Pill>
                            {product.treatment_type_is_active === false && (
                              <Pill tone="red">Inactive Treatment Type</Pill>
                            )}
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              Intake: {product.derived_intake_visit_type || "Not configured"}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              Follow-up: {product.derived_followup_visit_type || "Not configured"}
                            </div>
                          </div>
                        )}
                      </ProductTableCell>
                      <ProductTableCell>{formatDate(product.created_at)}</ProductTableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-40 text-center text-sm text-slate-500 dark:text-slate-400">
                      No products found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-200 dark:border-slate-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <span>Rows per page</span>
              <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="h-9 w-[72px] rounded-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-755 dark:text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 disabled:bg-slate-50 dark:disabled:bg-slate-950 disabled:text-slate-300 dark:disabled:text-slate-700"
                  disabled={currentPage <= 1 || loading}
                  onClick={() => fetchProducts(currentPage - 1, pageSize)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-955 dark:text-slate-200 disabled:bg-slate-50 dark:disabled:bg-slate-950 disabled:text-slate-300 dark:disabled:text-slate-700"
                  disabled={currentPage >= totalPages || loading}
                  onClick={() => fetchProducts(currentPage + 1, pageSize)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {editing && (
          <AddProductForm
            product={editing}
            open={Boolean(editing)}
            onOpenChange={(open) => {
              if (!open) setEditing(null)
            }}
            onSuccess={() => {
              setEditing(null)
              fetchProducts(currentPage, pageSize)
            }}
          />
        )}
      </div>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  placeholder,
  options,
  onValueChange,
}: {
  label: string
  value: string
  placeholder: string
  options: Option[]
  onValueChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-normal text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-11 w-full rounded-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 text-[15px] text-slate-500 dark:text-slate-300 shadow-none focus:ring-1 focus:ring-sky-300">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function ProductTableHead({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <TableHead
      className={cn(
        "h-11 px-5 text-xs font-bold uppercase tracking-normal text-slate-500 dark:text-slate-400",
        className
      )}
    >
      {children}
    </TableHead>
  )
}

function ProductTableCell({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <TableCell className={cn("px-5 py-3 text-[15px] text-slate-500 dark:text-slate-400", className)}>
      {children}
    </TableCell>
  )
}

function Pill({
  tone,
  children,
}: {
  tone: "blue" | "green" | "red"
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-md px-3 text-sm font-medium",
        tone === "blue" && "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
        tone === "green" && "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
        tone === "red" && "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400"
      )}
    >
      {children}
    </span>
  )
}
