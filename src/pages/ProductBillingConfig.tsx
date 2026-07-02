import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search,
  Save,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Archive,
  Users,
  Monitor,
  Info,
  X,
} from "lucide-react";
import productBillingApi from "@/api/productBillingApi";
import type {
  ProductBillingConfig as ApiProduct,
  BulkUpdatePayload,
  SingleProductOverridePayload,
} from "@/types/b2bBilling";

interface LocalProduct {
  admin_product_id: number;
  name: string;
  sku: string;
  pharmacy: string;
  category: string;
  archived: boolean;
  clientCost: string | null;
  clientShip: string | null;
  wellieCost: string | null;
  wellieShip: string | null;
  medEx: boolean;
  medOn: boolean;
  medEffective: boolean;
  shipEx: boolean;
  shipOn: boolean;
  shipEffective: boolean;
  status: string;
}

const PER_PAGE = 15;

const statusFilterOptions = [
  { value: "", label: "All statuses" },
  { value: "override", label: "Has override" },
  { value: "default", label: "Client default" },
  { value: "unconfigured", label: "Unconfigured" },
] as const;

async function fetchAllBillingProducts(clientId: string) {
  const allResults: ApiProduct[] = [];
  const firstPage = await productBillingApi.listProducts(clientId, {
    page: 1,
    page_size: 10000,
    is_archived: "all",
  });
  allResults.push(...firstPage.results);
  const totalPages = Math.ceil(firstPage.count / 10000);

  for (let page = 2; page <= totalPages; page += 1) {
    const pageData = await productBillingApi.listProducts(clientId, {
      page,
      page_size: 10000,
      is_archived: "all",
    });
    allResults.push(...pageData.results);
  }

  return allResults;
}

function getDisplayCategory(categoryName: string): string {
  if (!categoryName) return "";
  const cat = categoryName.toLowerCase().trim();
  if (
    cat.includes("semaglutide") ||
    cat.includes("tirzepatide") ||
    cat.includes("weight loss") ||
    cat.includes("glp")
  ) {
    return "GLP-1 / Weight loss";
  }
  if (
    cat.includes("hormone") ||
    cat.includes("testosterone") ||
    cat.includes("progesterone")
  ) {
    return "Hormone therapy";
  }
  if (
    cat.includes("sexual") ||
    cat.includes("erectile") ||
    cat.includes("sildenafil") ||
    cat.includes("tadalafil") ||
    cat.includes("ed")
  ) {
    return "Sexual health";
  }
  if (
    cat.includes("vitamin") ||
    cat.includes("supplement") ||
    cat.includes("b12") ||
    cat.includes("nad+")
  ) {
    return "Vitamins & supplements";
  }
  return categoryName;
}

function getLocalProductStatus(p: {
  clientCost: string | null;
  clientShip: string | null;
  medEx: boolean;
  shipEx: boolean;
  wellieCost: string | null;
  wellieShip: string | null;
}): "override" | "unconfigured" | "default" {
  const isOverride = p.medEx || p.shipEx || p.clientCost !== null || p.clientShip !== null;
  if (isOverride) return "override";

  // Check if unconfigured: if catalog costs are missing
  const medMissing = p.wellieCost === null;
  const shipMissing = p.wellieShip === null;
  if (medMissing || shipMissing) {
    return "unconfigured";
  }

  return "default";
}

function transformProduct(api: ApiProduct): LocalProduct {
  const medMode = api.medication_reimbursement_mode;
  const shipMode = api.shipping_reimbursement_mode;
  const localProduct = {
    admin_product_id: api.admin_product_id,
    name: api.product_name,
    sku: api.sku,
    pharmacy: api.pharmacy_name,
    category: getDisplayCategory(api.category),
    archived: api.is_archived,
    clientCost:
      medMode === "charge"
        ? api.medication_reimbursement_amount
        : medMode === "no_charge"
          ? "0.00"
          : null,
    clientShip:
      shipMode === "charge"
        ? api.shipping_reimbursement_amount
        : shipMode === "no_charge"
          ? "0.00"
          : null,
    wellieCost: api.welliemd_product_cost,
    wellieShip: api.welliemd_shipping_cost,
    medEx: medMode !== "inherit",
    medOn: medMode === "charge",
    medEffective: api.charge_medication_effective,
    shipEx: shipMode !== "inherit",
    shipOn: shipMode === "charge",
    shipEffective: api.charge_shipping_effective,
    status: "default",
  };
  localProduct.status = getLocalProductStatus(localProduct);
  return localProduct;
}

