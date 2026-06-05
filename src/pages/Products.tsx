import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Search,
  X,
  RefreshCw,
  Loader2,
  RotateCcw,
  Users,
  Plus,
  ChevronDown,
  Check,
  Pencil,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { productApi, Product } from "@/api/products";
import { clientApi, Client } from "@/api/clientApi";
import axiosInstance from "@/api/axiosInstance";
import { productCategoryApi, ProductCategory } from "@/api/productCategories";
import { pharmacyApi, Pharmacy } from "@/api/pharmacyApi";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import { ProductFormModal } from "@/components/products/ProductFormModal";

interface ProductForAssignment {
  id: number;
  name: string;
  treatment: string;
  manufacturer_name?: string;
  is_active: boolean;
  base_price?: string;
  rx_or_otc?: string;
  is_modified_need_to_re_assigned?: boolean;
  pharmacy_name?: string;
  category_name?: string;
  beluga_medicine_id?: string;
  rx_drug_form?: string;
  purchase_type?: "one_time" | "subscription";
  created_at?: string;
}

interface PaginatedProductsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ProductForAssignment[];
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
      client_ids?: string[];
      message?: string;
    };
  };
}

const PAGE_SIZE = 250;

/* Custom checkbox matching the portal's design standard */
interface CustomCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
}

function CustomCheckbox({
  checked,
  indeterminate,
  onChange
}: CustomCheckboxProps) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onChange();
      }}
      aria-checked={checked}
      role="checkbox"
      className={`flex items-center justify-center rounded-md transition-all duration-150 shrink-0 outline-none w-[18px] h-[18px] border ${
        checked || indeterminate
          ? "border-sky-400 bg-sky-400 text-white"
          : "border-slate-300 bg-white hover:border-slate-400"
      }`}
    >
      {checked && (
        <Check
          className="h-3.5 w-3.5"
          strokeWidth={3}
          color="#fff"
        />
      )}
      {indeterminate && !checked && (
        <span
          className="w-2.5 h-[2px] bg-white rounded"
        />
      )}
    </button>
  );
}

/* Custom Pill component matching the portal theme */
interface PillProps {
  children: React.ReactNode;
  solid?: boolean;
}

