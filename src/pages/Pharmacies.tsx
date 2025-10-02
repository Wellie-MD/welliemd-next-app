import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import PharmacyForm from "@/components/pharmacies/PharmacyForm";
import { pharmacyApi, Pharmacy } from "@/api/pharmacyApi";

const getRow = <T,>(...args: any[]): T => (args.length >= 2 ? args[1] : args[0]);

function formatDate(s?: string | null) {
  if (!s) return "-";
  try { return new Date(s).toLocaleString(); } catch { return "-"; }
}

export default function Pharmacies() {
  const [items, setItems] = useState<Pharmacy[]>([]);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Pharmacy | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchList = async () => {
    try {
      const list = await pharmacyApi.list({ search });
      setItems(list);
    } catch (e) {
      console.error(e);
      setItems([]);
    }
  };

  useEffect(() => { fetchList(); }, [refreshKey]); // initial
  useEffect(() => {
    const t = setTimeout(() => fetchList(), 300);
    return () => clearTimeout(t);
  }, [search]);

  const onDelete = async (row: Pharmacy) => {
    if (!row) return;
    const ok = window.confirm(`Delete pharmacy "${row.store_name}"?`);
    if (!ok) return;
    try {
      await pharmacyApi.remove(row.id);
      alert("Deleted");
      fetchList();
    } catch (e) {
      console.error(e);
      alert("Failed to delete");
    }
  };

  const columns = [
    { key: "store_name", label: "Pharmacy" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "zip_code", label: "Zip" },
    { key: "primary_phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "ncpdp_id", label: "NCPDP" },
    {
      key: "api_vendor",
      label: "API",
      render: (...a: any[]) => getRow<Pharmacy>(...a).api_vendor || "-"
    },
    {
      key: "updated_at",
      label: "Updated",
      render: (...a: any[]) => formatDate(getRow<Pharmacy>(...a).updated_at),
    },
    {
      key: "__actions",
      label: "",
      render: (...a: any[]) => {
        const row = getRow<Pharmacy>(...a);
        return (
          <div className="flex items-center justify-end gap-3">
            <button title="Edit" onClick={() => setEditing(row)} className="hover:opacity-80">
              <Pencil className="h-4 w-4" />
            </button>
            <button title="Delete" onClick={() => onDelete(row)} className="text-red-600 hover:opacity-80">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(p =>
      [p.store_name, p.city, p.state, p.zip_code, p.email, p.ncpdp_id].some(x => (x || "").toLowerCase().includes(q))
    );
  }, [items, search]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pharmacies</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setRefreshKey(v => v + 1)}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button className="gap-2" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Add New
          </Button>
        </div>
      </div>

      {/* Create */}
      {showCreate && (
        <div className="border p-4 rounded-md bg-white shadow">
          <PharmacyForm
            mode="create"
            open={showCreate}
            onOpenChange={setShowCreate}
            onSuccess={fetchList}
          />
        </div>
      )}

      {/* Edit */}
      {editing && (
        <div className="border p-4 rounded-md bg-white shadow">
          <PharmacyForm
            mode="edit"
            pharmacy={editing}
            open={!!editing}
            onOpenChange={(v) => !v && setEditing(null)}
            onSuccess={() => {
              setEditing(null);
              fetchList();
            }}
          />
        </div>
      )}

      <DataTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search by name, city, state, NCPDP, email"
        onSearch={setSearch}
        showDatePicker={false}
        showExport={true}
        onExport={() => {
          const rows = filtered.map(({ id, ...r }) => r);
          // simple CSV export using your existing utility if present
          import("@/utils/exportUtils").then(({ exportToCSV }) =>
            exportToCSV(rows, columns, "pharmacies_export")
          );
        }}
        onRefresh={() => setRefreshKey(v => v + 1)}
      />
    </div>
  );
}
