import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, RefreshCw, Link as LinkIcon } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import PharmacyForm from "@/components/pharmacies/PharmacyForm";
import { pharmacyApi, Pharmacy } from "@/api/pharmacyApi";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const getRow = <T,>(...args: any[]): T => (args.length >= 2 ? args[1] : args[0]);

function formatDate(s?: string | null) {
  if (!s) return "-";
  try { return new Date(s).toLocaleString(); } catch { return "-"; }
}

function StatusBadge({ status }: { status?: Pharmacy["integration_status"] }) {
  const base = "px-2 py-1 rounded text-xs font-medium";
  if (status === "connected") return <span className={`${base} bg-green-100 text-green-700`}>Connected</span>;
  if (status === "error") return <span className={`${base} bg-red-100 text-red-700`}>Error</span>;
  return <span className={`${base} bg-gray-100 text-gray-700`}>Pending</span>;
}

export default function Pharmacies() {
  const [items, setItems] = useState<Pharmacy[]>([]);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Pharmacy | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Pharmacy | null>(null);

  const fetchList = async () => {
    try {
      const list = await pharmacyApi.list({ search });
      setItems(list);
    } catch (e) {
      console.error(e);
      setItems([]);
    }
  };

  useEffect(() => { fetchList(); }, [refreshKey]); // initial + manual refresh
  useEffect(() => {
    const t = setTimeout(() => fetchList(), 300);
    return () => clearTimeout(t);
  }, [search]);

  const onDelete = async (row: Pharmacy) => {
    if (!row) return;
    setDeleteTarget(row);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await pharmacyApi.remove(deleteTarget.id);
      toast({
        title: "Success",
        description: "Pharmacy deleted successfully",
      });
      fetchList();
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Failed to delete pharmacy",
        variant: "destructive",
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const onTestConnection = async (row: Pharmacy) => {
    try {
      const res = await pharmacyApi.testConnection(row.id);
      if (res.connected) {
        toast({
          title: "Success",
          description: "Connection test successful",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: res.details?.error || "Connection test failed",
          variant: "destructive",
        });
      }
      fetchList();
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Connection test failed",
        variant: "destructive",
      });
    }
  };

  const columns = [
    { key: "store_name", label: "Pharmacy", width: "200px"},
    { key: "city", label: "City", width: "120px" },
    { key: "state", label: "State", width: "100px" },
    { key: "zip_code", label: "Zip", width: "100px" },
    { key: "primary_phone", label: "Phone", width: "130px" },
    { key: "email", label: "Email", width: "200px" },
    { key: "ncpdp_id", label: "NCPDP", width: "140px" },
    {
      key: "api_vendor",
      label: "API",
      width: "150px",
      render: (...a: any[]) => getRow<Pharmacy>(...a).api_vendor || "-"
    },
    {
      key: "integration_status",
      label: "Integration",
      width: "130px",
      render: (...a: any[]) => <StatusBadge status={getRow<Pharmacy>(...a).integration_status} />,
    },
    {
      key: "integration_last_validated_at",
      label: "Last Checked",
      width: "130px",
      render: (...a: any[]) => formatDate(getRow<Pharmacy>(...a).integration_last_validated_at),
    },
    {
      key: "updated_at",
      label: "Updated",
      width: "200px",
      render: (...a: any[]) => formatDate(getRow<Pharmacy>(...a).updated_at),
    },
    {
      key: "__actions",
      label: "",
      width: "150px",
      render: (...a: any[]) => {
        const row = getRow<Pharmacy>(...a);
        return (
          <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
            onClick={() => onTestConnection(row)}
            title="Test connection"
          >
            Test Connection
          </Button>
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
          import("@/utils/exportUtils").then(({ exportToCSV }) =>
            exportToCSV(rows, columns, "pharmacies_export")
          );
        }}
        onRefresh={() => setRefreshKey(v => v + 1)}
      />

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the pharmacy "{deleteTarget?.store_name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
