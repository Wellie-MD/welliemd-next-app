import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { clientLabsApi, type LabOrder } from "@/features/labs/api";
import { humanizeLabStatus } from "@/features/labs/constants/status";
import { labPillTone } from "@/features/labs/constants/tones";
import { junctionMockEnabled } from "@/features/labs/junctionMockData";
import { exportToCSV } from "@/utils/exportUtils";
import { cn } from "@/lib/utils";

const ORDER_STATUS_OPTIONS = ["All", "Completed", "In Process", "Canceled", "Failed"];
const PAYMENT_STATUS_OPTIONS = ["All", "Paid", "Pending", "Failed"];
const LAB_EVENT_OPTIONS = [
  "All", "Requisition Created", "Appointment Pending", "Appointment Scheduled",
  "Sample Collected", "At Lab", "Partial Results", "Results Ready", "Failed", "Junction Auth Failed",
];
const FULFILLMENT_OPTIONS = ["All", "At Lab", "Results Ready"];

const EXPORT_COLUMNS = [
  { key: "id", label: "Order #" },
  { key: "patient_name", label: "Patient" },
  { key: "patient_email", label: "Email" },
  { key: "patient_phone", label: "Phone" },
  { key: "product_name", label: "Product" },
  { key: "lab_provider", label: "Lab" },
  { key: "status", label: "Order Status" },
  { key: "payment_status", label: "Payment" },
  { key: "fulfillment_status", label: "Fulfillment" },
  { key: "lab_event_label", label: "Lab Event" },
  { key: "price", label: "Amount" },
  { key: "created_at", label: "Date" },
];

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
});

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

