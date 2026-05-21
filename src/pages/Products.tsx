import { useEffect, useMemo, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Plus } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import axiosInstance from "@/api/axiosInstance"
import { ProductFormModal } from "@/components/products/ProductFormModal"
import { StatCard } from "@/components/ui/stat-card"
import { DateRange } from "react-day-picker"
import { isWithinInterval, parseISO, format } from "date-fns"
import {
  PURCHASE_TYPE_OPTIONS,
  RX_OTC_OPTIONS,
  PRODUCT_TYPE_OPTIONS,
  Product,
} from "@/api/products"
import { productCategoryApi, ProductCategory } from "@/api/productCategories"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

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
const purchaseTypeFilters = ["All Types", ...PURCHASE_TYPE_OPTIONS.map(opt => opt.label)];
const rxOtcFilters = ["All", ...RX_OTC_OPTIONS.map(opt => opt.label)];

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState("All");
  const [activeTreatmentFilter, setActiveTreatmentFilter] =
    useState("All Treatments");
  const [activePurchaseTypeFilter, setActivePurchaseTypeFilter] =
    useState("All Types");
  const [activeRxOtcFilter, setActiveRxOtcFilter] = useState("All");
  const [activeCategoryFilter, setActiveCategoryFilter] =
    useState<string>("all");
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [date, setDate] = useState<DateRange | undefined>();
  // Dynamic treatment options loaded from the analytics API — derived from actual DB values.
  // This automatically includes any free-text treatment slug (e.g. "branded_weight_loss").
  const [treatmentOptions, setTreatmentOptions] = useState<{ id: string; name: string }[]>([]);
  const treatmentFilters = ["All Treatments", ...treatmentOptions.map(t => t.name)];

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(
    async (page: number = 1) => {
      try {
        setLoading(true);

        // Use pageSize from state
        const currentPageSize = pageSize;

        // Build filter params
        const params: unknown = {
          page,
          page_size: currentPageSize,
        };

        // Add search
        if (search.trim()) {
          params.search = search.trim();
        }

        // Add status filter
        if (activeStatusFilter !== "All") {
          params.is_active = activeStatusFilter === "Active";
        }

        // Add treatment filter — use the slug (id) directly from treatmentOptions
        if (activeTreatmentFilter !== "All Treatments") {
          const matched = treatmentOptions.find(t => t.name === activeTreatmentFilter);
          if (matched) params.treatment = matched.id;
        }

        // Add purchase type filter
        if (activePurchaseTypeFilter !== "All Types") {
          const purchaseTypeMapping: Record<string, string> = {
            "One Time": "one_time",
            Subscription: "subscription",
          };
          params.purchase_type = purchaseTypeMapping[activePurchaseTypeFilter];
        }

        // Add RX/OTC filter
        if (activeRxOtcFilter !== "All") {
          const rxOtcMapping: Record<string, string> = {
            RX: "rx",
            OTC: "otc",
          };
          params.rx_or_otc = rxOtcMapping[activeRxOtcFilter];
        }

        // Add category filter
        if (activeCategoryFilter !== "all") {
          params.category = activeCategoryFilter;
        }

        const res = await axiosInstance.get("/products/", { params });

        // Handle paginated response
        if (res.data && typeof res.data === "object" && "results" in res.data) {
          const items: Product[] = res.data.results ?? [];
          setProducts(items);
          setTotalCount(res.data.count || 0);
          setTotalPages(Math.ceil((res.data.count || 0) / currentPageSize));
          setCurrentPage(page);
        } else if (Array.isArray(res.data)) {
          setProducts(res.data);
          setTotalCount(res.data.length);
          setTotalPages(1);
          setCurrentPage(1);
        }
      } catch (e) {
        console.error("Failed to fetch products:", e);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [
      pageSize,
      search,
      activeStatusFilter,
      activeTreatmentFilter,
      activePurchaseTypeFilter,
      activeRxOtcFilter,
      activeCategoryFilter,
    ]
  );

  const fetchCategories = async () => {
    try {
      const data = await productCategoryApi.listCategories();
      setCategories(data);
    } catch (e) {
      console.error("Failed to fetch categories:", e);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchProducts(1);
    fetchCategories();
    // Fetch dynamic treatment options from the analytics API.
    axiosInstance.get("/analytics/filters/treatments/")
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
        setTreatmentOptions(data);
      })
      .catch(e => console.error("Failed to fetch treatment options:", e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when filters or pageSize change (reset to page 1)
  useEffect(() => {
    setCurrentPage(1);
    fetchProducts(1);
  }, [fetchProducts]);

  // Apply only client-side date filter since backend doesn't support it
  const filtered = useMemo(() => {
    if (!date?.from && !date?.to) {
      return products;
    }

    return products.filter((product) => {
      // Date range filter
      try {
        const productDate = parseISO(product.created_at);
        if (date.from && date.to) {
          return isWithinInterval(productDate, {
            start: date.from,
            end: date.to,
          });
        } else if (date.from) {
          return productDate >= date.from;
        } else if (date.to) {
          return productDate <= date.to;
        }
      } catch {
        return false;
      }
      return true;
    });
  }, [products, date]);

  const onDelete = async (row: Product) => {
    if (!row) return;
    const ok = window.confirm(`Delete product “${row.name}”?`);
    if (!ok) return;
    try {
      await axiosInstance.delete(`/products/${row.id}/`);
      alert("Product deleted");
      fetchProducts();
    } catch (e) {
      console.error(e);
      alert("Failed to delete product");
    }
  };

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
  ];

  const handleResetFilters = useCallback(() => {
    setActiveStatusFilter("All");
    setActiveTreatmentFilter("All Treatments");
    setActivePurchaseTypeFilter("All Types");
    setActiveRxOtcFilter("All");
    setActiveCategoryFilter("all");
    setCategorySearch("");
    setDate(undefined);
    setSearch("");
    setCurrentPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    fetchProducts(currentPage);
  }, [currentPage, fetchProducts]);

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      fetchProducts(page);
    },
    [fetchProducts]
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      setPageSize(newPageSize);
      setCurrentPage(1);
      // Don't call fetchProducts here - useEffect will handle it
    },
    []
  );

  const columns = [
    { key: "name", label: "Name" },
    {
      key: "category_name",
      label: "Category",
      render: (...args: unknown[]) => {
        const row = getRow<Product>(...args);
        const categoryId = (row as unknown).category;
        if (!categoryId)
          return <span className="text-muted-foreground">-</span>;
        const category = categories.find((c) => c.id === categoryId);
        return category ? (
          <Badge variant="outline">{category.name}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      key: "manufacturer_name",
      label: "Manufacturer",
      render: (v: string) => v || "-",
    },
    {
      key: "is_lab_product",
      label: "Lab Product",
      render: (...args: unknown[]) => {
        const row = getRow<Product>(...args);
        return row.is_lab_product ? (
          <Badge variant="default">Lab</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      key: "junction_lab_test_name_snapshot",
      label: "Junction Test",
      render: (v: string, row: Product) => {
        if (!row.is_lab_product) return <span className="text-muted-foreground">-</span>;
        return v ? <span className="text-sm">{v}</span> : <span className="text-muted-foreground">-</span>;
      },
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
        const formatted =
          v === "one_time"
            ? "One Time"
            : v === "subscription"
              ? "Subscription"
              : v || "-";
        return <Badge variant="secondary">{formatted}</Badge>;
      },
    },
    {
      key: "created_at",
      label: "Created At",
      render: (...args: unknown[]) => {
        const row = getRow<Product>(...args);
        try {
          const date = parseISO(row.created_at);
          return format(date, "MM/dd/yyyy");
        } catch {
          return dateOnly(row.created_at);
        }
      },
    },
    {
      key: "__actions",
      label: "",
      render: (...args: unknown[]) => {
        const row = getRow<Product>(...args);
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
        );
      },
    },
  ];

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
          title="Total Products"
          value={`${totalCount}`}
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

      {/* Category Filter */}
      <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-lg">
        <div className="flex-1 max-w-xs">
          <label className="text-sm font-medium mb-2 block">
            Filter by Category
          </label>
          <Select
            value={activeCategoryFilter}
            onValueChange={setActiveCategoryFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <div className="p-2">
                <Input
                  placeholder="Search categories..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="mb-2"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <SelectItem value="all">All Categories</SelectItem>
              {categories
                .filter((cat) =>
                  cat.name.toLowerCase().includes(categorySearch.toLowerCase())
                )
                .map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              {categories.length === 0 && (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  No categories found
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
        {activeCategoryFilter !== "all" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setActiveCategoryFilter("all");
              setCategorySearch("");
            }}
            className="mt-6"
          >
            Clear Category Filter
          </Button>
        )}
      </div>

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
  );
}
