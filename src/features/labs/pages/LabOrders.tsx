import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, Download, Eye, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { clientLabsApi, type LabOrder } from "@/features/labs/api";
import { humanizeLabStatus } from "@/features/labs/constants/status";
import { labPillTone } from "@/features/labs/constants/tones";
import { junctionMockEnabled } from "@/features/labs/junctionMockData";
import { cn } from "@/lib/utils";

const rowFromOrder = (order: LabOrder) => ({
  id: order.display_id || order.id,
  raw_id: order.id,
  patient_name: order.patient_name,
  patient_email: order.patient_email,
  patient_phone: order.patient_phone || "-",
  product_name: order.lab_panel_name,
  lab_provider: order.lab_provider,
  status: humanizeLabStatus(order.ui_order_status || order.order_status || "In Process"),
  payment_status: humanizeLabStatus(order.ui_payment_status || order.payment_status || "Pending"),
  fulfillment_status: humanizeLabStatus(order.ui_fulfillment_status || "In Process"),
  lab_event_label: humanizeLabStatus(order.ui_lab_event_label || order.lab_event_label || order.lab_event || "Lab Update"),
  price: order.total_paid,
  created_at: order.created_at,
  resultsReady: `${order.results_status} ${order.order_status}`.toLowerCase().includes("result"),
});

export default function LabOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("All");
  const [paymentStatus, setPaymentStatus] = useState("All");
  const [fulfillment, setFulfillment] = useState("All");
  const [labEvent, setLabEvent] = useState("All");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const rows = await clientLabsApi.getLabOrders();
        if (!cancelled) setOrders(rows);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    return orders.map(rowFromOrder).filter((row) => {
      const term = search.trim().toLowerCase();
      if (term) {
        const haystack = [row.id, row.patient_name, row.patient_email, row.patient_phone, row.product_name].join(" ").toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (orderStatus !== "All" && row.status.toLowerCase() !== orderStatus.toLowerCase()) return false;
      if (paymentStatus !== "All" && row.payment_status.toLowerCase() !== paymentStatus.toLowerCase()) return false;
      if (fulfillment !== "All" && row.fulfillment_status.toLowerCase() !== fulfillment.toLowerCase()) return false;
      if (labEvent !== "All" && row.lab_event_label.toLowerCase() !== labEvent.toLowerCase()) return false;
      return true;
    });
  }, [orders, search, orderStatus, paymentStatus, fulfillment, labEvent]);

  const reset = () => {
    setSearch("");
    setOrderStatus("All");
    setPaymentStatus("All");
    setFulfillment("All");
    setLabEvent("All");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lab Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {junctionMockEnabled ? "Junction mock mode enabled" : "Live tenant lab orders"}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={orderStatus} onValueChange={setOrderStatus}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All order statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All order statuses</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="In Process">In Process</SelectItem>
              <SelectItem value="Canceled">Canceled</SelectItem>
              <SelectItem value="Failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paymentStatus} onValueChange={setPaymentStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All payments" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All payments</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={labEvent} onValueChange={setLabEvent}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="All lab events" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All lab events</SelectItem>
              <SelectItem value="Requisition Created">Requisition Created</SelectItem>
              <SelectItem value="Appointment Pending">Appointment Pending</SelectItem>
              <SelectItem value="Appointment Scheduled">Appointment Scheduled</SelectItem>
              <SelectItem value="Sample Collected">Sample Collected</SelectItem>
              <SelectItem value="At Lab">At Lab</SelectItem>
              <SelectItem value="Partial Results">Partial Results</SelectItem>
              <SelectItem value="Results Ready">Results Ready</SelectItem>
              <SelectItem value="Failed">Failed</SelectItem>
              <SelectItem value="Junction Auth Failed">Junction Auth Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={fulfillment} onValueChange={setFulfillment}>
            <SelectTrigger className="w-[190px]"><SelectValue placeholder="All fulfillment" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All fulfillment</SelectItem>
              <SelectItem value="At Lab">At Lab</SelectItem>
              <SelectItem value="Results Ready">Results Ready</SelectItem>
            </SelectContent>
          </Select>
          <Select value={labEvent} onValueChange={setLabEvent}>
            <SelectTrigger className="w-[190px]"><SelectValue placeholder="All Lab Events" /></SelectTrigger>
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
          <Button variant="outline" size="sm" onClick={reset} className="gap-1 h-9">
            <RefreshCw className="h-3.5 w-3.5" /> Reset
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by order number, patient, email, or phone"
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-white dark:bg-gray-950 border-gray-200"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2 h-9"><CalendarIcon className="h-4 w-4" /> Date range</Button>
            <Button variant="outline" size="sm" className="gap-2 h-9"><Download className="h-4 w-4" /> Export</Button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-max">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b text-[11px] uppercase tracking-wider">
              <tr>
                {["Order #", "Patient", "Email", "Phone", "Product", "Lab", "Order Status", "Payment", "Event", "Fulfillment", "Amount", "Date", ""].map((head) => (
                  <th key={head} className="px-3 py-3">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((row) => (
                <tr key={row.raw_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-3 py-4">
                    <button onClick={() => navigate(`/dashboard/orders/labs/${row.raw_id}`)} className="text-blue-600 hover:underline font-semibold">
                      {row.id}
                    </button>
                  </td>
                  <td className="px-3 py-4 font-semibold">{row.patient_name}</td>
                  <td className="px-3 py-4 text-gray-600">{row.patient_email}</td>
                  <td className="px-3 py-4 text-gray-600">{row.patient_phone}</td>
                  <td className="px-3 py-4 font-semibold">{row.product_name}</td>
                  <td className="px-3 py-4">{row.lab_provider}</td>
                  <td className="px-3 py-4"><StatusPill value={row.status} /></td>
                  <td className="px-3 py-4"><StatusPill value={row.payment_status} /></td>
                  <td className="px-3 py-4"><StatusPill value={row.lab_event_label} /></td>
                  <td className="px-3 py-4"><StatusPill value={row.fulfillment_status} /></td>
                  <td className="px-3 py-4 font-bold">${row.price.toFixed(2)}</td>
                  <td className="px-3 py-4">{new Date(row.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-4 text-right">
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/dashboard/orders/labs/${row.raw_id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={13} className="px-3 py-8 text-center text-slate-500">No lab orders found</td></tr>
              )}
              {loading && (
                <tr><td colSpan={13} className="px-3 py-8 text-center text-slate-500">Loading lab orders...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  const tone = labPillTone(value);
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap",
      tone
    )}>
      {value || "-"}
    </span>
  );
}
