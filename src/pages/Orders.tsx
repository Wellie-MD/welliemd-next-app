import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";
import { useAdminOrders } from "@/hooks/useAdminOrders";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { exportToCSV } from "@/utils/exportUtils";
import { OrderDetailDrawer } from "@/components/orders/OrderDetailDrawer";

// Tone utility matching the CSS colors in the prototype
function getOrderTone(s: string): [string, string, string] {
  const t = (s || "").toLowerCase();
  if (/cancel|fail|declin/.test(t))                          return ["#fee2e2", "#991b1b", "#fecaca"];
  if (/partially/.test(t))                                   return ["#ffedd5", "#9a3412", "#fed7aa"];
  if (/not started|draft/.test(t))                           return ["#f1f5f9", "#64748b", "#e2e8f0"];
  if (/paid|shipped|delivered|completed|results ready|prescribed/.test(t)) return ["#dcfce7", "#166534", "#bbf7d0"];
  if (/authorized|beluga|rx sent|at lab|in process/.test(t)) return ["#dbeafe", "#1e40af", "#bfdbfe"];
  return ["#fef3c7", "#92400e", "#fde68a"];
}

function OrderPill({ status }: { status: string }) {
  if (!status || status === "—") return <span className="text-muted-foreground">—</span>;
  const [bg, fg, bd] = getOrderTone(status);
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap"
      style={{ backgroundColor: bg, color: fg, borderColor: bd }}
    >
      {status}
    </span>
  );
}

