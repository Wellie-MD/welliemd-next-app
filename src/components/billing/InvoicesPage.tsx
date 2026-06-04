import { useEffect, useMemo, useState } from "react";
import billingService, { Invoice, InvoiceListResponse } from "@/services/billingService";
import { Link } from "react-router-dom";
import { Loader2, Search, Eye, GitBranch } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type DisplayInvoice = Invoice & {
  supplementalInvoices?: Invoice[];
};

type InvoiceTab = "all" | "reimbursement" | "saas";
type InvoiceStatus =
  | ""
  | "draft"
  | "pending"
  | "authorized"
  | "authorization_failed"
  | "due"
  | "paid"
  | "overdue"
  | "failed"
  | "canceled"
  | "refunded";
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

function formatLabel(value?: string) {
  if (!value) return "-";
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase();
      if (lower === "saas") return "SaaS";
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function statusClass(status: string) {
  const s = status.toLowerCase();
  if (s === "paid") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
  if (s === "failed" || s === "overdue") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  if (s === "due" || s === "pending" || s === "authorization_failed") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  }
  return "bg-primary/10 text-primary dark:bg-primary/20";
}

function getAccessPeriodFromInvoice(inv: any): string | null {
  const baseLine = (inv?.line_items || []).find(
    (li: any) => li?.metadata?.line_kind === "subscription_base_advance"
  );
  const start = baseLine?.metadata?.access_period_start;
  const end = baseLine?.metadata?.access_period_end;
  if (!start || !end) return null;
  return `${formatDate(start)} to ${formatDate(end)}`;
}

function getClientOrderNumber(inv: any): string {
  return inv?.client_order_number || inv?.source_tenant_order_display_id || inv?.invoice_number || "-";
}

function normalizeLineItemDescription(description: string | undefined, orderId: string): string {
  const desc = String(description ?? "").trim();
  if (!desc || !orderId || orderId === "-") return desc || "-";

  // Replace any existing "for Order <something>" suffix with the real order id.
  // This fixes older invoices whose descriptions were stored with display IDs.
  if (/\bfor Order\b/i.test(desc)) {
    return desc.replace(/\bfor Order\b.*$/i, `for Order ${orderId}`);
  }
  return desc;
}

