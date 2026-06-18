import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { clientApi } from "@/api/clientApi";
import type { B2BInvoice } from "@/types/b2bBilling";
import { CheckCircle2, GitBranch, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

type DisplayInvoice = B2BInvoice & {
  supplementalInvoices?: B2BInvoice[];
};

export default function Billing() {
  const queryClient = useQueryClient();
  const [invoiceType, setInvoiceType] = useState<
    "all" | "reimbursement" | "credit_note" | "saas_fee"
  >("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selected, setSelected] = useState<B2BInvoice | null>(null);
  const [status, setStatus] = useState("");
  const [ordering, setOrdering] = useState("-issued_at");
  const [page, setPage] = useState(1);

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { ordering, page, page_size: 25 };
    if (invoiceType !== "all") params.invoice_type = invoiceType;
    if (search.trim()) params.search = search.trim();
    if (fromDate) params.issued_at_after = fromDate;
    if (toDate) params.issued_at_before = toDate;
    if (status) params.status = status;
    return params;
  }, [invoiceType, search, fromDate, toDate, status, ordering, page]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["b2bAllInvoices", queryParams],
    queryFn: () => clientApi.getAllB2BInvoices(queryParams),
  });

  const invoices: B2BInvoice[] = data?.results || [];
  const selectedClientId = (selected as any)?.client?.id || (selected as any)?.client_id || (selected as any)?.client;

  const markRefundMutation = useMutation({
    mutationFn: (invoice: B2BInvoice) => {
      const clientId = (invoice as any)?.client?.id || (invoice as any)?.client_id || (invoice as any)?.client;
      return clientApi.markB2BRefundProcessed(clientId, invoice.id);
    },
    onSuccess: () => {
      toast.success("Refund marked processed");
      queryClient.invalidateQueries({ queryKey: ["b2bAllInvoices"] });
      if (selectedClientId) {
        queryClient.invalidateQueries({ queryKey: ["b2bInvoices", selectedClientId] });
      }
      setSelected((prev) =>
        prev
          ? {
            ...prev,
            status: "refunded",
            refund_required: false,
            refund_required_amount: "0.00",
          }
          : prev
      );
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to mark refund processed");
    },
  });

  const formatLabel = (value?: string | null) =>
    (value || "-")
      .toString()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());

  const statusPillClass = (value: string) => {
    const normalized = value.toLowerCase();
    if (normalized === "paid") {
      return "bg-green-100 text-green-700";
    }
    if (normalized === "failed" || normalized === "overdue") {
      return "bg-red-100 text-red-700";
    }
    if (normalized === "authorization_failed" || normalized === "pending" || normalized === "due") {
      return "bg-amber-100 text-amber-700";
    }
    return "bg-primary/10 text-primary";
  };

  const getClientOrderNumber = (inv?: B2BInvoice | null) =>
    (inv as any)?.client_order_number ||
    (inv as any)?.source_tenant_order_display_id ||
    "-";

  const lineItemTypeLabel = (li: any) => {
    if (li?.item_type === "consultation") {
      const mode = String(li?.metadata?.consult_mode || "").toLowerCase();
      if (mode === "sync") return "Sync Consult";
      if (mode === "async") return "Async Consult";
    }
    return formatLabel(li?.item_type);
  };

  const formatBreakdown = (inv: B2BInvoice) => {
    const items = (inv as any).line_items ?? [];
    const pharmacy = items
      .filter((li: any) => ["medication_reimbursement", "shipping_cost"].includes(li.item_type))
      .reduce(
        (sum: number, li: any) =>
          sum + parseFloat(li.total_amount || li.unit_price || 0),
        0
      );
    const consult = items
      .filter((li: any) => li.item_type === "consultation")
      .reduce(
        (sum: number, li: any) =>
          sum + parseFloat(li.total_amount || li.unit_price || 0),
        0
      );
    if (!pharmacy && !consult) return "-";
    return `Pharmacy: $${pharmacy.toFixed(2)} · Consult: $${consult.toFixed(2)}`;
  };
  const groupedInvoices = useMemo(() => {
    const displayRows: DisplayInvoice[] = [];
    const supplementalByParent = new Map<string, B2BInvoice[]>();

    invoices.forEach((inv) => {
      if (!inv.is_supplemental_split_capture || !inv.supplemental_parent_invoice_id) return;
      const bucket = supplementalByParent.get(inv.supplemental_parent_invoice_id) || [];
      bucket.push(inv);
      supplementalByParent.set(inv.supplemental_parent_invoice_id, bucket);
    });

    invoices.forEach((inv) => {
      if (inv.is_supplemental_split_capture) {
        return;
      }
      const linkedSupplementals =
        inv.invoice_type === "reimbursement" ? supplementalByParent.get(inv.id) || [] : [];
      displayRows.push({
        ...inv,
        supplementalInvoices: linkedSupplementals,
      });
    });

    if (ordering !== "-issued_at" && ordering !== "issued_at") return displayRows;

    const direction = ordering === "-issued_at" ? -1 : 1;
    const toTime = (value?: string) => (value ? new Date(value).getTime() : null);

    return [...displayRows].sort((a, b) => {
      const aIssued = toTime(a.issued_at);
      const bIssued = toTime(b.issued_at);

      // Keep null issued_at rows at the bottom for both newest and oldest sorts.
      if (aIssued === null && bIssued !== null) return 1;
      if (aIssued !== null && bIssued === null) return -1;

      if (aIssued !== null && bIssued !== null && aIssued !== bIssued) {
        return (aIssued - bIssued) * direction;
      }

      const aCreated = toTime(a.created_at) ?? 0;
      const bCreated = toTime(b.created_at) ?? 0;
      return (aCreated - bCreated) * direction;
    });
  }, [invoices, ordering]);

  const getDisplayDate = (inv: B2BInvoice) => inv.issued_at || inv.created_at;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invoices</h1>
      </div>

      <div className="flex items-center gap-3">
        {[
          { key: "all", label: "All Invoices" },
          { key: "reimbursement", label: "Reimbursement Billings" },
          { key: "credit_note", label: "Credit Notes" },
          { key: "saas_fee", label: "Monthly SaaS Fee Invoices" },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`px-3 py-1 rounded text-sm ${invoiceType === tab.key ? "bg-muted" : "hover:bg-muted/50"
              }`}
            onClick={() => {
              setInvoiceType(tab.key as any);
              setPage(1);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                className="w-full pl-9 pr-3 py-2 rounded-md border bg-background text-sm focus:ring-1 focus:ring-primary"
                placeholder="Search invoice # or client order #"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <select
              className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
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
              className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              value={ordering}
              onChange={(e) => {
                setOrdering(e.target.value);
                setPage(1);
              }}
            >
              <option value="-issued_at">Newest first</option>
              <option value="issued_at">Oldest first</option>
              <option value="-total_amount">Amount high → low</option>
              <option value="total_amount">Amount low → high</option>
              <option value="status">Status A → Z</option>
            </select>
            <input
              className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
            />
            <input
              className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          {isLoading && (
            <div className="text-sm text-muted-foreground">Loading invoices…</div>
          )}
          {error && (
            <div className="text-sm text-red-500">Failed to load invoices.</div>
          )}
          {!isLoading && invoices.length === 0 && (
            <div className="text-sm text-muted-foreground">No invoices found.</div>
          )}
          {groupedInvoices.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase text-muted-foreground bg-muted/30">
                  <tr className="border-b">
                    <th className="px-6 py-3 font-semibold tracking-wider">Date</th>
                    <th className="px-6 py-3 font-semibold tracking-wider">Invoice</th>
                    <th className="px-6 py-3 font-semibold tracking-wider">Client Order #</th>
                    <th className="px-6 py-3 font-semibold tracking-wider">Client</th>
                    <th className="px-6 py-3 font-semibold tracking-wider">Type</th>
                    <th className="px-6 py-3 font-semibold tracking-wider">Breakdown</th>
                    <th className="px-6 py-3 font-semibold tracking-wider">Status</th>
                    <th className="px-6 py-3 font-semibold tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedInvoices.map((inv) => {
                    const baseAmount = parseFloat(
                      (inv as any).total_amount ?? "0"
                    );
                    const displayDate = getDisplayDate(inv);
                    const status = ((inv as any).is_overdue && inv.status !== "paid"
                      ? "overdue"
                      : inv.status || "-").toString();
                    const supplementalTotal = (inv.supplementalInvoices || []).reduce(
                      (sum, child) => sum + parseFloat((child as any).total_amount ?? "0"),
                      0
                    );
                    const hasNestedSupplementals = (inv.supplementalInvoices || []).length > 0;
                    const displayAmount = baseAmount + supplementalTotal;
                    return (
                      <tr
                        key={inv.id}
                        className={`border-b hover:bg-muted/10 transition-colors ${hasNestedSupplementals ? "bg-amber-50/50" : ""
                          }`}
                        onClick={() => setSelected(inv)}
                        role="button"
                      >
                        <td className="px-6 py-4">
                          {displayDate
                            ? new Date(displayDate).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {inv.invoice_number}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">
                          {getClientOrderNumber(inv)}
                        </td>
                        <td className="px-6 py-4">
                          {(inv as any).client_name || (inv as any).client?.name || "-"}
                        </td>
                        <td className="px-6 py-4">
                          {formatLabel(inv.invoice_type)}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          <div>{formatBreakdown(inv)}</div>
                          {hasNestedSupplementals && (
                            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                              <GitBranch className="h-3 w-3" />
                              Split Capture · +${supplementalTotal.toFixed(2)} supplemental
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusPillClass(status)}`}>
                            {formatLabel(status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium">${displayAmount.toFixed(2)}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {data && (data.next || data.previous) && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <button
                className="px-3 py-1 rounded border disabled:opacity-50"
                disabled={!data.previous}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="text-muted-foreground">
                Page {page} · {invoices.length} of {data.count}
              </span>
              <button
                className="px-3 py-1 rounded border disabled:opacity-50"
                disabled={!data.next}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-md p-4 w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Invoice {selected.invoice_number}</h3>
              <div className="flex items-center gap-2">
                {String(selected.invoice_type) === "credit_note" && (selected as any).refund_required && (
                  <button
                    onClick={() => {
                      if (window.confirm("Mark this credit note as refunded in the system?")) {
                        markRefundMutation.mutate(selected);
                      }
                    }}
                    disabled={markRefundMutation.isPending}
                    className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                  >
                    {markRefundMutation.isPending ? "Processing..." : "Mark Refund Processed"}
                  </button>
                )}
                <button onClick={() => setSelected(null)} className="text-sm px-2 py-1">
                  Close
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-4">
              <div className="rounded border p-3"><strong>Client:</strong> {(selected as any).client_name || "-"}</div>
              <div className="rounded border p-3"><strong>Client Order #:</strong> {getClientOrderNumber(selected)}</div>
              <div className="rounded border p-3"><strong>Type:</strong> {selected.invoice_type?.replace("_", " ")}</div>
              <div className="rounded border p-3"><strong>Status:</strong> {selected.status}</div>
              <div className="rounded border p-3">
                <strong>Total:</strong> $
                {(
                  parseFloat((selected as any).total_amount ?? "0") +
                  (((selected as DisplayInvoice).supplementalInvoices || []).reduce(
                    (sum, child) => sum + parseFloat((child as any).total_amount ?? child.total_amount ?? "0"),
                    0
                  ))
                ).toFixed(2)}
              </div>
              <div className="rounded border p-3"><strong>Issued:</strong> {selected.issued_at ? new Date(selected.issued_at).toLocaleDateString() : "-"}</div>
              <div className="rounded border p-3"><strong>Due:</strong> {selected.due_date ? new Date(selected.due_date).toLocaleDateString() : "N/A"}</div>
            </div>
            {((selected as DisplayInvoice).supplementalInvoices || []).length > 0 && (
              <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm">
                <div className="font-medium text-amber-900">Split Capture Details</div>
                <div className="mt-1 text-amber-800">
                  Supplemental reimbursements are consolidated into this invoice row for readability.
                </div>
                {(() => {
                  const parentAmount = parseFloat((selected as any).total_amount ?? selected.total_amount ?? "0");
                  const supplemental = ((selected as DisplayInvoice).supplementalInvoices || []);
                  const supplementalTotal = supplemental.reduce(
                    (sum, child) => sum + parseFloat((child as any).total_amount ?? child.total_amount ?? "0"),
                    0
                  );
                  const combined = parentAmount + supplementalTotal;
                  return (
                    <>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="rounded border border-amber-200 bg-white px-2 py-1">
                          <div className="text-[11px] text-amber-700">Base Invoice</div>
                          <div className="font-semibold text-amber-900">
                            {selected.invoice_number}: ${parentAmount.toFixed(2)}
                          </div>
                        </div>
                        <div className="rounded border border-amber-200 bg-white px-2 py-1">
                          <div className="text-[11px] text-amber-700">Supplemental Total</div>
                          <div className="font-semibold text-amber-900">${supplementalTotal.toFixed(2)}</div>
                        </div>
                        <div className="rounded border border-amber-200 bg-white px-2 py-1">
                          <div className="text-[11px] text-amber-700">Combined Settlement</div>
                          <div className="font-semibold text-amber-900">${combined.toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="mt-2 rounded border border-amber-200 bg-white overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-amber-100/70">
                            <tr>
                              <th className="px-2 py-1 text-left">Invoice #</th>
                              <th className="px-2 py-1 text-left">Status</th>
                              <th className="px-2 py-1 text-left">Issued</th>
                              <th className="px-2 py-1 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {supplemental.map((child) => {
                              const childAmount = parseFloat((child as any).total_amount ?? child.total_amount ?? "0");
                              const issued = (child as any).issued_at || (child as any).created_at;
                              return (
                                <tr key={child.id} className="border-t border-amber-100">
                                  <td className="px-2 py-1 font-medium">{child.invoice_number}</td>
                                  <td className="px-2 py-1">{formatLabel(child.status)}</td>
                                  <td className="px-2 py-1">{issued ? new Date(issued).toLocaleString() : "-"}</td>
                                  <td className="px-2 py-1 text-right">${childAmount.toFixed(2)}</td>
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
            {selected.invoice_type === "reimbursement" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-4">
                <div className="rounded border p-3">
                  <strong>Intended Auth Amount:</strong> {(selected as any).intended_authorization_amount || "-"}
                </div>
                <div className="rounded border p-3">
                  <strong>Auth Retry Count:</strong> {(selected as any).authorization_retry_count ?? "-"}
                </div>
                <div className="rounded border p-3">
                  <strong>Next Auth Retry:</strong> {(selected as any).authorization_next_retry_at ? new Date((selected as any).authorization_next_retry_at).toLocaleString() : "-"}
                </div>
                <div className="rounded border p-3">
                  <strong>Retry Exhausted At:</strong> {(selected as any).authorization_retry_exhausted_at ? new Date((selected as any).authorization_retry_exhausted_at).toLocaleString() : "-"}
                </div>
                <div className="rounded border p-3">
                  <strong>Auth Error Code:</strong> {(selected as any).authorization_last_error_code || "-"}
                </div>
                <div className="rounded border p-3">
                  <strong>Auth Error Message:</strong> {(selected as any).authorization_last_error_message || "-"}
                </div>
              </div>
            )}
            <div className="mt-4">
              <h4 className="font-medium mb-2">Line Items</h4>
              {(selected.line_items ?? []).length === 0 ? (
                <div className="rounded border p-3 text-sm text-muted-foreground">No line items</div>
              ) : (
                <div className="rounded border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="text-left px-3 py-2">Type</th>
                        <th className="text-left px-3 py-2">Client Order #</th>
                        <th className="text-left px-3 py-2">Description</th>
                        <th className="text-right px-3 py-2">Qty</th>
                        <th className="text-right px-3 py-2">Unit Price</th>
                        <th className="text-right px-3 py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selected.line_items ?? []).map((li) => (
                        <tr key={li.id} className="border-t">
                          <td className="px-3 py-2">{lineItemTypeLabel(li)}</td>
                          <td className="px-3 py-2 font-mono text-xs">{(li as any).client_order_number || li.order_display_id || getClientOrderNumber(selected)}</td>
                          <td className="px-3 py-2">{li.description || "-"}</td>
                          <td className="px-3 py-2 text-right">{li.quantity ?? 0}</td>
                          <td className="px-3 py-2 text-right">{li.unit_price ?? 0}</td>
                          <td className="px-3 py-2 text-right">{(li as any).total_amount ?? 0}</td>
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