interface NormalizedOrder {
  type: "rx" | "lab";
  id: string;
  patient: string;
  email: string;
  phone: string;
  client: string;
  product: string;
  fulfiller: string;
  orderStatus: string;
  payment: string;
  visit: string;
  fulfillment: string;
  amount: number;
  remaining?: number | null;
  date: string;
  _raw: any; // Keep reference to raw object for detail drawer
}

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [payFilter, setPayFilter] = useState("all");
  const [visitFilter, setVisitFilter] = useState("all");
  const [fulfillFilter, setFulfillFilter] = useState("all");

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { orders, refetch } = useAdminOrders({ page_size: 100 });

  const handleOrderClick = (row: NormalizedOrder) => {
    setSelectedOrder({
      ...row._raw,
      is_lab: false
    });
    setDrawerOpen(true);
  };

  const handleOrderUpdated = () => {
    refetch();
  };

  // Map and Normalize all orders
  const allNormalizedOrders = useMemo(() => {
    const rxList: NormalizedOrder[] = orders.map(o => {
      // Map order status to matching category
      let mappedStatus = "In Process";
      if (o.status === "canceled") mappedStatus = "Canceled";
      else if (o.status === "payment_pending") mappedStatus = "Pending Payment";
      else if (o.status === "shipped") mappedStatus = "Completed";

      // Map payment
      let mappedPayment = "Pending";
      if (o.payment_status === "paid") mappedPayment = "Paid";
      else if (o.payment_status === "authorized") mappedPayment = "Authorized";
      else if (o.payment_status === "partially_paid") mappedPayment = "Partially Paid";

      // Map visit
      let mappedVisit = "Prescribed";
      if (o.status === "visit_pending") mappedVisit = "Photos Submitted";
      else if (o.status === "visit_failed" || o.status === "canceled") mappedVisit = "Declined";
      else if (o.status === "created" || o.status === "payment_pending") mappedVisit = "Draft";

      // Map fulfillment
      let mappedFulfill = "Not Started";
      if (o.status === "shipped") mappedFulfill = "Shipped";
      else if (o.status === "rx_sent") mappedFulfill = "Rx Sent";

      // Format Date
      let formattedDate = "";
      if (o.created_at) {
        try {
          const d = new Date(o.created_at);
          formattedDate = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
        } catch {
          formattedDate = o.created_at;
        }
      }

      return {
        type: "rx",
        id: o.order_id || o.display_id || "",
        patient: o.patient_name || "",
        email: o.patient_email || "",
        phone: o.patient_phone || "",
        client: o.client_name || "",
        product: o.prescribed_medicine_name || o.requested_medicine_name || o.product_name || "",
        fulfiller: o.pharmacy_name || "DiRx",
        orderStatus: mappedStatus,
        payment: mappedPayment,
        visit: mappedVisit,
        fulfillment: mappedFulfill,
        amount: o.amount || 0,
        remaining: o.remaining_supplemental_amount || null,
        date: formattedDate,
        _raw: o
      };
    });

    return rxList;
  }, [orders]);

  // Apply filters
  const filteredOrders = useMemo(() => {
    return allNormalizedOrders.filter(o => {
      if (statusFilter !== "all" && o.orderStatus !== statusFilter) return false;
      if (payFilter !== "all" && o.payment !== payFilter) return false;
      if (visitFilter !== "all" && o.visit !== visitFilter) return false;
      if (fulfillFilter !== "all" && o.fulfillment !== fulfillFilter) return false;
      
      if (searchTerm) {
        const query = searchTerm.toLowerCase().trim();
        const matchesSearch =
          o.id.toLowerCase().includes(query) ||
          o.patient.toLowerCase().includes(query) ||
          o.email.toLowerCase().includes(query) ||
          o.phone.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [allNormalizedOrders, statusFilter, payFilter, visitFilter, fulfillFilter, searchTerm]);

  const handleResetFilters = () => {
    setStatusFilter("all");
    setPayFilter("all");
    setVisitFilter("all");
    setFulfillFilter("all");
    setSearchTerm("");
  };

  const handleExport = () => {
    const columns = [
      { key: "id", label: "Order #" },
      { key: "patient", label: "Patient" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "client", label: "Client" },
      { key: "product", label: "Product" },
      { key: "fulfiller", label: "Pharmacy / Lab" },
      { key: "orderStatus", label: "Order Status" },
      { key: "payment", label: "Payment" },
      { key: "visit", label: "Visit" },
      { key: "fulfillment", label: "Fulfillment" },
      { key: "amount", label: "Amount" },
      { key: "date", label: "Date" }
    ];
    exportToCSV(filteredOrders, columns, "rx_orders_export");
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Rx Orders</h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-3xl leading-relaxed">
            Medication orders across clients
          </p>
        </div>
        <div className="flex justify-start sm:justify-end">
          <Button
            variant="outline"
            onClick={handleExport}
            className="border border-input bg-background hover:bg-muted font-medium text-xs h-9 inline-flex items-center gap-1.5 w-full sm:w-auto justify-center"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 bg-muted/10 p-3 sm:p-4 rounded-lg border border-border/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Select Dropdowns in a wrap container */}
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {/* Select Status */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs font-semibold bg-background border border-input rounded-md px-2.5 min-w-[130px] w-full sm:w-auto">
                  <SelectValue placeholder="All order status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All order status</SelectItem>
                  <SelectItem value="Pending Payment" className="text-xs">Pending Payment</SelectItem>
                  <SelectItem value="In Process" className="text-xs">In Process</SelectItem>
                  <SelectItem value="Completed" className="text-xs">Completed</SelectItem>
                  <SelectItem value="Canceled" className="text-xs">Canceled</SelectItem>
                </SelectContent>
              </Select>

              {/* Select Payment */}
              <Select value={payFilter} onValueChange={setPayFilter}>
                <SelectTrigger className="h-8 text-xs font-semibold bg-background border border-input rounded-md px-2.5 min-w-[110px] w-full sm:w-auto">
                  <SelectValue placeholder="All payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All payment</SelectItem>
                  <SelectItem value="Paid" className="text-xs">Paid</SelectItem>
                  <SelectItem value="Pending" className="text-xs">Pending</SelectItem>
                  <SelectItem value="Authorized" className="text-xs">Authorized</SelectItem>
                  <SelectItem value="Partially Paid" className="text-xs">Partially Paid</SelectItem>
                </SelectContent>
              </Select>

              {/* Select Visit */}
              <Select value={visitFilter} onValueChange={setVisitFilter}>
                <SelectTrigger className="h-8 text-xs font-semibold bg-background border border-input rounded-md px-2.5 min-w-[130px] w-full sm:w-auto">
                  <SelectValue placeholder="All visit status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All visit status</SelectItem>
                  <SelectItem value="Draft" className="text-xs">Draft</SelectItem>
                  <SelectItem value="Photos Submitted" className="text-xs">Photos Submitted</SelectItem>
                  <SelectItem value="Sent To Beluga" className="text-xs">Sent To Beluga</SelectItem>
                  <SelectItem value="Prescribed" className="text-xs">Prescribed</SelectItem>
                  <SelectItem value="Declined" className="text-xs">Declined</SelectItem>
                </SelectContent>
              </Select>

              {/* Select Fulfillment */}
              <Select value={fulfillFilter} onValueChange={setFulfillFilter}>
                <SelectTrigger className="h-8 text-xs font-semibold bg-background border border-input rounded-md px-2.5 min-w-[130px] w-full sm:w-auto">
                  <SelectValue placeholder="All fulfillment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All fulfillment</SelectItem>
                  <SelectGroup>
                    <SelectLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-1 px-2.5">Pharmacy</SelectLabel>
                    <SelectItem value="Not Started" className="text-xs">Not Started</SelectItem>
                    <SelectItem value="Rx Sent" className="text-xs">Rx Sent</SelectItem>
                    <SelectItem value="Shipped" className="text-xs">Shipped</SelectItem>
                    <SelectItem value="Delivered" className="text-xs">Delivered</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reset Filters */}
          <div className="flex justify-start lg:justify-end shrink-0">
            <button
              onClick={handleResetFilters}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-medium transition-colors"
            >
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="inline mr-0.5">
                <path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 6.7 3M21 12a9 9 0 0 1-9 9 9 9 0 0 1-6.7-3M3 8h6V2M21 16h-6v6" />
              </svg>
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2 w-full items-center">
        <Input
          placeholder="Search by order #, patient, phone, email"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full sm:w-96 h-9 text-xs"
        />
      </div>

      {/* Table wrapper */}
      <div className="border rounded-lg bg-card overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse text-left min-w-[1200px]">
            <thead className="bg-muted/30 border-b border-border/80 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">ORDER #</th>
                <th className="py-3 px-4 font-semibold">PATIENT</th>
                <th className="py-3 px-4 font-semibold">EMAIL</th>
                <th className="py-3 px-4 font-semibold">PHONE</th>
                <th className="py-3 px-4 font-semibold">CLIENT</th>
                <th className="py-3 px-4 font-semibold">PRODUCT</th>
                <th className="py-3 px-4 font-semibold">PHARMACY / LAB</th>
                <th className="py-3 px-4 font-semibold">ORDER STATUS</th>
                <th className="py-3 px-4 font-semibold">PAYMENT</th>
                <th className="py-3 px-4 font-semibold">VISIT</th>
                <th className="py-3 px-4 font-semibold">FULFILLMENT</th>
                <th className="py-3 px-4 font-semibold">AMOUNT</th>
                <th className="py-3 px-4 font-semibold">DATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {filteredOrders.map(o => {
                const isLabOrder = o.type === "lab";
                const typeBadge = isLabOrder ? (
                  <span
                    className="inline-block px-1.5 py-0.5 rounded text-[9.5px] font-bold border ml-1.5 select-none align-middle"
                    style={{ backgroundColor: "#ccfbf1", color: "#0f766e", borderColor: "#99f6e4" }}
                  >
                    Lab
                  </span>
                ) : (
                  <span
                    className="inline-block px-1.5 py-0.5 rounded text-[9.5px] font-bold border ml-1.5 select-none align-middle"
                    style={{ backgroundColor: "#f1f5f9", color: "#475569", borderColor: "#e2e8f0" }}
                  >
                    Rx
                  </span>
                );

                return (
                  <tr key={o.id} className="hover:bg-muted/5">
                    <td className="py-3.5 px-4 font-medium">
                      <button
                        onClick={() => handleOrderClick(o)}
                        className="text-blue-600 hover:underline font-semibold text-left"
                      >
                        {o.id}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-foreground font-medium">{o.patient}</td>
                    <td className="py-3.5 px-4 text-muted-foreground text-[11.5px]">{o.email}</td>
                    <td className="py-3.5 px-4 text-muted-foreground text-[11.5px] whitespace-nowrap">{o.phone}</td>
                    <td className="py-3.5 px-4 text-foreground font-medium">{o.client}</td>
                    <td className="py-3.5 px-4 text-foreground">
                      <span className="font-medium">{o.product}</span>
                      {typeBadge}
                    </td>
                    <td className="py-3.5 px-4 text-foreground font-medium">{o.fulfiller}</td>
                    <td className="py-3.5 px-4">
                      <OrderPill status={o.orderStatus} />
                    </td>
                    <td className="py-3.5 px-4">
                      <OrderPill status={o.payment} />
                    </td>
                    <td className="py-3.5 px-4">
                      <OrderPill status={o.visit} />
                    </td>
                    <td className="py-3.5 px-4">
                      <OrderPill status={o.fulfillment} />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-foreground">${o.amount.toFixed(2)}</div>
                      {o.remaining != null && o.remaining > 0 && (
                        <div className="text-[10px] text-amber-700 mt-0.5">
                          Remaining ${o.remaining.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">{o.date}</td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={13} className="text-center py-12 text-muted-foreground text-sm">
                    No orders match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination / Count Info */}
      <div className="text-xs text-muted-foreground mt-2">
        Showing {filteredOrders.length} of {allNormalizedOrders.length} orders
      </div>

      {/* Detail Drawer Component */}
      <OrderDetailDrawer
        order={selectedOrder}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onOrderUpdated={handleOrderUpdated}
      />
    </div>
  );
}