export default function LabOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [count, setCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("All");
  const [paymentStatus, setPaymentStatus] = useState("All");
  const [fulfillment, setFulfillment] = useState("All");
  const [labEvent, setLabEvent] = useState("All");
  const [date, setDate] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Debounce free-text search so every keystroke doesn't trigger a backend request.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Everything except `page` itself that should reset pagination back to page 1 when it changes.
  const queryKey = JSON.stringify([debouncedSearch, orderStatus, paymentStatus, fulfillment, labEvent, date, pageSize]);
  const prevQueryKeyRef = useRef(queryKey);

  const loadOrders = useCallback(async (effectivePage: number, signal: { cancelled: boolean }) => {
    setLoading(true);
    try {
      const result = await clientLabsApi.getLabOrders({
        search: debouncedSearch || undefined,
        status: orderStatus !== "All" ? orderStatus : undefined,
        payment_status: paymentStatus !== "All" ? paymentStatus : undefined,
        fulfillment_status: fulfillment !== "All" ? fulfillment : undefined,
        lab_event: labEvent !== "All" ? labEvent : undefined,
        created_at__gte: date?.from ? date.from.toISOString().slice(0, 10) : undefined,
        created_at__lte: date?.to ? date.to.toISOString().slice(0, 10) : undefined,
        page: effectivePage,
        page_size: pageSize,
      });
      if (!signal.cancelled) {
        setOrders(result.results);
        setCount(result.count);
        setTotalPages(result.totalPages);
      }
    } finally {
      if (!signal.cancelled) setLoading(false);
    }
  }, [debouncedSearch, orderStatus, paymentStatus, fulfillment, labEvent, date, pageSize]);

  useEffect(() => {
    const signal = { cancelled: false };
    const queryChanged = prevQueryKeyRef.current !== queryKey;
    prevQueryKeyRef.current = queryKey;
    // Reset to page 1 first when the query changed underneath the current page — this effect
    // re-runs once `page` updates, so the fetch below never fires with a stale page number.
    if (queryChanged && page !== 1) {
      setPage(1);
      return;
    }
    loadOrders(queryChanged ? 1 : page, signal);
    return () => {
      signal.cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, page]);

  const rows = useMemo(() => orders.map(rowFromOrder), [orders]);

  const reset = () => {
    setSearch("");
    setOrderStatus("All");
    setPaymentStatus("All");
    setFulfillment("All");
    setLabEvent("All");
    setDate(undefined);
    setPage(1);
  };

  const handleExport = () => {
    exportToCSV(rows, EXPORT_COLUMNS, "lab_orders_export");
  };

  const columns = [
    {
      key: "id", label: "Order #", minWidth: "120px",
      render: (_: unknown, row: any) => (
        <button onClick={() => navigate(`/dashboard/orders/labs/${row.raw_id}`)} className="text-primary hover:underline font-semibold">
          {row.id}
        </button>
      ),
    },
    { key: "patient_name", label: "Patient", minWidth: "160px", className: "font-medium" },
    { key: "patient_email", label: "Email", minWidth: "200px", headerClassName: "hidden lg:table-cell", className: "hidden lg:table-cell" },
    { key: "patient_phone", label: "Phone", minWidth: "130px", headerClassName: "hidden xl:table-cell", className: "hidden xl:table-cell" },
    { key: "product_name", label: "Product", minWidth: "160px", className: "font-medium" },
    { key: "lab_provider", label: "Lab", minWidth: "100px" },
    { key: "status", label: "Order Status", minWidth: "140px", render: (_: unknown, row: any) => <StatusPill value={row.status} /> },
    { key: "payment_status", label: "Payment", minWidth: "120px", headerClassName: "hidden lg:table-cell", className: "hidden lg:table-cell", render: (_: unknown, row: any) => <StatusPill value={row.payment_status} /> },
    { key: "fulfillment_status", label: "Fulfillment", minWidth: "140px", headerClassName: "hidden xl:table-cell", className: "hidden xl:table-cell", render: (_: unknown, row: any) => <StatusPill value={row.fulfillment_status} /> },
    { key: "lab_event_label", label: "Lab Event", minWidth: "150px", render: (_: unknown, row: any) => <StatusPill value={row.lab_event_label} /> },
    { key: "price", label: "Amount", minWidth: "100px", render: (_: unknown, row: any) => <span className="font-bold">${row.price.toFixed(2)}</span> },
    { key: "created_at", label: "Date", minWidth: "110px", render: (_: unknown, row: any) => new Date(row.created_at).toLocaleDateString() },
    {
      key: "actions", label: "", minWidth: "60px",
      render: (_: unknown, row: any) => (
        <Button size="sm" variant="ghost" onClick={() => navigate(`/dashboard/orders/labs/${row.raw_id}`)}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const filters = [
    { key: "orderStatus", label: "Order Status", type: "select" as const, value: orderStatus, options: ORDER_STATUS_OPTIONS.map((v) => ({ value: v, label: v === "All" ? "All order statuses" : v })), onChange: setOrderStatus },
    { key: "paymentStatus", label: "Payment", type: "select" as const, value: paymentStatus, options: PAYMENT_STATUS_OPTIONS.map((v) => ({ value: v, label: v === "All" ? "All payments" : v })), onChange: setPaymentStatus },
    { key: "fulfillment", label: "Fulfillment", type: "select" as const, value: fulfillment, options: FULFILLMENT_OPTIONS.map((v) => ({ value: v, label: v === "All" ? "All fulfillment" : v })), onChange: setFulfillment },
    { key: "labEvent", label: "Lab Event", type: "select" as const, value: labEvent, options: LAB_EVENT_OPTIONS.map((v) => ({ value: v, label: v === "All" ? "All lab events" : v })), onChange: setLabEvent },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lab Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {junctionMockEnabled ? "Junction mock mode enabled" : "Live tenant lab orders"}
        </p>
      </div>

      <DataTable
        data={rows}
        columns={columns}
        fitToWidth={false}
        searchPlaceholder="Search by order number, patient, email, or phone"
        emptyMessage="No lab orders found"
        showDatePicker
        showExport
        showResetFilters
        filters={filters}
        dateRange={date}
        onDateRangeChange={setDate}
        onSearch={setSearch}
        onResetFilters={reset}
        onExport={handleExport}
        onRefresh={() => loadOrders(page, { cancelled: false })}
        loading={loading}
        pagination={{
          currentPage: page,
          totalPages,
          pageSize,
          totalCount: count,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
      />
    </div>
  );
}
