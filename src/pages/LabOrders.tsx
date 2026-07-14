import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Eye, RefreshCw, Search } from "lucide-react";
import { labsApi, type LabOrder } from "@/api/labs";
import { junctionMockEnabled } from "@/api/junctionMockData";
import { OrderDetailDrawer as LabOrderDetailDrawer } from "@/features/labs/components/LabOrderDetailDrawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { labPillTone } from "@/features/labs/constants/tones";

const rowFromOrder = (order: LabOrder) => ({
  ...order,
  id: order.id,
  is_lab: true,
  patient: order.patient_name,
  email: order.patient_email,
  phone: order.patient_phone || "",
  client: order.client_name,
  product: order.product_name,
  amount: order.price,
  payment: order.payment_status,
  fulfillment: order.fulfillment_status || "At Lab",
  labEvent: order.lab_event_label || order.visit_status,
  date: order.timeline.ordered || "",
});

export default function LabOrders() {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [labEventFilter, setLabEventFilter] = useState("All");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setOrders(await labsApi.getAdminLabOrders());
    } catch (error: any) {
      setOrders([]);
      const responseData = error?.response?.data;
      setLoadError(
        responseData?.detail ||
          responseData?.error ||
          error?.message ||
          "The lab orders could not be loaded. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.map(rowFromOrder).filter((row) => {
      if (labEventFilter !== "All" && row.labEvent !== labEventFilter) return false;
      if (!term) return true;
      return [row.id, row.patient, row.email, row.phone, row.client, row.product].join(" ").toLowerCase().includes(term);
    });
  }, [orders, search, labEventFilter]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lab Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {junctionMockEnabled ? "Junction mock mode enabled" : "Control-plane lab order view"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadOrders} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="bg-white rounded-lg border p-4 flex flex-col sm:flex-row gap-3 justify-between">
        <Select value={labEventFilter} onValueChange={setLabEventFilter}>
          <SelectTrigger className="w-[200px] h-10 text-sm">
            <SelectValue placeholder="All Lab Events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Lab Events</SelectItem>
            <SelectItem value="Requisition Created">Requisition Created</SelectItem>
            <SelectItem value="Appointment Pending">Appointment Pending</SelectItem>
            <SelectItem value="Appointment Scheduled">Appointment Scheduled</SelectItem>
            <SelectItem value="Sample Collected">Sample Collected</SelectItem>
            <SelectItem value="At Lab">At Lab</SelectItem>
            <SelectItem value="Partial Results">Partial Results</SelectItem>
            <SelectItem value="Results Ready">Results Ready</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by order, patient, email, phone, client, or product"
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm h-10"
          />
        </div>
        <Button variant="outline" size="sm" className="gap-2 h-10">
          <Download className="h-4 w-4" /> Export
        </Button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        {loadError && (
          <div role="alert" className="m-4 flex items-center justify-between gap-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{loadError}</span>
            <Button variant="outline" size="sm" onClick={loadOrders} className="shrink-0 border-red-300 bg-white text-red-700 hover:bg-red-100">
              Retry
            </Button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-max">
            <thead className="bg-slate-50 border-b text-[11px] uppercase tracking-wider text-slate-600">
              <tr>
                {["Order #", "Patient", "Email", "Phone", "Client", "Product", "Lab", "Order Status", "Payment", "Event", "Fulfillment", "Amount", ""].map((head) => (
                  <th key={head} className="px-3 py-3">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-3 py-4">
                    <button
                      onClick={() => {
                        setSelectedOrder(row);
                        setDrawerOpen(true);
                      }}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      {row.id}
                    </button>
                  </td>
                  <td className="px-3 py-4 font-semibold">{row.patient}</td>
                  <td className="px-3 py-4">{row.email}</td>
                  <td className="px-3 py-4">{row.phone || "-"}</td>
                  <td className="px-3 py-4">{row.client}</td>
                  <td className="px-3 py-4 font-semibold">{row.product}</td>
                  <td className="px-3 py-4">{row.lab_provider}</td>
                  <td className="px-3 py-4"><Pill value={row.status} /></td>
                  <td className="px-3 py-4"><Pill value={row.payment} /></td>
                  <td className="px-3 py-4"><Pill value={row.labEvent} /></td>
                  <td className="px-3 py-4"><Pill value={row.fulfillment} /></td>
                  <td className="px-3 py-4 font-bold">${row.amount.toFixed(2)}</td>
                  <td className="px-3 py-4 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedOrder(row);
                        setDrawerOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {!loading && !loadError && rows.length === 0 && (
                <tr><td colSpan={13} className="px-3 py-8 text-center text-slate-500">No lab orders found</td></tr>
              )}
              {loading && (
                <tr><td colSpan={13} className="px-3 py-8 text-center text-slate-500">Loading lab orders...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <LabOrderDetailDrawer
        order={selectedOrder}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onOrderUpdated={loadOrders}
      />
    </div>
  );
}

function Pill({ value }: { value: string }) {
  const tone = labPillTone(value);
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${tone}`}>
      {value || "-"}
    </span>
  );
}