function lineItemTypeLabel(li: any): string {
  if (li?.item_type === "consultation") {
    const mode = String(li?.metadata?.consult_mode || "").toLowerCase();
    if (mode === "sync") return "Sync Consult";
    if (mode === "async") return "Async Consult";
  }
  return formatLabel(li?.item_type);
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
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);

  const getStatusBadgeClass = (status?: string, isOverdue?: boolean) => {
    const normalized = (status || "").toLowerCase();
    if (normalized === "paid") {
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    }
    if (normalized === "failed" || normalized === "overdue" || isOverdue) {
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    }
    if (normalized === "due" || normalized === "pending" || normalized === "authorization_failed") {
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    }
    if (normalized === "canceled") {
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
    return "bg-primary/10 text-primary dark:bg-primary/20";
  };

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
    if (search.trim()) p.search = search.trim();
    if (fromDate) p.issued_at_after = fromDate;
    if (toDate) p.issued_at_before = toDate;
    if (status) p.status = status;
    return p;
  }, [ordering, search, fromDate, toDate, status]);

  const displayedInvoices = useMemo(() => {
    const displayRows: DisplayInvoice[] = [];
    const supplementalByParent = new Map<string, Invoice[]>();
    const invoiceIds = new Set(invoices.map((inv) => inv.id));

    invoices.forEach((inv) => {
      if (!inv.is_supplemental_split_capture || !inv.supplemental_parent_invoice_id) return;
      const bucket = supplementalByParent.get(inv.supplemental_parent_invoice_id) || [];
      bucket.push(inv);
      supplementalByParent.set(inv.supplemental_parent_invoice_id, bucket);
    });

    invoices.forEach((inv) => {
      if (inv.is_supplemental_split_capture) {
        // Only collapse a supplemental row when its parent is present on this page.
        // Otherwise the current page can render almost empty while the API returned rows.
        if (inv.supplemental_parent_invoice_id && invoiceIds.has(inv.supplemental_parent_invoice_id)) {
          return;
        }
        displayRows.push(inv);
        return;
      }
      const backendSupplementals = Array.isArray(inv.supplemental_invoices)
        ? inv.supplemental_invoices.map((child) => ({
            ...child,
            invoice_type: "reimbursement",
            is_supplemental_split_capture: true,
            supplemental_parent_invoice_id: inv.id,
            supplemental_parent_invoice_number: inv.invoice_number,
          } as Invoice))
        : [];
      const pageSupplementals = inv.invoice_type === "reimbursement" ? supplementalByParent.get(inv.id) || [] : [];
      const seenSupplementalIds = new Set<string>();
      const linkedSupplementals = [...backendSupplementals, ...pageSupplementals].filter((child) => {
        if (seenSupplementalIds.has(child.id)) return false;
        seenSupplementalIds.add(child.id);
        return true;
      });
      displayRows.push({
        ...inv,
        supplementalInvoices: linkedSupplementals,
      });
    });

    if (ordering !== "-issued_at" && ordering !== "issued_at") {
      return displayRows;
    }

    const direction = ordering === "-issued_at" ? -1 : 1;
    const toTime = (value?: string) => (value ? new Date(value).getTime() : null);
    const getDisplayTime = (inv: any) => toTime(inv?.issued_at || inv?.created_at);

    return [...displayRows].sort((a: any, b: any) => {
      // Sort by the same date used in the table display column.
      const aDisplayTime = getDisplayTime(a);
      const bDisplayTime = getDisplayTime(b);

      // Keep rows with no displayable date at the bottom for both sorts.
      if (aDisplayTime === null && bDisplayTime !== null) return 1;
      if (aDisplayTime !== null && bDisplayTime === null) return -1;

      if (aDisplayTime !== null && bDisplayTime !== null && aDisplayTime !== bDisplayTime) {
        return (aDisplayTime - bDisplayTime) * direction;
      }

      // Stable tie-breaker.
      const aCreated = toTime(a?.created_at) ?? 0;
      const bCreated = toTime(b?.created_at) ?? 0;
      return (aCreated - bCreated) * direction;
    });
  }, [invoices, ordering]);

  const loadInvoices = async () => {
    setLoading(true);
    const res: InvoiceListResponse = await billingService.getInvoices(activeTab, page, 25, params);
    setInvoices(res?.results || []);
    setTotal(res?.count ?? 0);
    setHasNext(!!res?.next);
    setHasPrev(!!res?.previous);
    setLoading(false);
  };

  const applyFilters = async () => {
    setPage(1);
    await loadInvoices();
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!mounted) return;
      await loadInvoices();
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [activeTab, page, params]);

  const handlePayNow = async (invoiceId: string) => {
    if (payingInvoiceId) return;
    setPayingInvoiceId(invoiceId);
    try {
      toast.info("Processing payment...");
      const initial = await billingService.payInvoiceNow(invoiceId);
      if (initial.success) {
        toast.success("Payment successful.");
        await loadInvoices();
        return;
      }

      if (initial.requires_action && initial.client_secret) {
        toast.info("Additional card authentication is required.");
        const publishable = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        if (!publishable) {
          toast.error("Stripe publishable key is not configured.");
          return;
        }

        const { loadStripe } = await import("@stripe/stripe-js");
        const stripe = await loadStripe(publishable);
        if (!stripe) {
          toast.error("Failed to initialize Stripe.");
          return;
        }

        const confirmResult = await stripe.confirmCardPayment(initial.client_secret);
        if (confirmResult.error) {
          toast.error(confirmResult.error.message || "Authentication failed.");
          return;
        }

        const confirmedIntentId = confirmResult.paymentIntent?.id || initial.payment_intent_id;
        if (!confirmedIntentId) {
          toast.error("Payment confirmation missing payment intent id.");
          return;
        }

        const finalized = await billingService.payInvoiceNow(invoiceId, confirmedIntentId);
        if (finalized.success) {
          toast.success("Payment successful.");
          await loadInvoices();
        } else {
          toast.error(finalized.message || "Failed to finalize payment.");
        }
        return;
      }

      toast.error(initial.message || "Payment failed.");
    } finally {
      setPayingInvoiceId(null);
    }
  };

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
              placeholder={activeTab === "reimbursement" ? "Search order # or invoice #" : "Search invoice # or order #"}
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
            <option value="authorized">Authorized</option>
            <option value="authorization_failed">Authorization Failed</option>
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
          <div className="grid grid-cols-2 gap-2 sm:col-span-2 lg:col-span-2">
            <div className="relative">
              <input
                className="form-input w-full py-2 px-4 pr-8 rounded-md border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:ring-primary focus:border-primary transition-all duration-200"
                placeholder="mm/dd/yyyy"
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="relative">
              <input
                className="form-input w-full py-2 px-4 pr-8 rounded-md border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:ring-primary focus:border-primary transition-all duration-200"
                placeholder="mm/dd/yyyy"
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-4 pt-4 border-t border-border-light dark:border-border-dark">
          <Button
            type="button"
            onClick={() => void applyFilters()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Search
          </Button>
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
                  <th className="px-6 py-3 font-semibold tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 && (
                  <tr className="border-b border-border-light dark:border-border-dark">
                    <td className="px-6 py-4" colSpan={7}>
                      No invoices found
                    </td>
                  </tr>
                )}
                {displayedInvoices.map((inv: DisplayInvoice) => {
                  const effectiveStatus = inv.is_overdue && inv.status !== "paid" ? "overdue" : (inv.status || "-");
                  const supplementalTotal = (inv.supplementalInvoices || []).reduce(
                    (sum, child) => sum + Number((child.total_amount ?? child.amount) || 0),
                    0
                  );
                  const hasNestedSupplementals = (inv.supplementalInvoices || []).length > 0;
                  return (
                    <tr
                      key={inv.id}
                      className={`border-b border-border-light dark:border-border-dark hover:bg-background-light/50 dark:hover:bg-background-dark/50 transition-colors duration-150 cursor-pointer ${
                        hasNestedSupplementals ? "bg-amber-50/40 dark:bg-amber-900/10" : ""
                      }`}
                      onClick={() => setSelected(inv)}
                    >
                      <td className="px-6 py-4">{formatDate(inv.issued_at || inv.created_at)}</td>
                      {activeTab === "reimbursement" ? (
                        <td className="px-6 py-4">
                          <Link to="/dashboard/orders" className="block">
                            <div className="font-medium text-text-primary-light dark:text-text-primary-dark hover:text-primary transition-colors">
                              {getClientOrderNumber(inv)}
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
                      <td className="px-6 py-4">{formatLabel(inv.invoice_type)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusBadgeClass(inv.status, inv.is_overdue)}`}>
                          {formatLabel(effectiveStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-secondary-light dark:text-text-secondary-dark">
                        <div>{formatBreakdown(inv)}</div>
                        {hasNestedSupplementals && (
                          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                            <GitBranch className="h-3 w-3" />
                            Split Capture · +${supplementalTotal.toFixed(2)} supplemental
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium">{formatMoney(inv.total_amount ?? inv.amount)}</td>
                      <td className="px-6 py-4 text-right">
                        {(inv.status === "due" || inv.status === "overdue" || inv.status === "failed" || inv.status === "authorization_failed" || inv.is_overdue) ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="default"
                            disabled={payingInvoiceId === inv.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              void handlePayNow(inv.id);
                            }}
                            className="min-w-[130px] bg-red-600 text-white hover:bg-red-700"
                          >
                            {payingInvoiceId === inv.id ? (
                              <>
                                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                Processing
                              </>
                            ) : (
                              inv.status === "authorization_failed" ? "Retry Authorization" : "Pay Now"
                            )}
                          </Button>
                        ) : (
                          <button
                            className="inline-flex items-center gap-1 px-2 py-1 rounded border text-xs hover:bg-muted/50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(inv);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>
                        )}
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
              <div className="rounded border p-3">
                <strong>Status:</strong> {formatLabel(selected.status)}
              </div>
              <div className="rounded border p-3">
                <strong>Type:</strong> {formatLabel(selected.invoice_type)}
              </div>
              {selected.invoice_type === "reimbursement" && (
                <div className="rounded border p-3">
                  <strong>Client Order #:</strong> {getClientOrderNumber(selected)}
                </div>
              )}
              <div className="rounded border p-3">
                <strong>Total:</strong> {formatMoney((selected as any).total_amount ?? selected.amount)}
              </div>
              <div className="rounded border p-3">
                <strong>Issued:</strong> {formatDate((selected as any).issued_at || selected.created_at)}
              </div>
              <div className="rounded border p-3">
                <strong>Due:</strong> {formatDate((selected as any).due_date)}
              </div>
              <div className="rounded border p-3">
                <strong>{selected.invoice_type === "saas_fee" ? "Usage Billing Period" : "Billing Period"}:</strong>{" "}
                {formatDate((selected as any).billing_period_start)} to{" "}
                {formatDate((selected as any).billing_period_end)}
              </div>
              {selected.invoice_type === "saas_fee" && getAccessPeriodFromInvoice(selected) && (
                <div className="rounded border p-3">
                  <strong>Renewal Access Period:</strong> {getAccessPeriodFromInvoice(selected)}
                </div>
              )}
              {selected.invoice_type === "reimbursement" && (
                <>
                  <div className="rounded border p-3">
                    <strong>Intended Auth Amount:</strong> {(selected as any).intended_authorization_amount || "-"}
                  </div>
                  <div className="rounded border p-3">
                    <strong>Auth Retry Count:</strong> {(selected as any).authorization_retry_count ?? "-"}
                  </div>
                  <div className="rounded border p-3">
                    <strong>Next Auth Retry:</strong>{" "}
                    {(selected as any).authorization_next_retry_at
                      ? new Date((selected as any).authorization_next_retry_at).toLocaleString()
                      : "-"}
                  </div>
                  <div className="rounded border p-3">
                    <strong>Retry Exhausted At:</strong>{" "}
                    {(selected as any).authorization_retry_exhausted_at
                      ? new Date((selected as any).authorization_retry_exhausted_at).toLocaleString()
                      : "-"}
                  </div>
                  <div className="rounded border p-3">
                    <strong>Auth Error Code:</strong> {(selected as any).authorization_last_error_code || "-"}
                  </div>
                  <div className="rounded border p-3">
                    <strong>Auth Error Message:</strong> {(selected as any).authorization_last_error_message || "-"}
                  </div>
                </>
              )}
            </div>
            {((selected as DisplayInvoice).supplementalInvoices || []).length > 0 && (
              <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-900/20">
                <div className="font-medium text-amber-900 dark:text-amber-200">Split Capture Details</div>
                <div className="mt-1 text-amber-800 dark:text-amber-300">
                  Supplemental reimbursements are consolidated into this invoice row for readability.
                </div>
                {(() => {
                  const parentAmount = Number((selected.total_amount ?? selected.amount) || 0);
                  const intendedAuthAmount = Number((selected as any).intended_authorization_amount || 0);
                  const supplemental = ((selected as DisplayInvoice).supplementalInvoices || []);
                  const supplementalTotal = supplemental.reduce(
                    (sum, child) => sum + Number((child.total_amount ?? child.amount) || 0),
                    0
                  );
                  const derivedBase = parentAmount - supplementalTotal;
                  const baseAmount =
                    Number.isFinite(intendedAuthAmount) && intendedAuthAmount > 0
                      ? intendedAuthAmount
                      : Math.max(derivedBase, 0);
                  const combined = parentAmount;
                  return (
                    <>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="rounded border border-amber-200 bg-white px-2 py-1 dark:border-amber-700 dark:bg-slate-900">
                          <div className="text-[11px] text-amber-700 dark:text-amber-300">Base Invoice</div>
                          <div className="font-semibold text-amber-900 dark:text-amber-200">
                            {selected.invoice_number}: {formatMoney(baseAmount)}
                          </div>
                        </div>
                        <div className="rounded border border-amber-200 bg-white px-2 py-1 dark:border-amber-700 dark:bg-slate-900">
                          <div className="text-[11px] text-amber-700 dark:text-amber-300">Supplemental Total</div>
                          <div className="font-semibold text-amber-900 dark:text-amber-200">
                            {formatMoney(supplementalTotal)}
                          </div>
                        </div>
                        <div className="rounded border border-amber-200 bg-white px-2 py-1 dark:border-amber-700 dark:bg-slate-900">
                          <div className="text-[11px] text-amber-700 dark:text-amber-300">Combined Settlement</div>
                          <div className="font-semibold text-amber-900 dark:text-amber-200">
                            {formatMoney(combined)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 rounded border border-amber-200 bg-white overflow-x-auto dark:border-amber-700 dark:bg-slate-900">
                        <table className="w-full text-xs">
                          <thead className="bg-amber-100/70 dark:bg-amber-900/30">
                            <tr>
                              <th className="px-2 py-1 text-left">Invoice #</th>
                              <th className="px-2 py-1 text-left">Status</th>
                              <th className="px-2 py-1 text-left">Issued</th>
                              <th className="px-2 py-1 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {supplemental.map((child) => {
                              const issued = child.issued_at || child.created_at;
                              return (
                                <tr key={child.id} className="border-t border-amber-100 dark:border-amber-800/60">
                                  <td className="px-2 py-1 font-medium">{child.invoice_number}</td>
                                  <td className="px-2 py-1">{formatLabel(child.status)}</td>
                                  <td className="px-2 py-1">{issued ? new Date(issued).toLocaleString() : "-"}</td>
                                  <td className="px-2 py-1 text-right">{formatMoney(child.total_amount ?? child.amount)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

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
                        <th className="text-left px-3 py-2">Client Order #</th>
                        <th className="text-left px-3 py-2">Description</th>
                        <th className="text-right px-3 py-2">Qty</th>
                        <th className="text-right px-3 py-2">Unit</th>
                        <th className="text-right px-3 py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selected.line_items ?? []).map((li) => (
                        <tr key={li.id} className="border-t">
                          <td className="px-3 py-2">{lineItemTypeLabel(li)}</td>
                          <td className="px-3 py-2 font-mono text-xs">
                            {(li as any).client_order_number ||
                              (li as any).order_display_id ||
                              (selected.invoice_type === "reimbursement" ? getClientOrderNumber(selected) : "-")}
                          </td>
                          <td className="px-3 py-2">
                            {normalizeLineItemDescription(
                              li.description,
                              selected.invoice_type === "reimbursement" ? getClientOrderNumber(selected) : "-"
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">{li.quantity ?? 0}</td>
                          <td className="px-3 py-2 text-right">{formatMoney(li.unit_price)}</td>
                          <td className="px-3 py-2 text-right font-medium">
                            {formatMoney((li as any).total_amount ?? li.subtotal)}
                          </td>
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