function localToBackendEdits(
  locals: LocalProduct[],
  originals: Map<number, ApiProduct>,
): Record<number, SingleProductOverridePayload> {
  const edits: Record<number, SingleProductOverridePayload> = {};
  for (const loc of locals) {
    const orig = originals.get(loc.admin_product_id);
    if (!orig) continue;

    const origMedMode = orig.medication_reimbursement_mode;
    const origShipMode = orig.shipping_reimbursement_mode;
    const origMedAmt = orig.medication_reimbursement_amount;
    const origShipAmt = orig.shipping_reimbursement_amount;

    let newMedMode = origMedMode;
    let newMedAmt = origMedAmt;
    let newShipMode = origShipMode;
    let newShipAmt = origShipAmt;

    if (loc.medEx) {
      newMedMode = loc.medOn ? "charge" : "no_charge";
      newMedAmt = loc.medOn ? loc.clientCost : "0.00";
    } else {
      newMedMode = "inherit";
      newMedAmt = null;
    }

    if (loc.shipEx) {
      newShipMode = loc.shipOn ? "charge" : "no_charge";
      newShipAmt = loc.shipOn ? loc.clientShip : "0.00";
    } else {
      newShipMode = "inherit";
      newShipAmt = null;
    }

    const changed: SingleProductOverridePayload = {};
    if (newMedMode !== origMedMode)
      changed.medication_reimbursement_mode = newMedMode;
    if (newMedAmt !== origMedAmt)
      changed.medication_reimbursement_amount = newMedAmt;
    if (newShipMode !== origShipMode)
      changed.shipping_reimbursement_mode = newShipMode;
    if (newShipAmt !== origShipAmt)
      changed.shipping_reimbursement_amount = newShipAmt;

    if (Object.keys(changed).length > 0) {
      edits[loc.admin_product_id] = changed;
    }
  }
  return edits;
}

