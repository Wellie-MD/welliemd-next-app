import { useEffect, useMemo, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import axiosInstance from "@/api/axiosInstance";
import { ProductFormModal } from "@/components/products/ProductFormModal";
import { StatCard } from "@/components/ui/stat-card";
import { Product } from "@/api/products";

function money(n: number | string | undefined | null) {
  if (n === undefined || n === null) return "-";
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (Number.isNaN(num)) return "-";
  return `$${num.toFixed(2)}`;
}

export default function Supplies() {
  const [supplies, setSupplies] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<Product | null>(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const fetchSupplies = useCallback(
    async (page: number = 1) => {
      try {
        setLoading(true);
        const params: Record<string, any> = {
          page,
          page_size: pageSize,
          product_type: "supply",
        };
        if (search.trim()) params.search = search.trim();
        if (activeStatusFilter !== "All") {
          params.is_active = activeStatusFilter === "Active";
        }

        const res = await axiosInstance.get("/products/", { params });
        if (res.data && typeof res.data === "object" && "results" in res.data) {
          const items: Product[] = res.data.results ?? [];
          setSupplies(items);
          setTotalCount(res.data.count || 0);
          setTotalPages(Math.ceil((res.data.count || 0) / pageSize));
          setCurrentPage(page);
        } else if (Array.isArray(res.data)) {
          setSupplies(res.data);
          setTotalCount(res.data.length);
          setTotalPages(1);
          setCurrentPage(1);
        }
      } catch (e) {
        console.error("Failed to fetch supplies:", e);
        setSupplies([]);
      } finally {
        setLoading(false);
      }
    },
    [pageSize, search, activeStatusFilter]
  );

  useEffect(() => {
    fetchSupplies(1);
  }, [fetchSupplies]);

  const onDelete = async (row: Product) => {
    const ok = window.confirm(`Delete supply “${row.name}”?`);
    if (!ok) return;
    try {
      await axiosInstance.delete(`/products/${row.id}/`);
      fetchSupplies(currentPage);
    } catch (e) {
      console.error(e);
      alert("Failed to delete supply");
    }
  };

  const filters = [
    {
      key: "status-all",
      label: "All",
      type: "button" as const,
      value: activeStatusFilter === "All" ? "All" : undefined,
      onClick: () => setActiveStatusFilter("All"),
    },
    {
      key: "status-active",
      label: "Active",
      type: "button" as const,
      value: activeStatusFilter === "Active" ? "Active" : undefined,
      onClick: () => setActiveStatusFilter("Active"),
    },
    {
      key: "status-inactive",
      label: "Inactive",
      type: "button" as const,
      value: activeStatusFilter === "Inactive" ? "Inactive" : undefined,
      onClick: () => setActiveStatusFilter("Inactive"),
    },
  ];

  const handleResetFilters = useCallback(() => {
    setActiveStatusFilter("All");
    setSearch("");
    setCurrentPage(1);
  }, []);

  const columns = useMemo(
    () => [
      { key: "name", label: "Supply Name", width: "220px" },
      {
        key: "beluga_medicine_id",
        label: "Med ID",
        width: "180px",
        render: (value: unknown, row: Product) => row.beluga_medicine_id || "-",
      },
      {
        key: "cost_to_client",
        label: "Cost to Client",
        width: "140px",
        render: (value: unknown, row: Product) => money(row.cost_to_client),
      },
      {
        key: "shipping_cost_to_client",
        label: "Shipping Cost",
        width: "140px",
        render: (value: unknown, row: Product) => money(row.shipping_cost_to_client),
      },
      {
        key: "is_active",
        label: "Status",
        width: "120px",
        render: (value: unknown, row: Product) => (
          <Badge variant={row.is_active ? "default" : "secondary"}>
            {row.is_active ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        key: "__actions",
        label: "",
        width: "80px",
        render: (value: unknown, row: Product) => (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="hover:opacity-80 text-blue-600"
              title="Edit"
              onClick={() => setEditing(row)}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="hover:opacity-80 text-red-600"
              title="Delete"
              onClick={() => onDelete(row)}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Supplies</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dedicated supplies catalog for needles, syringes, and related items.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedSupply(null);
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Supply
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Supplies" value={String(totalCount)} className="bg-muted/30" />
        <StatCard
          title="Active Supplies"
          value={String(supplies.filter((p) => p.is_active).length)}
          className="bg-muted/30"
        />
        <StatCard
          title="Linked To Products"
          value={String(
            supplies.filter((p) => Number((p as any).linked_parent_count || 0) > 0).length
          )}
          className="bg-muted/30"
        />
      </div>

      {(editing || modalOpen) && (
        <ProductFormModal
          open={!!editing || modalOpen}
          onOpenChange={(open) => {
            if (!open) {
              setEditing(null);
              setModalOpen(false);
            }
          }}
          product={editing || selectedSupply}
          defaultProductType="supply"
          onSuccess={() => {
            setEditing(null);
            setModalOpen(false);
            fetchSupplies(currentPage);
          }}
        />
      )}

      <DataTable
        data={supplies}
        columns={columns}
        searchPlaceholder="Search supplies by name or Med ID"
        showDatePicker={false}
        showResetFilters={true}
        showExport={true}
        filters={filters}
        onSearch={setSearch}
        onResetFilters={handleResetFilters}
        loading={loading}
        pagination={{
          currentPage,
          totalPages,
          pageSize,
          totalCount,
          onPageChange: (page: number) => {
            setCurrentPage(page);
            fetchSupplies(page);
          },
          onPageSizeChange: (size: number) => {
            setPageSize(size);
            setCurrentPage(1);
            fetchSupplies(1);
          },
        }}
      />
    </div>
  );
}
