import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
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
  FileDown,
  AlertTriangle,
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
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductFormModal } from "@/components/products/ProductFormModal";
import { useTreatmentTypes } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import {
  AssignmentBatch,
  AssignmentPair,
  buildAssignmentBatches,
  buildAssignmentBatchesFromPairs,
  csvEscape,
} from "@/utils/productAssignmentBatching";

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
    status?: number;
    data?: {
      error?: string;
      client_ids?: string[];
      message?: string;
      max_pairs?: number;
      total_pairs?: number;
    };
  };
}

const PAGE_SIZE = 250;

type AssignmentOperation = "assign" | "reassign";
type BulkProgressStatus = "idle" | "running" | "completed" | "partial" | "stopped";

interface BulkProgress {
  status: BulkProgressStatus;
  operation: AssignmentOperation;
  totalPairs: number;
  attemptedPairs: number;
  successCount: number;
  failureCount: number;
  pendingCount: number;
  currentBatch: number;
  totalBatches: number;
}

const emptyProgress: BulkProgress = {
  status: "idle",
  operation: "assign",
  totalPairs: 0,
  attemptedPairs: 0,
  successCount: 0,
  failureCount: 0,
  pendingCount: 0,
  currentBatch: 0,
  totalBatches: 0,
};

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
  const openedProductReference = useRef<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const targetProductReference = searchParams.get("product");
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [treatmentTypeFilter, setTreatmentTypeFilter] = useState<string>("all");
  const [visitTypeFilter, setVisitTypeFilter] = useState<string>("all");
  const [productSearch, setProductSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");

  const { data: treatmentTypes = [] } = useTreatmentTypes();
  const visitTypeOptions = useMemo(() => {
    const options = new Set<string>();
    treatmentTypes.forEach((t) => {
      if (t.intakeVisitType) options.add(t.intakeVisitType);
      if (t.followupVisitType) options.add(t.followupVisitType);
    });
    if (options.size === 0) {
      return ["weightloss", "weightlossFollowup", "ED", "EDFollowup", "TRT", "TRTFollowup"];
    }
    return Array.from(options);
  }, [treatmentTypes]);

  const displayedProducts = useMemo(() => {
    if (visitTypeFilter === "all") return products;
    return products.filter((p) => {
      const allowed = p.allowed_visit_types || [];
      const restricted = p.restrict_visit_types || false;
      return !restricted || allowed.includes(visitTypeFilter);
    });
  }, [products, visitTypeFilter]);

  // Modals open state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<BulkProgress>(emptyProgress);
  const [failedAssignments, setFailedAssignments] = useState<AssignmentPair[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<AssignmentPair[]>([]);
  const [lastAssignmentOperation, setLastAssignmentOperation] =
    useState<AssignmentOperation>("assign");

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
      if (statusFilter !== "all") {
        params.is_active = statusFilter === "active";
      }
      if (treatmentTypeFilter !== "all") {
        params.treatment_type = treatmentTypeFilter;
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
  }, [categoryFilter, typeFilter, pharmacyFilter, statusFilter, treatmentTypeFilter, productSearch]);

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

  const clientMap = useMemo(() => {
    const map = new Map<string, Client>();
    clients.forEach((client) => map.set(client.id, client));
    return map;
  }, [clients]);

  const productNameForId = useCallback(
    (productId: number | string) =>
      selectedProductCache.get(Number(productId))?.name || `Product #${productId}`,
    [selectedProductCache]
  );

  const clientNameForId = useCallback(
    (clientId: string) => clientMap.get(clientId)?.name || `Client ${clientId}`,
    [clientMap]
  );

  const buildPairsForBatch = useCallback(
    (batch: AssignmentBatch, status: "failed" | "pending", error?: string) =>
      batch.product_ids.flatMap((productId) =>
        batch.client_ids.map((clientId) => ({
          product_id: productId,
          product_name: productNameForId(productId),
          client_id: clientId,
          client_name: clientNameForId(clientId),
          status,
          error,
        }))
      ),
    [clientNameForId, productNameForId]
  );

  const buildPairsForBatches = useCallback(
    (batches: AssignmentBatch[], status: "failed" | "pending", error?: string) =>
      batches.flatMap((batch) => buildPairsForBatch(batch, status, error)),
    [buildPairsForBatch]
  );

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
    setStatusFilter("all");
    setTreatmentTypeFilter("all");
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

  useEffect(() => {
    if (
      !targetProductReference ||
      openedProductReference.current === targetProductReference
    ) {
      return;
    }

    const productId = Number(targetProductReference);
    if (!Number.isInteger(productId) || productId <= 0) {
      openedProductReference.current = targetProductReference;
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("product");
      setSearchParams(nextParams, { replace: true });
      return;
    }

    openedProductReference.current = targetProductReference;
    let active = true;
    productApi
      .getProduct(productId)
      .then((product) => {
        if (!active) return;
        setSelectedProduct(product as Product);
        setIsProductModalOpen(true);
      })
      .catch(() => {
        if (!active) return;
        toast({
          title: "Product unavailable",
          description: "The selected product could not be opened.",
          variant: "destructive",
        });
      })
      .finally(() => {
        if (!active) return;
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("product");
        setSearchParams(nextParams, { replace: true });
      });

    return () => {
      active = false;
    };
  }, [
    searchParams,
    setSearchParams,
    targetProductReference,
  ]);

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

  const normalizeAssignmentResult = (result: Awaited<ReturnType<typeof productApi.bulkAssign>>) => {
    const successCount = Number(result.success_count ?? result.successful ?? 0);
    const failureCount = Number(result.failure_count ?? result.failed ?? 0);

    return {
      ...result,
      success_count: successCount,
      failure_count: failureCount,
      total: Number(result.total ?? successCount + failureCount),
      results: result.results || [],
    };
  };

  const runAssignmentBatches = async (
    batches: AssignmentBatch[],
    operation: AssignmentOperation,
    initialFailedAssignments: AssignmentPair[] = []
  ) => {
    const totalPairs = batches.reduce(
      (sum, batch) => sum + batch.product_ids.length * batch.client_ids.length,
      0
    );

    if (totalPairs === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one product and one client",
        variant: "destructive",
      });
      return;
    }

    setLastAssignmentOperation(operation);
    setFailedAssignments(initialFailedAssignments);
    setPendingAssignments([]);
    setBulkProgress({
      ...emptyProgress,
      operation,
      status: "running",
      totalPairs,
      totalBatches: batches.length,
    });
    setIsAssignModalOpen(false);
    setIsProgressDialogOpen(true);

    let successCount = 0;
    let failureCount = initialFailedAssignments.length;
    let attemptedPairs = 0;
    const collectedFailures = [...initialFailedAssignments];
    let activeBatchIndex = 0;

    try {
      setLoading(true);

      for (let index = 0; index < batches.length; index += 1) {
        activeBatchIndex = index;
        const batch = batches[index];
        const batchPairs = batch.product_ids.length * batch.client_ids.length;

        setBulkProgress((previous) => ({
          ...previous,
          currentBatch: index + 1,
        }));

        let result;
        try {
          result = await (
            operation === "assign"
              ? productApi.bulkAssign(batch)
              : productApi.reAssignProducts(batch)
          );
        } catch (firstError) {
          const apiError = firstError as ApiError;
          const statusCode = apiError.response?.status;
          const shouldRetryOnce = !statusCode || statusCode >= 500 || statusCode === 429;

          if (!shouldRetryOnce) {
            throw firstError;
          }

          result = await (
            operation === "assign"
              ? productApi.bulkAssign(batch)
              : productApi.reAssignProducts(batch)
          );
        }

        const normalized = normalizeAssignmentResult(result);
        successCount += normalized.success_count;
        failureCount += normalized.failure_count;
        attemptedPairs += normalized.total || batchPairs;

        const failedRows = normalized.results
          .filter((row) => !row.success)
          .map((row) => ({
            product_id: Number(row.product_id),
            product_name: row.product_name || productNameForId(row.product_id),
            client_id: row.client_id,
            client_name: row.client_name || clientNameForId(row.client_id),
            status: "failed" as const,
            error: row.error || row.message || "Assignment failed",
          }));
        collectedFailures.push(...failedRows);

        setFailedAssignments([...collectedFailures]);
        setBulkProgress((previous) => ({
          ...previous,
          attemptedPairs,
          successCount,
          failureCount,
        }));
      }

      const finalStatus: BulkProgressStatus = failureCount > 0 ? "partial" : "completed";
      setBulkProgress((previous) => ({
        ...previous,
        status: finalStatus,
        attemptedPairs,
        successCount,
        failureCount,
        pendingCount: 0,
      }));

      if (failureCount === 0) {
        toast({
          title: operation === "assign" ? "Assignment Complete" : "Re-assignment Complete",
          description: `${successCount} assignment pair(s) completed successfully.`,
        });
        clearAllSelections();
        // Refresh so "needs re-assignment" badges and assignment state reflect the server.
        await fetchProducts(1, true);
      } else {
        toast({
          title: "Bulk Assignment Completed With Failures",
          description: `${successCount} succeeded, ${failureCount} failed. Review the result dialog for retry options.`,
          variant: "destructive",
        });
        if (successCount > 0) {
          await fetchProducts(1, true);
        }
      }
    } catch (error) {
      console.error("Bulk assignment stopped:", error);
      const apiError = error as ApiError;
      const pendingBatches = batches.slice(activeBatchIndex);
      const pendingPairs = buildPairsForBatches(
        pendingBatches,
        "pending",
        apiError.response?.data?.error ||
          apiError.response?.data?.message ||
          "Batch request failed before a result was returned"
      );
      setPendingAssignments(pendingPairs);
      setBulkProgress((previous) => ({
        ...previous,
        status: "stopped",
        attemptedPairs,
        successCount,
        failureCount,
        pendingCount: pendingPairs.length,
      }));
      toast({
        title: "Bulk Assignment Stopped",
        description:
          apiError.response?.data?.error ||
          apiError.response?.data?.message ||
          "A batch failed before results were returned. Review pending assignments before retrying.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle assignment
  const handleAssign = async () => {
    const productIds = Array.from(selectedProducts);
    const clientIds = Array.from(selectedClients);
    await runAssignmentBatches(buildAssignmentBatches(productIds, clientIds), "assign");
  };

  // Handle re-assignment
  const handleReAssign = async () => {
    const productIds = Array.from(selectedProducts);
    const clientIds = Array.from(selectedClients);
    await runAssignmentBatches(buildAssignmentBatches(productIds, clientIds), "reassign");
  };

  const retryAssignments = async (
    pairs: AssignmentPair[],
    operation: AssignmentOperation,
    label: string
  ) => {
    if (pairs.length === 0) {
      toast({
        title: "Nothing to Retry",
        description: `There are no ${label.toLowerCase()} assignments to retry.`,
      });
      return;
    }

    const batches = buildAssignmentBatchesFromPairs(pairs);
    await runAssignmentBatches(batches, operation);
  };

  const handleRetryFailed = () =>
    retryAssignments(failedAssignments, lastAssignmentOperation, "Failed");

  const handleRetryPending = () =>
    retryAssignments(pendingAssignments, lastAssignmentOperation, "Pending");

  const handleDownloadAssignmentReport = () => {
    const rows = [
      ...failedAssignments.map((assignment) => ({ ...assignment, status: "failed" as const })),
      ...pendingAssignments.map((assignment) => ({ ...assignment, status: "pending" as const })),
    ];

    if (rows.length === 0) {
      toast({
        title: "No Failure Report",
        description: "There are no failed or pending assignments to export.",
      });
      return;
    }

    const header = [
      "status",
      "product_id",
      "product_name",
      "client_id",
      "client_name",
      "error",
    ];
    const csv = [
      header.join(","),
      ...rows.map((row) =>
        [
          row.status,
          row.product_id,
          row.product_name,
          row.client_id,
          row.client_name,
          row.error || "",
        ]
          .map(csvEscape)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `product-assignment-report-${new Date().toISOString().slice(0, 19)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
            Status
          </label>
          <FilterSelect
            label="All Statuses"
            value={statusFilter === "all" ? "all" : statusFilter === "active" ? "Active" : "Inactive"}
            options={["Active", "Inactive"]}
            onChange={(val) => {
              if (val === "all") setStatusFilter("all");
              else if (val === "Active") setStatusFilter("active");
              else if (val === "Inactive") setStatusFilter("inactive");
            }}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Treatment Type (New)
          </label>
          <FilterSelect
            label="All Treatment Types"
            value={
              treatmentTypeFilter === "all"
                ? "all"
                : treatmentTypes.find(
                    (type) => String(type.id) === treatmentTypeFilter,
                  )?.name || treatmentTypeFilter
            }
            options={treatmentTypes.map((type) => type.name)}
            onChange={(value) => {
              if (value === "all") {
                setTreatmentTypeFilter("all");
                return;
              }
              const selected = treatmentTypes.find(
                (type) => type.name === value,
              );
              setTreatmentTypeFilter(selected ? String(selected.id) : "all");
            }}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Visit Type (Legacy)
          </label>
          <FilterSelect
            label="All Visit Types"
            value={visitTypeFilter === "all" ? "all" : visitTypeFilter}
            options={visitTypeOptions}
            onChange={(val) => {
              setVisitTypeFilter(val);
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
          statusFilter !== "all" ||
          treatmentTypeFilter !== "all" ||
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
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Purchase Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Treatment Type / Derived Routing (New)
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Restrictions (Legacy)
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Created At
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 w-[100px]">

              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {displayedProducts.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
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
              displayedProducts.map((product) => {
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
                      <Badge
                        variant={product.is_active ? "default" : "secondary"}
                        className={
                          product.is_active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-50"
                            : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-100"
                        }
                      >
                        {product.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      {product.purchase_type ? (
                        <Pill>{product.purchase_type === "subscription" ? "Subscription" : "One Time"}</Pill>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {product.product_type === "supply" ? (
                        <span className="text-xs text-slate-400">Not applicable</span>
                      ) : product.treatment_type_name ? (
                        <div className="space-y-1">
                          <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                            {product.treatment_type_name}
                          </Badge>
                          {product.treatment_type_is_active === false && (
                            <Badge variant="outline" className="ml-1 border-amber-200 bg-amber-50 text-amber-700">
                              Inactive Treatment Type
                            </Badge>
                          )}
                          <div className="text-[10px] text-slate-500">
                            Intake: {product.derived_intake_visit_type || "Not configured"}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Follow-up: {product.derived_followup_visit_type || "Not configured"}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
                          Unassigned
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {product.restrict_visit_types ? (
                        <div className="flex flex-wrap gap-1">
                          {(product.allowed_visit_types || []).map((vt: string) => (
                            <Badge key={vt} variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                              {vt}
                            </Badge>
                          ))}
                          {(product.allowed_visit_types || []).length === 0 && (
                            <span className="text-xs text-amber-600 font-medium">None</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Unrestricted</span>
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
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden rounded-2xl border-none bg-white p-0 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)]">
          <DialogTitle className="sr-only">Assign products to clients</DialogTitle>
          <div className="shrink-0 border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex min-w-0 items-center gap-3 pr-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50">
                <Users className="h-5 w-5 text-sky-600" />
              </div>
              <div className="min-w-0 text-left">
                <h3 className="text-base font-semibold text-slate-800">
                  Assign products to clients
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedProducts.size} product{selectedProducts.size > 1 ? "s" : ""} selected
                </p>
              </div>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:h-[min(31rem,calc(100dvh-12rem))] md:grid-cols-[minmax(0,2fr)_minmax(18rem,3fr)] md:overflow-hidden">
            {/* Left Column: Selected Products (Read-Only) */}
            <div className="min-h-[12rem] min-w-0 overflow-y-auto border-b border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-5 md:min-h-0 md:border-b-0 md:border-r">
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
            <div className="flex min-h-[16rem] min-w-0 flex-col bg-white md:min-h-0">
              <div className="px-4 pb-2 pt-4 sm:px-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Assign to clients
                  </p>
                  <div className="flex shrink-0 items-center gap-2">
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

              <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
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

          <div className="flex shrink-0 flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
            <span className="text-sm text-slate-500 font-medium">
              {selectedClients.size} client{selectedClients.size === 1 ? "" : "s"} selected
            </span>
            <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:shrink-0">
              <DialogClose className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition-colors hover:bg-slate-50 sm:px-4">
                Cancel
              </DialogClose>
              <button
                type="button"
                disabled={selectedClients.size === 0 || loading}
                onClick={handleAssign}
                className="rounded-lg bg-sky-400 px-3 py-2 text-sm font-semibold text-slate-950 outline-none transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
              >
                Assign
              </button>
              <button
                type="button"
                disabled={selectedClients.size === 0 || loading}
                onClick={handleReAssign}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 outline-none transition-colors hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
              >
                <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
                Re-assign
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Assignment Progress Dialog */}
      <Dialog open={isProgressDialogOpen} onOpenChange={setIsProgressDialogOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden gap-0 rounded-2xl border-none shadow-2xl bg-white">
          <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50">
                {bulkProgress.status === "running" ? (
                  <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
                ) : bulkProgress.status === "completed" ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                )}
              </div>
              <div className="text-left">
                <h3 className="text-base font-semibold text-slate-800">
                  {bulkProgress.operation === "assign" ? "Product Assignment" : "Product Re-assignment"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {bulkProgress.status === "running"
                    ? `Processing batch ${bulkProgress.currentBatch || 1} of ${bulkProgress.totalBatches}`
                    : bulkProgress.status === "completed"
                      ? "Completed successfully"
                      : bulkProgress.status === "partial"
                        ? "Completed with failures"
                        : bulkProgress.status === "stopped"
                          ? "Stopped before all batches completed"
                          : "Ready"}
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-slate-400">Total</p>
                <p className="mt-1 text-lg font-bold text-slate-800">{bulkProgress.totalPairs}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-slate-400">Attempted</p>
                <p className="mt-1 text-lg font-bold text-slate-800">{bulkProgress.attemptedPairs}</p>
              </div>
              <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-green-600">Succeeded</p>
                <p className="mt-1 text-lg font-bold text-green-700">{bulkProgress.successCount}</p>
              </div>
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-red-500">Failed</p>
                <p className="mt-1 text-lg font-bold text-red-600">{bulkProgress.failureCount}</p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-amber-600">Pending</p>
                <p className="mt-1 text-lg font-bold text-amber-700">{bulkProgress.pendingCount}</p>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>
                  Batch {bulkProgress.currentBatch || 0} of {bulkProgress.totalBatches || 0}
                </span>
                <span>
                  {bulkProgress.totalPairs
                    ? Math.round(
                        ((bulkProgress.attemptedPairs + bulkProgress.pendingCount) /
                          bulkProgress.totalPairs) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-sky-400 transition-all duration-200"
                  style={{
                    width: `${
                      bulkProgress.totalPairs
                        ? Math.min(
                            100,
                            ((bulkProgress.attemptedPairs + bulkProgress.pendingCount) /
                              bulkProgress.totalPairs) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {(failedAssignments.length > 0 || pendingAssignments.length > 0) && (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Retry Details</p>
                    <p className="text-xs text-slate-500">
                      Showing exact failed and pending product-client pairs.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadAssignmentReport}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    Download report
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {[...failedAssignments, ...pendingAssignments].slice(0, 200).map((assignment, index) => (
                    <div
                      key={`${assignment.status}-${assignment.product_id}-${assignment.client_id}-${index}`}
                      className="grid grid-cols-[110px_1fr_1fr] gap-3 border-t border-slate-100 px-4 py-3 text-sm"
                    >
                      <span
                        className={`w-fit rounded-md px-2 py-1 text-xs font-semibold ${
                          assignment.status === "pending"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {assignment.status === "pending" ? "Pending" : "Failed"}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800">
                          {assignment.product_name}
                        </p>
                        <p className="text-xs text-slate-400">Product #{assignment.product_id}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800">
                          {assignment.client_name}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {assignment.error || "No error message returned"}
                        </p>
                      </div>
                    </div>
                  ))}
                  {[...failedAssignments, ...pendingAssignments].length > 200 && (
                    <div className="border-t border-slate-100 px-4 py-3 text-center text-xs text-slate-500">
                      Showing first 200 rows. Download the report for the full list.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
            <p className="text-xs text-slate-500">
              Large selections are processed in safe sequential batches to avoid overloading the admin service.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={bulkProgress.status === "running" || failedAssignments.length === 0}
                onClick={handleRetryFailed}
                className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Retry failed only
              </button>
              <button
                type="button"
                disabled={bulkProgress.status === "running" || pendingAssignments.length === 0}
                onClick={handleRetryPending}
                className="rounded-lg border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Retry pending
              </button>
              <DialogClose
                disabled={bulkProgress.status === "running"}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Close
              </DialogClose>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