export default function ProductBillingConfig() {
  const { clientId } = useParams<{ clientId: string }>();
  const [searchParams] = useSearchParams();
  const clientName = searchParams.get("name") || "Client";
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [search, setSearch] = useState("");
  const [archiveFilter, setArchiveFilter] = useState<
    "all" | "active" | "archived"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [pharmacyFilter, setPharmacyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const originalsRef = useRef<Map<number, ApiProduct>>(new Map());

  const { data: summary } = useQuery({
    queryKey: ["productBillingSummary", clientId],
    queryFn: () => productBillingApi.getSummary(clientId!),
    enabled: !!clientId,
  });

  const { data: listData, isFetching: isFetchingProducts } = useQuery({
    queryKey: ["productBillingList", clientId],
    queryFn: () => fetchAllBillingProducts(clientId!),
    enabled: !!clientId,
  });

  useEffect(() => {
    if (listData) {
      setProducts(listData.map(transformProduct));
      originalsRef.current = new Map(
        listData.map((p) => [p.admin_product_id, p]),
      );
    }
  }, [listData]);

  const categoryOptions = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [products]);

  const pharmacyOptions = useMemo(() => {
    const pharms = new Set(products.map((p) => p.pharmacy).filter(Boolean));
    return Array.from(pharms).sort();
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      const arcMatch =
        archiveFilter === "all" ||
        (archiveFilter === "active" && !p.archived) ||
        (archiveFilter === "archived" && p.archived);
      return (
        arcMatch &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)) &&
        (!pharmacyFilter || p.pharmacy === pharmacyFilter) &&
        (!statusFilter || p.status === statusFilter) &&
        (!categoryFilter || p.category === categoryFilter)
      );
    });
  }, [
    products,
    search,
    archiveFilter,
    categoryFilter,
    pharmacyFilter,
    statusFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageProducts = filtered.slice(
    (safePage - 1) * PER_PAGE,
    safePage * PER_PAGE,
  );

  const selectedCount = selected.size;

  const hasChanges = useMemo(() => {
    const edits = localToBackendEdits(products, originalsRef.current);
    return Object.keys(edits).length > 0;
  }, [products]);

  const handleInputChange = useCallback(
    (adminProductId: number, field: "clientCost" | "clientShip", value: string | null) => {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.admin_product_id !== adminProductId) return p;
          return { ...p, [field]: value };
        }),
      );
    },
    [],
  );

  const saveProductOverride = useCallback(
    async (adminProductId: number, updated: LocalProduct) => {
      const orig = originalsRef.current.get(adminProductId);
      if (!orig) return;

      const origMedMode = orig.medication_reimbursement_mode;
      const origShipMode = orig.shipping_reimbursement_mode;
      const origMedAmt = orig.medication_reimbursement_amount;
      const origShipAmt = orig.shipping_reimbursement_amount;

      let newMedMode = origMedMode;
      let newMedAmt = origMedAmt;
      let newShipMode = origShipMode;
      let newShipAmt = origShipAmt;

      if (updated.medEx) {
        newMedMode = updated.medOn ? "charge" : "no_charge";
        newMedAmt = updated.medOn ? updated.clientCost : "0.00";
      } else {
        newMedMode = "inherit";
        newMedAmt = null;
      }

      if (updated.shipEx) {
        newShipMode = updated.shipOn ? "charge" : "no_charge";
        newShipAmt = updated.shipOn ? updated.clientShip : "0.00";
      } else {
        newShipMode = "inherit";
        newShipAmt = null;
      }

      const changed: SingleProductOverridePayload = {};
      if (newMedMode !== origMedMode)
        changed.medication_reimbursement_mode = newMedMode;
      if (newMedAmt !== origMedAmt)
        changed.medication_reimbursement_amount = newMedAmt;
      if (newShipMode !== origShipMode)
        changed.shipping_reimbursement_mode = newShipMode;
      if (newShipAmt !== origShipAmt)
        changed.shipping_reimbursement_amount = newShipAmt;

      if (Object.keys(changed).length > 0) {
        try {
          const res = await productBillingApi.updateProduct(clientId!, adminProductId, changed);
          originalsRef.current.set(adminProductId, res);
          queryClient.invalidateQueries({
            queryKey: ["productBillingSummary", clientId],
          });
        } catch (err: any) {
          toast.error(err.message || "Failed to save product billing override");
        }
      }
    },
    [clientId, queryClient],
  );

  const handleInputCommit = useCallback(
    (adminProductId: number, field: "clientCost" | "clientShip") => {
      setProducts((prev) => {
        const existing = prev.find((p) => p.admin_product_id === adminProductId);
        if (!existing) return prev;

        const updated = { ...existing } as LocalProduct;
        let value = updated[field];
        const hasValue = value !== null && value !== "";

        if (hasValue) {
          const num = parseFloat(value);
          if (!isNaN(num)) {
            value = num.toFixed(2);
            updated[field] = value;
          }
        }

        if (field === "clientCost") {
          if (hasValue) {
            updated.medEx = true;
            updated.medOn = true;
          } else {
            updated.medEx = false;
            updated.medOn = false;
            updated.clientCost = null;
          }
        } else {
          if (hasValue) {
            updated.shipEx = true;
            updated.shipOn = true;
          } else {
            updated.shipEx = false;
            updated.shipOn = false;
            updated.clientShip = null;
          }
        }

        updated.status = getLocalProductStatus(updated);

        saveProductOverride(adminProductId, updated);

        return prev.map((p) => (p.admin_product_id === adminProductId ? updated : p));
      });
    },
    [saveProductOverride],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const toggleMed = useCallback((adminProductId: number) => {
    setProducts((prev) => {
      const existing = prev.find((p) => p.admin_product_id === adminProductId);
      if (!existing) return prev;

      const newOn = !existing.medOn;
      const updated = {
        ...existing,
        medEx: true,
        medOn: newOn,
        clientCost: newOn && existing.clientCost === "0.00" ? null : existing.clientCost,
      };
      updated.status = getLocalProductStatus(updated);

      saveProductOverride(adminProductId, updated);

      return prev.map((p) => (p.admin_product_id === adminProductId ? updated : p));
    });
  }, [saveProductOverride]);

  const toggleShip = useCallback((adminProductId: number) => {
    setProducts((prev) => {
      const existing = prev.find((p) => p.admin_product_id === adminProductId);
      if (!existing) return prev;

      const newOn = !existing.shipOn;
      const updated = {
        ...existing,
        shipEx: true,
        shipOn: newOn,
        clientShip: newOn && existing.clientShip === "0.00" ? null : existing.clientShip,
      };
      updated.status = getLocalProductStatus(updated);

      saveProductOverride(adminProductId, updated);

      return prev.map((p) => (p.admin_product_id === adminProductId ? updated : p));
    });
  }, [saveProductOverride]);

  const toggleArchive = useCallback((adminProductId: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.admin_product_id !== adminProductId) return p;
        return { ...p, archived: !p.archived };
      }),
    );
  }, []);

  const toggleSelect = useCallback((adminProductId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(adminProductId)) next.delete(adminProductId);
      else next.add(adminProductId);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (
      selected.size === pageProducts.length &&
      pageProducts.every((p) => selected.has(p.admin_product_id))
    ) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pageProducts.map((p) => p.admin_product_id)));
    }
  }, [selected, pageProducts]);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const edits = localToBackendEdits(products, originalsRef.current);
      const promises = Object.entries(edits).map(([id, edit]) =>
        productBillingApi.updateProduct(clientId!, Number(id), edit),
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast.success("Product billing saved");
      queryClient.invalidateQueries({
        queryKey: ["productBillingSummary", clientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["productBillingList", clientId],
      });
    },
    onError: (err: unknown) => {
      const error = err as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      toast.error(
        error.response?.data?.error ||
          error.message ||
          "Failed to save changes",
      );
    },
  });

  const bulkMutation = useMutation({
    mutationFn: (payload: BulkUpdatePayload) =>
      productBillingApi.bulkUpdate(clientId!, payload),
    onSuccess: () => {
      toast.success("Bulk update applied");
      setSelected(new Set());
      queryClient.invalidateQueries({
        queryKey: ["productBillingSummary", clientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["productBillingList", clientId],
      });
    },
    onError: (err: unknown) => {
      const error = err as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      toast.error(
        error.response?.data?.error || error.message || "Bulk action failed",
      );
    },
  });

  const handleBulkAction = (type: string, val?: boolean) => {
    if (selected.size === 0) return;

    if (type === "archive") {
      const ids = Array.from(selected);
      const action = val ? "archive" : "unarchive";
      bulkMutation.mutate({ admin_product_ids: ids, action });
      return;
    }

    if (type === "med") {
      const action = val ? "charge_medication" : "no_charge_medication";
      bulkMutation.mutate({ admin_product_ids: Array.from(selected), action });
      return;
    }

    if (type === "ship") {
      const action = val ? "charge_shipping" : "no_charge_shipping";
      bulkMutation.mutate({ admin_product_ids: Array.from(selected), action });
      return;
    }

    if (type === "reset") {
      bulkMutation.mutate({
        admin_product_ids: Array.from(selected),
        action: "reset",
      });
    }
  };

  const isSaving = saveMutation.isPending || bulkMutation.isPending;

  const getStatusBadge = (p: LocalProduct) => {
    if (p.status === "override") {
      return (
        <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
          overridden
        </span>
      );
    }
    if (p.status === "unconfigured") {
      return (
        <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
          unconfigured
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
        default
      </span>
    );
  };

  return (
    <div className="p-6 space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          onClick={() => navigate("/dashboard/clients")}
          className="hover:text-foreground transition-colors"
        >
          Clients
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <button
          onClick={() => navigate(`/dashboard/clients/edit/${clientId}?tab=billing&subtab=product`)}
          className="hover:text-foreground transition-colors"
        >
          {clientName}
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-muted-foreground">Product billing</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Product billing — {clientName}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Per-product costs and reimbursement settings. Product-level settings
            override client defaults.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/dashboard/clients/edit/${clientId}?tab=billing&subtab=product`)}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to client
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!hasChanges || isSaving}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#12517A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#12517A]/90 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            Save changes
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Total products
          </div>
          <div className="mt-1 text-2xl font-bold">
            {summary?.total_products ?? "—"}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            assigned to this client
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            With overrides
          </div>
          <div className="mt-1 text-2xl font-bold text-blue-600">
            {summary?.with_overrides ?? "—"}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            product-level settings active
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Using client default
          </div>
          <div className="mt-1 text-2xl font-bold">
            {summary?.using_client_default ?? "—"}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            inheriting defaults
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Unconfigured
          </div>
          <div
            className={`mt-1 text-2xl font-bold ${(summary?.unconfigured ?? 0) > 0 ? "text-amber-600" : ""}`}
          >
            {summary?.unconfigured ?? "—"}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            missing cost values
          </div>
        </div>
      </div>

      {/* Info Callout */}
      {summary && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          <Info className="h-5 w-5 mt-0.5 shrink-0 text-blue-500" />
          <div>
            Client defaults:{" "}
            <strong>
              charge medication cost{" "}
              {summary.client_default_medication_reimbursement_enabled
                ? "ON"
                : "OFF"}
            </strong>
            {" · "}
            <strong>
              charge shipping cost{" "}
              {summary.client_default_shipping_reimbursement_enabled
                ? "ON"
                : "OFF"}
            </strong>
            . Dashed fields inherit the client default. Solid border =
            explicitly overridden.{" "}
            <button
              onClick={() => navigate(`/dashboard/clients/edit/${clientId}?tab=billing`)}
              className="font-medium text-blue-600 hover:underline"
            >
              Edit client defaults &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-2.5 text-sm">
          <span className="font-medium">{selectedCount} selected</span>
          <span className="text-muted-foreground">|</span>
          <button
            onClick={() => handleBulkAction("med", true)}
            className="rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors"
          >
            Charge med cost
          </button>
          <button
            onClick={() => handleBulkAction("med", false)}
            className="rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors"
          >
            No med cost
          </button>
          <button
            onClick={() => handleBulkAction("ship", true)}
            className="rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors"
          >
            Charge shipping
          </button>
          <button
            onClick={() => handleBulkAction("ship", false)}
            className="rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors"
          >
            No shipping
          </button>
          <button
            onClick={() => handleBulkAction("reset")}
            className="rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors"
          >
            <RotateCcw className="h-3 w-3 inline mr-1" />
            Reset to default
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            onClick={() => handleBulkAction("archive", true)}
            className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
          >
            <Archive className="h-3 w-3 inline mr-1" />
            Archive
          </button>
          <button
            onClick={() => handleBulkAction("archive", false)}
            className="rounded-md border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
          >
            <Archive className="h-3 w-3 inline mr-1" />
            Unarchive
          </button>
          <button
            onClick={clearSelection}
            className="ml-auto text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products or SKU…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 rounded-md border bg-background text-sm focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={archiveFilter}
          onChange={(e) => {
            setArchiveFilter(e.target.value as "all" | "active" | "archived");
            setPage(1);
          }}
          className="px-3 py-2 rounded-md border bg-background text-sm"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="archived">Inactive</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-md border bg-background text-sm"
        >
          <option value="">Product Category</option>
          {categoryOptions.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select
          value={pharmacyFilter}
          onChange={(e) => {
            setPharmacyFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-md border bg-background text-sm"
        >
          <option value="">All pharmacies</option>
          {pharmacyOptions.map((pharm) => (
            <option key={pharm} value={pharm}>
              {pharm}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-md border bg-background text-sm"
        >
          {statusFilterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="text-sm text-muted-foreground ml-auto">
          Showing {pageProducts.length} of {filtered.length}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        {isFetchingProducts && (
          <div className="h-1 w-full animate-pulse bg-blue-100" />
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/20">
              <th
                rowSpan={2}
                className="px-3 py-2 text-left align-bottom"
                style={{ width: 28 }}
              >
                <input
                  type="checkbox"
                  checked={
                    pageProducts.length > 0 &&
                    pageProducts.every((p) => selected.has(p.admin_product_id))
                  }
                  onChange={toggleSelectAll}
                  className="cursor-pointer"
                />
              </th>
              <th
                rowSpan={2}
                className="px-3 py-2 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground align-bottom"
                style={{ width: "24%" }}
              >
                Product
              </th>
              <th
                rowSpan={2}
                className="px-3 py-2 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground align-bottom"
                style={{ width: "11%" }}
              >
                Pharmacy
              </th>
              <th
                colSpan={4}
                className="px-3 py-2 text-center font-bold text-[10px] uppercase tracking-[0.06em] border-b border-[#bfcffd] bg-[#eff4ff] text-[#2563eb]"
              >
                <Users className="h-3 w-3 inline mr-1 align-[-2px]" />
                Charged to client
              </th>
              <th
                colSpan={2}
                className="px-3 py-2 text-center font-bold text-[10px] uppercase tracking-[0.06em] border-b border-[#ddd6fe] bg-[#f5f3ff] text-[#7c3aed]"
              >
                <Monitor className="h-3 w-3 inline mr-1 align-[-2px]" />
                WellieMD cost — read only
              </th>
              <th
                rowSpan={2}
                className="px-3 py-2 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground align-bottom"
                style={{ width: "10%" }}
              >
                Status
              </th>
              <th
                rowSpan={2}
                className="px-3 py-2 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground align-bottom"
                style={{ width: "8%" }}
              >
                Action
              </th>
            </tr>
            <tr className="border-b bg-muted/10">
              <th className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground bg-[#eff4ff]">
                Product cost
              </th>
              <th className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground bg-[#eff4ff]">
                Shipping cost
              </th>
              <th className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground text-center bg-[#eff4ff]">
                Charge product
              </th>
              <th className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground text-center bg-[#eff4ff] border-r-2 border-border">
                Charge shipping
              </th>
              <th className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground bg-[#f5f3ff]">
                Product cost
              </th>
              <th className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground bg-[#f5f3ff]">
                Shipping cost
              </th>
            </tr>
          </thead>
          <tbody>
            {isFetchingProducts && products.length === 0 && (
              <tr>
                <td
                  colSpan={11}
                  className="px-3 py-12 text-center text-sm text-muted-foreground"
                >
                  Loading product billing configuration…
                </td>
              </tr>
            )}
            {!isFetchingProducts && products.length === 0 && (
              <tr>
                <td
                  colSpan={11}
                  className="px-3 py-12 text-center text-sm text-muted-foreground"
                >
                  No products assigned or found.
                </td>
              </tr>
            )}
            {!isFetchingProducts &&
              products.length > 0 &&
              filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={11}
                    className="px-3 py-12 text-center text-sm text-muted-foreground"
                  >
                    No products found matching the criteria.
                  </td>
                </tr>
              )}
            {pageProducts.map((p) => {
              const isUnconf = p.status === "unconfigured" && !p.archived;
              const isSel = selected.has(p.admin_product_id);
              const medToggleOn = p.medEx ? p.medOn : p.medEffective;
              const shipToggleOn = p.shipEx ? p.shipOn : p.shipEffective;
              const medHasCustomAmount =
                p.clientCost !== null && p.clientCost !== "";
              const shipHasCustomAmount =
                p.clientShip !== null && p.clientShip !== "";
              const medLabel = !p.medEx
                ? "inherited"
                : p.medOn
                  ? "charging"
                  : "not charging";
              const shipLabel = !p.shipEx
                ? "inherited"
                : p.shipOn
                  ? "charging"
                  : "not charging";
              const medAmountLabel = !p.medEx
                ? "inherited"
                : p.medOn
                  ? medHasCustomAmount
                    ? "custom"
                    : "catalog"
                  : "not charging";
              const shipAmountLabel = !p.shipEx
                ? "inherited"
                : p.shipOn
                  ? shipHasCustomAmount
                    ? "custom"
                    : "catalog"
                  : "not charging";
              return (
                <tr
                  key={p.admin_product_id}
                  className={`border-b hover:bg-muted/10 transition-colors ${isUnconf ? "bg-amber-50/30" : ""} ${isSel ? "bg-blue-50/30" : ""} ${p.archived ? "opacity-55" : ""}`}
                >
                  <td className="px-3 py-2.5 pr-0">
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => toggleSelect(p.admin_product_id)}
                      className="cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-1.5 font-medium">
                      <span>{p.name}</span>
                      {p.archived && (
                        <span className="inline-flex items-center rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          archived
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">
                    {p.pharmacy}
                  </td>

                  {/* Charged to Client - Product cost */}
                  <td className="px-3 py-2.5 bg-[rgba(239,244,255,0.35)]">
                    <div className="flex flex-col items-end">
                      <div className="relative inline-block">
                        <span className="absolute left-[7px] top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">
                          $
                        </span>
                        <input
                          type="text"
                          value={p.clientCost || ""}
                          onChange={(e) =>
                            handleInputChange(
                              p.admin_product_id,
                              "clientCost",
                              e.target.value || null,
                            )
                          }
                          onBlur={() =>
                            handleInputCommit(p.admin_product_id, "clientCost")
                          }
                          onKeyDown={handleKeyDown}
                          placeholder={
                            p.medEx && p.medOn ? "catalog" : "inherit"
                          }
                          className={`h-[30px] w-[84px] rounded-md border py-0 pl-4 pr-2 text-right font-mono text-xs outline-none transition-colors focus:border-[#2563eb] focus:ring-2 focus:ring-blue-500/10 ${p.medEx ? "border-[#bfcffd] bg-white text-foreground" : "border-dashed border-border bg-muted/40 text-muted-foreground"}`}
                          disabled={isSaving}
                        />
                      </div>
                      <span
                        className={`mt-0.5 font-mono text-[10px] ${p.medEx ? "text-[#2563eb]" : "text-muted-foreground"}`}
                      >
                        {medAmountLabel}
                      </span>
                    </div>
                  </td>

                  {/* Charged to Client - Shipping cost */}
                  <td className="px-3 py-2.5 bg-[rgba(239,244,255,0.35)]">
                    <div className="flex flex-col items-end">
                      <div className="relative inline-block">
                        <span className="absolute left-[7px] top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">
                          $
                        </span>
                        <input
                          type="text"
                          value={p.clientShip || ""}
                          onChange={(e) =>
                            handleInputChange(
                              p.admin_product_id,
                              "clientShip",
                              e.target.value || null,
                            )
                          }
                          onBlur={() =>
                            handleInputCommit(p.admin_product_id, "clientShip")
                          }
                          onKeyDown={handleKeyDown}
                          placeholder={
                            p.shipEx && p.shipOn ? "catalog" : "inherit"
                          }
                          className={`h-[30px] w-[84px] rounded-md border py-0 pl-4 pr-2 text-right font-mono text-xs outline-none transition-colors focus:border-[#2563eb] focus:ring-2 focus:ring-blue-500/10 ${p.shipEx ? "border-[#bfcffd] bg-white text-foreground" : "border-dashed border-border bg-muted/40 text-muted-foreground"}`}
                          disabled={isSaving}
                        />
                      </div>
                      <span
                        className={`mt-0.5 font-mono text-[10px] ${p.shipEx ? "text-[#2563eb]" : "text-muted-foreground"}`}
                      >
                        {shipAmountLabel}
                      </span>
                    </div>
                  </td>

                  {/* Charged to Client - Charge product mini-toggle */}
                  <td className="px-3 py-2.5 bg-[rgba(239,244,255,0.35)] text-center">
                    <div className="flex flex-col items-center justify-center">
                      <button
                        type="button"
                        onClick={
                          p.medEx
                            ? () => toggleMed(p.admin_product_id)
                            : undefined
                        }
                        disabled={!p.medEx || isSaving}
                        className={`relative inline-block h-[18px] w-8 rounded-full transition-colors ${
                          !p.medEx
                            ? medToggleOn
                              ? "cursor-default bg-[#93c5fd]"
                              : "cursor-default bg-[#d1d5db]"
                            : p.medOn
                              ? "cursor-pointer bg-[#2563eb]"
                              : "cursor-pointer bg-[#d1d5db]"
                        }`}
                        title={
                          !p.medEx
                            ? `Inheriting client default (${medToggleOn ? "ON" : "OFF"})`
                            : "Override active"
                        }
                      >
                        <span
                          className={`absolute left-0.5 top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${medToggleOn ? "translate-x-3.5" : "translate-x-0"}`}
                        />
                      </button>
                      <span className="mt-0.5 block text-[10px] text-muted-foreground">
                        {medLabel}
                      </span>
                    </div>
                  </td>

                  {/* Charged to Client - Charge shipping mini-toggle */}
                  <td className="px-3 py-2.5 bg-[rgba(239,244,255,0.35)] text-center border-r-2 border-border">
                    <div className="flex flex-col items-center justify-center">
                      <button
                        type="button"
                        onClick={
                          p.shipEx
                            ? () => toggleShip(p.admin_product_id)
                            : undefined
                        }
                        disabled={!p.shipEx || isSaving}
                        className={`relative inline-block h-[18px] w-8 rounded-full transition-colors ${
                          !p.shipEx
                            ? shipToggleOn
                              ? "cursor-default bg-[#93c5fd]"
                              : "cursor-default bg-[#d1d5db]"
                            : p.shipOn
                              ? "cursor-pointer bg-[#2563eb]"
                              : "cursor-pointer bg-[#d1d5db]"
                        }`}
                        title={
                          !p.shipEx
                            ? `Inheriting client default (${shipToggleOn ? "ON" : "OFF"})`
                            : "Override active"
                        }
                      >
                        <span
                          className={`absolute left-0.5 top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${shipToggleOn ? "translate-x-3.5" : "translate-x-0"}`}
                        />
                      </button>
                      <span className="mt-0.5 block text-[10px] text-muted-foreground">
                        {shipLabel}
                      </span>
                    </div>
                  </td>

                  {/* WellieMD Cost - Product cost */}
                  <td className="px-3 py-2.5 bg-[rgba(245,243,255,0.4)]">
                    <div className="flex flex-col items-end">
                      <div className="relative inline-block">
                        <span className="absolute left-[7px] top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">
                          $
                        </span>
                        <div
                          className={`flex h-[30px] w-[84px] select-none items-center justify-end rounded-md border border-border bg-muted/40 py-0 pl-4 pr-2 font-mono text-xs ${p.wellieCost ? "text-muted-foreground" : "text-muted-foreground/70"}`}
                        >
                          {p.wellieCost || "—"}
                        </div>
                      </div>
                      <span className="mt-0.5 whitespace-nowrap font-mono text-[10px] text-muted-foreground">
                        from catalogue
                      </span>
                    </div>
                  </td>

                  {/* WellieMD Cost - Shipping cost */}
                  <td className="px-3 py-2.5 bg-[rgba(245,243,255,0.4)]">
                    <div className="flex flex-col items-end">
                      <div className="relative inline-block">
                        <span className="absolute left-[7px] top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">
                          $
                        </span>
                        <div
                          className={`flex h-[30px] w-[84px] select-none items-center justify-end rounded-md border border-border bg-muted/40 py-0 pl-4 pr-2 font-mono text-xs ${p.wellieShip ? "text-muted-foreground" : "text-muted-foreground/70"}`}
                        >
                          {p.wellieShip || "—"}
                        </div>
                      </div>
                      <span className="mt-0.5 whitespace-nowrap font-mono text-[10px] text-muted-foreground">
                        from catalogue
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2.5">{getStatusBadge(p)}</td>

                  {/* Action */}
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => {
                        const action = p.archived ? "unarchive" : "archive";
                        if (action === "unarchive") {
                          bulkMutation.mutate({
                            admin_product_ids: [p.admin_product_id],
                            action: "unarchive",
                          });
                        } else {
                          bulkMutation.mutate({
                            admin_product_ids: [p.admin_product_id],
                            action: "archive",
                          });
                        }
                      }}
                      disabled={isSaving}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-50 ${
                        p.archived
                          ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                          : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                      }`}
                    >
                      <Archive className="h-3 w-3" />
                      {p.archived ? "Unarchive" : "Archive"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            Page {safePage} of {totalPages} &middot; {filtered.length} products
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (safePage <= 4) {
                  pageNum = i + 1;
                } else if (safePage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = safePage - 3 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${pageNum === safePage ? "bg-[#12517A] text-white" : "hover:bg-muted"}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