function Pill({ children, solid }: PillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${
        solid
          ? "bg-sky-400 text-white"
          : "bg-sky-50 text-sky-700 border border-sky-100"
      }`}
    >
      {children}
    </span>
  );
}

/* Custom FilterSelect component using tailwind theme standard */
interface FilterSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
}

function FilterSelect({
  label,
  value,
  options,
  onChange
}: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const items = [
    { v: "all", l: label },
    ...options.map(o => ({ v: o, l: o }))
  ];
  const current = items.find(i => i.v === value) || items[0];
  const active = value !== "all";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex min-w-44 items-center justify-between gap-3 rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-150 ${
          active
            ? "border-sky-400 text-slate-800 font-semibold"
            : "border-slate-200 text-slate-500 font-normal hover:border-slate-300"
        }`}
      >
        {current.l}
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-150 text-slate-400 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div
          className="absolute z-30 mt-1 max-h-60 overflow-y-auto w-full rounded-lg border border-slate-200 bg-white py-1 shadow-lg animate-in fade-in-0 zoom-in-95 duration-100"
        >
          {items.map(it => (
            <button
              key={it.v}
              type="button"
              onClick={() => {
                onChange(it.v);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${
                it.v === value ? "bg-sky-50 text-sky-700 font-semibold" : "text-slate-800"
              }`}
            >
              {it.l}
              {it.v === value && (
                <Check className="h-3.5 w-3.5 text-sky-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Products() {
  const hasFetchedRef = useRef(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Data states
  const [products, setProducts] = useState<ProductForAssignment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Selection states
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(
    new Set()
  );
  const [selectedProductCache, setSelectedProductCache] = useState<
    Map<number, ProductForAssignment>
  >(new Map());
  const [selectedClients, setSelectedClients] = useState<Set<string>>(
    new Set()
  );

  // Filter & Search states
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [pharmacyFilter, setPharmacyFilter] = useState<string>("all");
  const [productSearch, setProductSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");

  // Modals open state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Check if more products available
  const hasMoreProducts = products.length < totalProducts;

  // Fetch products with filters
  const fetchProducts = useCallback(async (page: number, replace: boolean = false) => {
    try {
      const params: Record<string, string | number | boolean> = {
        page,
        page_size: PAGE_SIZE,
        is_admin_product: true,
      };

      if (categoryFilter !== "all") {
        params.category = categoryFilter;
      }
      if (typeFilter !== "all") {
        params.purchase_type = typeFilter;
      }
      if (pharmacyFilter !== "all") {
        params.pharmacy = pharmacyFilter;
      }
      if (productSearch.trim()) {
        params.search = productSearch.trim();
      }

      const response = await axiosInstance.get<PaginatedProductsResponse>(
        "products/",
        { params }
      );

      const results = response.data.results || [];
      setProducts((prev) => (replace ? results : [...prev, ...results]));
      setSelectedProductCache((prev) => {
        const next = new Map(prev);
        results.forEach((product) => next.set(product.id, product));
        return next;
      });
      setTotalProducts(response.data.count || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    }
  }, [categoryFilter, typeFilter, pharmacyFilter, productSearch]);

  // Initial load
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [categoriesData, pharmaciesData, clientsData] = await Promise.all([
          productCategoryApi.listCategories(),
          pharmacyApi.list(),
          clientApi.list(),
        ]);

        setCategories(categoriesData);
        setPharmacies(pharmaciesData);
        setClients(Array.isArray(clientsData) ? clientsData : []);

        // Fetch products on page 1
        await fetchProducts(1, true);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        toast({
          title: "Error",
          description: "Failed to load page dependencies",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    const init = async () => {
      await loadInitialData();
      setInitialLoadDone(true);
    };
    init();
  }, [fetchProducts]);

  // Filter change trigger
  useEffect(() => {
    if (!initialLoadDone) return;

    const delayDebounceFn = setTimeout(() => {
      fetchProducts(1, true);
    }, 300); // 300ms debounce for search input

    return () => clearTimeout(delayDebounceFn);
  }, [fetchProducts, initialLoadDone]);

  // Load more handler
  const handleLoadMore = async () => {
    if (loadingMore || !hasMoreProducts) return;

    try {
      setLoadingMore(true);
      await fetchProducts(currentPage + 1, false);
    } catch (error) {
      console.error("Failed to load more products:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const search = clientSearch.toLowerCase();
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(search) ||
        client.user?.email?.toLowerCase().includes(search) ||
        client.user?.full_name?.toLowerCase().includes(search)
    );
  }, [clients, clientSearch]);

  // Selection handlers
  const toggleProduct = (product: ProductForAssignment) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(product.id)) {
        newSet.delete(product.id);
      } else {
        newSet.add(product.id);
      }
      return newSet;
    });
    setSelectedProductCache((prev) => {
      const next = new Map(prev);
      next.set(product.id, product);
      return next;
    });
  };

  const toggleClient = (clientId: string) => {
    setSelectedClients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  const visibleIds = products.map((p) => p.id);
  const selectedVisible = products.filter((p) => selectedProducts.has(p.id));
  const allChecked = products.length > 0 && selectedVisible.length === products.length;
  const someChecked = selectedVisible.length > 0 && !allChecked;

  const toggleAllProducts = () => {
    if (!allChecked) {
      setSelectedProductCache((prevCache) => {
        const nextCache = new Map(prevCache);
        products.forEach((product) => nextCache.set(product.id, product));
        return nextCache;
      });
    }

    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (allChecked) {
        visibleIds.forEach((id) => newSet.delete(id));
      } else {
        visibleIds.forEach((id) => newSet.add(id));
      }
      return newSet;
    });
  };

  const clearAllSelections = () => {
    setSelectedProducts(new Set());
    setSelectedClients(new Set());
    setSelectedProductCache(new Map());
  };

  const resetFilters = () => {
    setCategoryFilter("all");
    setTypeFilter("all");
    setPharmacyFilter("all");
    setProductSearch("");
  };

  const selectedProductItems = useMemo(
    () =>
      Array.from(selectedProducts).map((id) => {
        const cached = selectedProductCache.get(id);
        return cached || ({
          id,
          name: `Product #${id}`,
          treatment: "",
          is_active: true,
        } as ProductForAssignment);
      }),
    [selectedProducts, selectedProductCache]
  );

  const openEditProduct = async (product: ProductForAssignment) => {
    try {
      setLoading(true);
      const fullProduct = await productApi.getProduct(product.id);
      setSelectedProduct(fullProduct as Product);
      setIsProductModalOpen(true);
    } catch (error) {
      console.error("Failed to load product details:", error);
      toast({
        title: "Error",
        description: "Failed to load product details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete handler
  const handleDelete = async (product: ProductForAssignment) => {
    if (!product) return;
    const ok = window.confirm(`Delete product “${product.name}”?`);
    if (!ok) return;
    try {
      setLoading(true);
      await axiosInstance.delete(`/products/${product.id}/`);
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      // Clear selection if deleted product was selected
      setSelectedProducts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
      setSelectedProductCache((prev) => {
        const next = new Map(prev);
        next.delete(product.id);
        return next;
      });
      await fetchProducts(1, true);
    } catch (e) {
      console.error("Failed to delete product:", e);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle assignment
  const handleAssign = async () => {
    if (selectedProducts.size === 0 || selectedClients.size === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one product and one client",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const result = await productApi.bulkAssign({
        product_ids: Array.from(selectedProducts),
        client_ids: Array.from(selectedClients),
      });

      if (result.success_count > 0 && result.failure_count === 0) {
        toast({
          title: "Success",
          description:
            result.message ||
            `Assigned ${result.success_count} product(s) successfully`,
        });
        clearAllSelections();
        setIsAssignModalOpen(false);
      } else if (result.success_count > 0) {
        toast({
          title: "Partial Assignment",
          description:
            result.message ||
            `${result.success_count} succeeded, ${result.failure_count} failed. Keep the selection and retry failed assignments after checking logs.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Assignment Failed",
          description: result.message || "All assignments failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Assignment error:", error);
      const apiError = error as ApiError;
      toast({
        title: "Error",
        description:
          apiError.response?.data?.error ||
          apiError.response?.data?.client_ids?.[0] ||
          "Failed to assign products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle re-assignment
  const handleReAssign = async () => {
    if (selectedProducts.size === 0 || selectedClients.size === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one product and one client",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const result = await productApi.reAssignProducts({
        product_ids: Array.from(selectedProducts),
        client_ids: Array.from(selectedClients),
      });

      if (result.success_count > 0 && result.failure_count === 0) {
        toast({
          title: "Success",
          description:
            result.message ||
            `Re-assigned ${result.success_count} product(s) successfully`,
        });
        clearAllSelections();
        setIsAssignModalOpen(false);

        // Refresh products
        await fetchProducts(1, true);
      } else if (result.success_count > 0) {
        toast({
          title: "Partial Re-assignment",
          description:
            result.message ||
            `${result.success_count} succeeded, ${result.failure_count} failed. Keep the selection and retry after checking logs.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Re-assignment Failed",
          description: "All re-assignments failed. Please check the logs.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Re-assignment error:", error);
      const apiError = error as ApiError;
      toast({
        title: "Error",
        description:
          apiError.response?.data?.error || "Failed to re-assign products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Format date helper
  const formatDate = (isoString?: string) => {
    if (!isoString) return "-";
    try {
      return new Date(isoString).toLocaleDateString();
    } catch {
      return "-";
    }
  };

  // Loading state
  if (loading && products.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <p className="text-muted-foreground">Loading products and page data...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="px-8 py-7 min-h-screen bg-slate-50/30"
      style={{
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popIn { from { opacity: 0; transform: scale(.96) translateY(8px) } to { opacity: 1; transform: scale(1) translateY(0) } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes barIn { from { opacity: 0; transform: translateX(-50%) translateY(16px) } to { opacity: 1; transform: translateX(-50%) translateY(0) } }
      ` }} />

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Products
          </h1>
          <p className="text-sm text-slate-500">
            Products <span className="px-1 text-slate-400">›</span> Products
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (selectedProducts.size > 0) {
                setSelectedClients(new Set());
                setClientSearch("");
                setIsAssignModalOpen(true);
              } else {
                toast({
                  title: "Selection Required",
                  description: "Select one or more products to assign.",
                });
              }
            }}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 text-slate-700 outline-none"
          >
            Assign Product
          </button>
          <button
            onClick={() => {
              setSelectedProduct(null);
              setIsProductModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-sky-400 hover:bg-sky-500 text-slate-950 px-4 py-2.5 text-sm font-semibold transition-colors outline-none"
          >
            <Plus className="h-4 w-4" /> Create New
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Category
          </label>
          <FilterSelect
            label="All Categories"
            value={categoryFilter === "all" ? "all" : (categories.find(c => c.id.toString() === categoryFilter)?.name || categoryFilter)}
            options={categories.map(c => c.name)}
            onChange={(val) => {
              if (val === "all") {
                setCategoryFilter("all");
              } else {
                const cat = categories.find(c => c.name === val);
                if (cat) setCategoryFilter(cat.id.toString());
              }
            }}
          />
        </div>

	        <div>
	          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
	            Purchase Type
	          </label>
          <FilterSelect
            label="All Types"
            value={typeFilter === "one_time" ? "One Time" : typeFilter === "subscription" ? "Subscription" : typeFilter}
            options={["One Time", "Subscription"]}
            onChange={(val) => {
              if (val === "all") setTypeFilter("all");
              else if (val === "One Time") setTypeFilter("one_time");
              else if (val === "Subscription") setTypeFilter("subscription");
            }}
	          />
	        </div>

	        <div>
	          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
	            Pharmacy
          </label>
          <FilterSelect
            label="All Pharmacies"
            value={pharmacyFilter === "all" ? "all" : (pharmacies.find(p => p.id.toString() === pharmacyFilter)?.store_name || pharmacyFilter)}
            options={pharmacies.map(p => p.store_name)}
            onChange={(val) => {
              if (val === "all") {
                setPharmacyFilter("all");
              } else {
                const pharm = pharmacies.find(p => p.store_name === val);
                if (pharm) setPharmacyFilter(pharm.id.toString());
              }
            }}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search products..."
              className="flex min-w-44 items-center justify-between gap-3 rounded-lg border bg-white pl-9 pr-8 py-2.5 text-sm outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400 transition-all text-slate-800"
              style={{
                borderColor: productSearch ? "#38bdf8" : "#e2e8f0",
                fontWeight: productSearch ? 600 : 400
              }}
            />
            {productSearch && (
              <button
                type="button"
                onClick={() => setProductSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

	        {(categoryFilter !== "all" ||
	          typeFilter !== "all" ||
	          pharmacyFilter !== "all" ||
	          productSearch !== "") && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 text-slate-700 outline-none"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-600" /> Reset Filters
          </button>
        )}

        <span className="ml-auto pb-2.5 text-sm font-medium text-slate-500">
          Showing {products.length} of {totalProducts}
        </span>
      </div>

      {/* Products Table Card */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="px-5 py-3 text-left w-[50px]">
                <CustomCheckbox
                  checked={allChecked}
                  indeterminate={someChecked}
                  onChange={toggleAllProducts}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Pharmacy / Manufacturer
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Drug Form
              </th>
	              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
	                Purchase Type
	              </th>
	              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
	                Created At
	              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 w-[100px]">
                
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {products.length === 0 ? (
              <tr>
	                <td
	                  colSpan={8}
                  className="px-4 py-12 text-center text-sm text-slate-400"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin mr-2 text-sky-500" />
                      Fetching products...
                    </div>
                  ) : (
                    "No products match these filters."
                  )}
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const isSelected = selectedProducts.has(product.id);
                return (
                  <tr
                    key={product.id}
                    className="transition-colors cursor-pointer border-b border-slate-100"
                    style={{
                      background: isSelected ? "#e3f3fb" : "#fff",
                    }}
	                    onClick={() => toggleProduct(product)}
	                  >
	                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
	                      <CustomCheckbox
	                        checked={isSelected}
	                        onChange={() => toggleProduct(product)}
	                      />
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>{product.name}</span>
                        {product.is_modified_need_to_re_assigned && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="destructive"
                                  className="text-[10px] h-4 px-1.5 font-bold"
                                >
                                  UPDATED
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>You have updated this product.</p>
                                <p>
                                  You need to re-assign it to clients to push
                                  the updates.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Pill>{product.category_name || "-"}</Pill>
                    </td>
                    <td className="px-4 py-4 text-slate-500">
                      {product.pharmacy_name || "-"}
                      {product.manufacturer_name && (
                        <span className="block text-xs mt-0.5 text-slate-400">
                          {product.manufacturer_name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-500">
                      {product.rx_drug_form || "-"}
                    </td>
	                    <td className="px-4 py-4">
	                      {product.purchase_type ? (
	                        <Pill>{product.purchase_type === "subscription" ? "Subscription" : "One Time"}</Pill>
	                      ) : (
	                        "-"
	                      )}
	                    </td>
	                    <td className="px-4 py-4 text-slate-500">
	                      {formatDate(product.created_at)}
	                    </td>
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-3">
                        <button
	                          type="button"
	                          className="hover:opacity-70 text-slate-400 outline-none"
	                          onClick={() => openEditProduct(product)}
	                        >
                          <Pencil className="h-4.5 w-4.5" />
                        </button>
                        <button
                          type="button"
                          className="hover:opacity-70 text-red-400 outline-none"
                          onClick={() => handleDelete(product)}
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Load More Trigger */}
        {hasMoreProducts && (
          <div className="px-6 py-4 border-t border-slate-100 flex justify-center bg-slate-50/50">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="min-w-[200px] border border-slate-200 bg-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-slate-50 text-slate-700 transition-colors disabled:opacity-50"
            >
              {loadingMore ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </span>
              ) : (
                `Load More (${products.length} of ${totalProducts})`
              )}
            </button>
          </div>
        )}
      </div>

      {/* Floating Action Bar */}
      {selectedProducts.size > 0 && (
        <div
          className="fixed bottom-7 left-1/2 z-40 flex items-center gap-4 rounded-2xl px-5 py-3 shadow-2xl bg-slate-950"
          style={{
            animation: "barIn .2s cubic-bezier(.2,.8,.3,1)",
            transform: "translateX(-50%)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-bold bg-sky-400 text-slate-950"
            >
              {selectedProducts.size}
            </span>
            <span className="text-sm font-medium text-white">
              {selectedProducts.size} product{selectedProducts.size > 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="h-5 w-px bg-slate-800" />
          <button
            onClick={() => setSelectedProducts(new Set())}
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors outline-none"
          >
            Clear
          </button>
          <button
            onClick={() => {
              setSelectedClients(new Set());
              setClientSearch("");
              setIsAssignModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-sky-400 hover:bg-sky-500 text-slate-950 px-4 py-2 text-sm font-semibold transition-colors outline-none"
          >
            <Users className="h-4 w-4" />
            Assign to Clients
          </button>
        </div>
      )}

      {/* Product Form Modal */}
      <ProductFormModal
        open={isProductModalOpen}
        onOpenChange={setIsProductModalOpen}
        product={selectedProduct}
        onSuccess={() => {
          setIsProductModalOpen(false);
          setSelectedProduct(null);
          fetchProducts(1, true); // reload page 1
        }}
      />

      {/* Assign Dialog */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden gap-0 rounded-2xl border-none shadow-2xl bg-white">
          <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50">
                <Users className="h-5 w-5 text-sky-600" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-semibold text-slate-800">
                  Assign products to clients
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedProducts.size} product{selectedProducts.size > 1 ? "s" : ""} selected
                </p>
              </div>
            </div>
          </div>

          <div className="flex" style={{ height: 400 }}>
            {/* Left Column: Selected Products (Read-Only) */}
            <div className="w-2/5 overflow-y-auto px-5 py-4 bg-slate-50/50 border-r border-slate-100">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Selected products ({selectedProducts.size})
              </p>
              <div className="space-y-1.5">
	                {selectedProductItems
	                  .map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 border border-slate-100 shadow-sm"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {p.name}
                        </p>
                        <p className="truncate text-xs mt-0.5 text-slate-400">
                          {p.category_name || "Uncategorized"}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Right Column: Client Selection */}
            <div className="w-3/5 flex flex-col bg-white">
              <div className="px-5 pb-2 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Assign to clients
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedClients(new Set(filteredClients.map((c) => c.id)))}
                      className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors outline-none"
                    >
                      Select All
                    </button>
                    <span className="text-xs text-slate-200">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedClients(new Set())}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors outline-none"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Search clients by name or email"
                    className="w-full bg-transparent text-sm outline-none border-none p-0 focus:ring-0 focus:outline-none text-slate-800 placeholder-slate-400"
                  />
                  {clientSearch && (
                    <button
                      type="button"
                      onClick={() => setClientSearch("")}
                      className="text-slate-400 hover:text-slate-600 outline-none"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-2 py-2">
                {filteredClients.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-slate-400">
                    No clients found.
                  </p>
                ) : (
                  filteredClients.map((c) => {
                    const isSelected = selectedClients.has(c.id);
                    const initials = c.name
                      ? c.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : "CL";
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleClient(c.id)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors outline-none"
                        style={{
                          background: isSelected ? "#e3f3fb" : "transparent"
                        }}
                      >
                        <CustomCheckbox
                          checked={isSelected}
                          onChange={() => toggleClient(c.id)}
                        />
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white bg-slate-800"
                        >
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {c.name}
                          </p>
                          <p className="truncate text-xs mt-0.5 text-slate-400">
                            {c.user?.email || "-"}
                          </p>
                        </div>
	                        <span className="text-xs font-semibold text-slate-400">
	                          {c.is_active ? "Active" : "Inactive"}
	                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
            <span className="text-sm text-slate-500 font-medium">
              {selectedClients.size} client{selectedClients.size === 1 ? "" : "s"} selected
            </span>
            <div className="flex gap-2">
              <DialogClose className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-50 bg-white text-slate-700 outline-none">
                Cancel
              </DialogClose>
              <button
                type="button"
                disabled={selectedClients.size === 0 || loading}
                onClick={handleAssign}
                className="rounded-lg bg-sky-400 hover:bg-sky-500 text-slate-950 px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed outline-none"
              >
                Assign
              </button>
              <button
                type="button"
                disabled={selectedClients.size === 0 || loading}
                onClick={handleReAssign}
                className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed border border-sky-200 text-sky-700 bg-sky-50 hover:bg-sky-100 outline-none"
              >
                <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
                Re-assign
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
