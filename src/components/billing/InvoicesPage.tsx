import { useEffect, useMemo, useState } from "react";
import billingService, { Invoice, InvoiceListResponse } from "@/services/billingService";
import { Link } from "react-router-dom";
import { Search, Eye } from "lucide-react";

type InvoiceTab = "all" | "reimbursement" | "saas";
type InvoiceStatus = "" | "draft" | "pending" | "due" | "paid" | "overdue" | "failed" | "canceled" | "refunded";
type InvoiceOrdering = "-issued_at" | "issued_at" | "-total_amount" | "total_amount" | "status";

function formatMoney(value: string | number | undefined) {
  const parsed = Number(value ?? 0);
  return `$${Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00"}`;
}

function formatDate(value?: string) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusClass(status: string) {
  const s = status.toLowerCase();
  if (s === "paid") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
  if (s === "failed" || s === "overdue") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  if (s === "due" || s === "pending") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  return "bg-primary/10 text-primary dark:bg-primary/20";
}

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<InvoiceTab>("all");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState<InvoiceStatus>("");
  const [ordering, setOrdering] = useState<InvoiceOrdering>("-issued_at");
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const formatBreakdown = (inv: any) => {
    const items = inv.line_items ?? [];
    const pharmacy = items
      .filter((li: any) => ["medication_reimbursement", "shipping_cost"].includes(li.item_type))
      .reduce((sum: number, li: any) => sum + parseFloat(li.total_amount || li.unit_price || 0), 0);
    const consult = items
      .filter((li: any) => li.item_type === "consultation")
      .reduce((sum: number, li: any) => sum + parseFloat(li.total_amount || li.unit_price || 0), 0);
    if (!pharmacy && !consult) return "-";
    return `Pharmacy: $${pharmacy.toFixed(2)} · Consult: $${consult.toFixed(2)}`;
  };

  const params = useMemo(() => {
    const p: Record<string, unknown> = { ordering };
    if (search.trim()) p.invoice_number = search.trim();
    if (fromDate) p.issued_at_after = fromDate;
    if (toDate) p.issued_at_before = toDate;
    if (status) p.status = status;
    return p;
  }, [ordering, search, fromDate, toDate, status]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const res: InvoiceListResponse = await billingService.getInvoices(activeTab, page, 25, params);
      if (!mounted) return;
      const rows = res?.results || [];
      setInvoices(rows);
      setTotal(res?.count ?? rows.length);
      setHasNext(!!res?.next);
      setHasPrev(!!res?.previous);
      setLoading(false);
    };

    load();
    return () => {
      mounted = false;
    };
  }, [activeTab, page, params, search]);

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          className={`px-3 py-1 rounded ${activeTab === "all" ? "bg-slate-100 dark:bg-slate-800" : ""}`}
          onClick={() => {
            setActiveTab("all");
            setPage(1);
          }}
        >
          All Invoices
        </button>
        <button
          className={`px-3 py-1 rounded ${activeTab === "reimbursement" ? "bg-slate-100 dark:bg-slate-800" : ""}`}
          onClick={() => {
            setActiveTab("reimbursement");
            setPage(1);
          }}
        >
          Reimbursement Billings
        </button>
        <button
          className={`px-3 py-1 rounded ${activeTab === "saas" ? "bg-slate-100 dark:bg-slate-800" : ""}`}
          onClick={() => {
            setActiveTab("saas");
            setPage(1);
          }}
        >
          Monthly SaaS Fee Invoices
        </button>
      </div>

      <div className="bg-content-light dark:bg-content-dark p-4 rounded-lg shadow-md mb-6 border border-border-light dark:border-border-dark">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary-light dark:text-text-secondary-dark" />
            <input
              className="w-full pl-10 pr-4 py-2 rounded-md border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark"
              placeholder={activeTab === "reimbursement" ? "Search order/invoice" : "Search invoice number"}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            className="w-full py-2 px-4 rounded-md border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as InvoiceStatus);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="due">Due</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="failed">Failed</option>
            <option value="canceled">Canceled</option>
            <option value="refunded">Refunded</option>
          </select>
          <select
            className="w-full py-2 px-4 rounded-md border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark"
            value={ordering}
            onChange={(e) => {
              setOrdering(e.target.value as InvoiceOrdering);
              setPage(1);
            }}
          >
            <option value="-issued_at">Newest first</option>
            <option value="issued_at">Oldest first</option>
            <option value="-total_amount">Amount high to low</option>
            <option value="total_amount">Amount low to high</option>
            <option value="status">Status A to Z</option>
          </select>
          <input
            className="w-full py-2 px-4 rounded-md border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark"
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
          />
          <input
            className="w-full py-2 px-4 rounded-md border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark"
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="bg-content-light dark:bg-content-dark p-6 rounded-lg shadow-md border border-border-light dark:border-border-dark">
        {loading ? (
          <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Loading invoices...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark">
                <tr>
                  <th className="px-6 py-3 font-semibold tracking-wider">Date</th>
                  {activeTab === "reimbursement" ? (
                    <th className="px-6 py-3 font-semibold tracking-wider">Order</th>
                  ) : (
                    <th className="px-6 py-3 font-semibold tracking-wider">Invoice</th>
                  )}
                  <th className="px-6 py-3 font-semibold tracking-wider">Type</th>
                  <th className="px-6 py-3 font-semibold tracking-wider">Status</th>
                  <th className="px-6 py-3 font-semibold tracking-wider">Breakdown</th>
                  <th className="px-6 py-3 font-semibold tracking-wider">Amount</th>
                  <th className="px-6 py-3 font-semibold tracking-wider text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 && (
                  <tr className="border-b border-border-light dark:border-border-dark">
                    <td className="px-6 py-4" colSpan={7}>No invoices found</td>
                  </tr>
                )}
                {invoices.map((inv: any) => {
                  const effectiveStatus = inv.is_overdue && inv.status !== "paid" ? "overdue" : (inv.status || "-");
                  return (
                    <tr
                      key={inv.id}
                      className="border-b border-border-light dark:border-border-dark hover:bg-background-light/50 dark:hover:bg-background-dark/50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">{formatDate(inv.issued_at || inv.created_at)}</td>
                      {activeTab === "reimbursement" ? (
                        <td className="px-6 py-4">
                          <Link to="/dashboard/orders" className="block">
                            <div className="font-medium text-text-primary-light dark:text-text-primary-dark hover:text-primary transition-colors">
                              {inv.source_tenant_order_display_id ?? inv.invoice_number}
                            </div>
                            <div className="text-text-secondary-light dark:text-text-secondary-dark text-xs">
                              {inv.source_tenant_email ?? ""}
                            </div>
                          </Link>
                        </td>
                      ) : (
                        <td className="px-6 py-4">
                          <div className="font-medium text-text-primary-light dark:text-text-primary-dark">
                            {inv.invoice_number || "-"}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4">{(inv.invoice_type || "-").replace("_", " ")}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusClass(effectiveStatus)}`}>
                          {effectiveStatus}
                        </span>
                        {inv.external_invoice_link && (effectiveStatus === "due" || effectiveStatus === "overdue") && (
                          <div className="mt-2">
                            <a
                              href={inv.external_invoice_link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-medium text-primary hover:underline"
                            >
                              Pay now
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-text-secondary-light dark:text-text-secondary-dark">
                        {formatBreakdown(inv)}
                      </td>
                      <td className="px-6 py-4 font-medium">{formatMoney(inv.total_amount ?? inv.amount)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          className="inline-flex items-center gap-1 px-2 py-1 rounded border text-xs hover:bg-muted/50"
                          onClick={() => setSelected(inv)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 text-sm">
        <button
          className="px-3 py-1 rounded border disabled:opacity-50"
          disabled={!hasPrev}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </button>
        <span className="text-text-secondary-light dark:text-text-secondary-dark">
          Page {page} · {invoices.length} of {total}
        </span>
        <button
          className="px-3 py-1 rounded border disabled:opacity-50"
          disabled={!hasNext}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-md p-4 w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Invoice {selected.invoice_number}</h3>
              <button onClick={() => setSelected(null)} className="text-sm px-2 py-1 border rounded">
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-4">
              <div className="rounded border p-3"><strong>Status:</strong> {selected.status}</div>
              <div className="rounded border p-3"><strong>Type:</strong> {(selected.invoice_type || "-").replace("_", " ")}</div>
              <div className="rounded border p-3"><strong>Total:</strong> {formatMoney((selected as any).total_amount ?? selected.amount)}</div>
              <div className="rounded border p-3"><strong>Issued:</strong> {formatDate((selected as any).issued_at || selected.created_at)}</div>
              <div className="rounded border p-3"><strong>Due:</strong> {formatDate((selected as any).due_date)}</div>
              <div className="rounded border p-3"><strong>Billing Period:</strong> {formatDate((selected as any).billing_period_start)} to {formatDate((selected as any).billing_period_end)}</div>
            </div>

            <div className="mt-2">
              <h4 className="font-medium mb-2">Line Items</h4>
              {(selected.line_items ?? []).length === 0 ? (
                <div className="rounded border p-3 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  No line items available for this invoice.
                </div>
              ) : (
                <div className="rounded border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="text-left px-3 py-2">Type</th>
                        <th className="text-left px-3 py-2">Description</th>
                        <th className="text-right px-3 py-2">Qty</th>
                        <th className="text-right px-3 py-2">Unit</th>
                        <th className="text-right px-3 py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selected.line_items ?? []).map((li) => (
                        <tr key={li.id} className="border-t">
                          <td className="px-3 py-2">{(li as any).item_type?.replace(/_/g, " ")}</td>
                          <td className="px-3 py-2">{li.description || "-"}</td>
                          <td className="px-3 py-2 text-right">{li.quantity ?? 0}</td>
                          <td className="px-3 py-2 text-right">{formatMoney(li.unit_price)}</td>
                          <td className="px-3 py-2 text-right font-medium">{formatMoney((li as any).total_amount ?? li.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
