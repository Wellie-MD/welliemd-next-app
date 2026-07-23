import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, RefreshCw, RotateCcw, Search } from "lucide-react";
import { labsApi, type LabOrder } from "@/api/labs";
import { junctionMockEnabled } from "@/api/junctionMockData";
import { OrderDetailDrawer as LabOrderDetailDrawer } from "@/features/labs/components/LabOrderDetailDrawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { labPillTone } from "@/features/labs/constants/tones";
import { humanizeStatus } from "@/features/labs/utils";
import { exportToCSV } from "@/utils/exportUtils";

const EXPORT_COLUMNS = [
  { key: "id", label: "Order #" },
  { key: "patient", label: "Patient" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "client", label: "Client" },
  { key: "product", label: "Product" },
  { key: "lab_provider", label: "Lab" },
  { key: "orderStatus", label: "Order Status" },
  { key: "payment", label: "Payment" },
  { key: "fulfillment", label: "Fulfillment" },
  { key: "labEvent", label: "Lab Event" },
  { key: "amount", label: "Amount" },
];

const ORDER_STATUS_OPTIONS = ["All", "In Process", "Completed", "Canceled", "Failed"];
const PAYMENT_OPTIONS = ["All", "Paid", "Pending", "Failed", "Refunded"];
const FULFILLMENT_OPTIONS = ["All", "Received", "Collecting Sample", "With Lab", "Completed", "Canceled", "Failed", "In Process"];
const LAB_EVENT_OPTIONS = [
  "All",
  "Requisition Created",
  "Requisition Bypassed",
  "Kit Registration Required",
  "Kit Registered",
  "Appointment Pending",
  "Appointment Scheduled",
  "Appointment Cancelled",
  "Kit Shipped",
  "Kit Delivered",
  "Shipping Problem",
  "Sample Collected",
  "At Lab",
  "Partial Results",
  "Lab Processing Blocked",
  "Redraw Required",
  "Results Ready",
  "Canceled",
  "Failed",
];
const PAGE_SIZE_OPTIONS = [10, 20, 50];

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
  orderStatus: humanizeStatus(order.status),
  payment: order.payment_status,
  fulfillment: order.fulfillment_status || "Received",
  labEvent: order.lab_event_label || order.visit_status,
  date: order.timeline.ordered || "",
});

export default function LabOrders() {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [fulfillmentFilter, setFulfillmentFilter] = useState("All");
  const [labEventFilter, setLabEventFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, orderStatusFilter, paymentFilter, fulfillmentFilter, labEventFilter]);

  const loadOrders = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await labsApi.getAdminLabOrders({
        search: debouncedSearch || undefined,
        status: orderStatusFilter === "All" ? undefined : orderStatusFilter,
        payment_status: paymentFilter === "All" ? undefined : paymentFilter,
        fulfillment_status: fulfillmentFilter === "All" ? undefined : fulfillmentFilter,
        lab_event: labEventFilter === "All" ? undefined : labEventFilter,
        page,
        page_size: pageSize,
      });
      setOrders(data.results);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.count || 0);
    } catch (error: any) {
      setOrders([]);
      setTotalPages(1);
      setTotalCount(0);
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
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, debouncedSearch, orderStatusFilter, paymentFilter, fulfillmentFilter, labEventFilter]);

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setOrderStatusFilter("All");
    setPaymentFilter("All");
    setFulfillmentFilter("All");
    setLabEventFilter("All");
    setPage(1);
  };

  const rows = orders.map(rowFromOrder);

  const handleExport = () => {
    exportToCSV(rows, EXPORT_COLUMNS, "lab_orders_export");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lab Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {junctionMockEnabled ? "Junction mock mode enabled" : "Control-plane lab order view"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadOrders} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={loading || rows.length === 0} className="gap-2">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
            <SelectTrigger className="w-[170px] h-10 text-sm">
              <SelectValue placeholder="Order Status" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "All" ? "All order status" : option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-[160px] h-10 text-sm">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "All" ? "All payment" : option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={fulfillmentFilter} onValueChange={setFulfillmentFilter}>
            <SelectTrigger className="w-[180px] h-10 text-sm">
              <SelectValue placeholder="Fulfillment" />
            </SelectTrigger>
            <SelectContent>
              {FULFILLMENT_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "All" ? "All fulfillment" : option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={labEventFilter} onValueChange={setLabEventFilter}>
            <SelectTrigger className="w-[210px] h-10 text-sm">
              <SelectValue placeholder="Lab Event" />
            </SelectTrigger>
            <SelectContent>
              {LAB_EVENT_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "All" ? "All lab events" : option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={resetFilters} className="gap-2 h-10">
            <RotateCcw className="h-4 w-4" /> Reset Filters
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by order, patient, email, phone, client, or product"
            className="pl-9"
          />
        </div>
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
                {["Order #", "Patient", "Email", "Phone", "Client", "Product", "Lab", "Order Status", "Payment", "Fulfillment", "Lab Event", "Amount"].map((head) => (
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
                      {row.display_id || row.id}
                    </button>
                  </td>
                  <td className="px-3 py-4 font-semibold">{row.patient}</td>
                  <td className="px-3 py-4">{row.email}</td>
                  <td className="px-3 py-4">{row.phone || "-"}</td>
                  <td className="px-3 py-4">{row.client}</td>
                  <td className="px-3 py-4 font-semibold">{row.product}</td>
                  <td className="px-3 py-4">{row.lab_provider}</td>
                  <td className="px-3 py-4"><Pill value={row.orderStatus} /></td>
                  <td className="px-3 py-4"><Pill value={row.payment} /></td>
                  <td className="px-3 py-4"><Pill value={row.fulfillment} /></td>
                  <td className="px-3 py-4"><Pill value={row.labEvent} /></td>
                  <td className="px-3 py-4 font-bold">${row.amount.toFixed(2)}</td>
                </tr>
              ))}
              {!loading && !loadError && rows.length === 0 && (
                <tr><td colSpan={12} className="px-3 py-8 text-center text-slate-500">No lab orders found</td></tr>
              )}
              {loading && (
                <tr><td colSpan={12} className="px-3 py-8 text-center text-slate-500">Loading lab orders...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{totalCount === 0 ? "No lab orders" : `${totalCount.toLocaleString()} lab order${totalCount === 1 ? "" : "s"}`}</span>
          <Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setPage(1); }}>
            <SelectTrigger className="h-9 w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>
            Next
          </Button>
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
