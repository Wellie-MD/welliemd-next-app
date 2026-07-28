import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, AlertCircle, Filter, Search, Eye, GitBranch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { clientApi } from "@/api/clientApi";
import type { B2BInvoice, InvoiceType } from "@/types/b2bBilling";
import { TreatmentPrescriptionInvoiceSets } from "@/features/treatments/orders/components/TreatmentPrescriptionInvoiceSets";

interface B2BInvoiceListProps {
  clientId: string;
}

type InvoiceStatusFilter =
  | "all"
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

function moneyNumber(value: string | number | undefined | null) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function invoiceAmount(inv: Pick<B2BInvoice, "total_amount">) {
  return moneyNumber(inv.total_amount);
}

function invoiceSupplementalTotal(inv: B2BInvoice) {
  return (inv.supplemental_invoices || []).reduce(
    (sum, child) => sum + moneyNumber(child.total_amount),
    0
  );
}

function invoiceCombinedTotal(inv: B2BInvoice) {
  const adjusted = Number(inv.adjustment_summary?.adjusted_total);
  if (Number.isFinite(adjusted)) return adjusted;
  return invoiceAmount(inv) + invoiceSupplementalTotal(inv);
}

function formatDate(dateString?: string) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusVariant(status: string) {
  switch (status) {
    case "paid":
      return "default";
    case "authorized":
      return "secondary";
    case "authorization_failed":
      return "secondary";
    case "overdue":
    case "failed":
      return "destructive";
    case "pending":
    case "due":
    case "refund_pending":
      return "secondary";
    default:
      return "outline";
  }
}

function typeVariant(type: string) {
  switch (type) {
    case "reimbursement":
      return "default";
    case "saas_fee":
      return "secondary";
    case "aggregated_snapshot":
      return "outline";
    default:
      return "outline";
  }
}

function lineItemLabel(item: any) {
  if (item?.item_type === "consultation") {
    const mode = String(item?.metadata?.consult_mode || "").toLowerCase();
    if (mode === "sync") return "Sync Consult";
    if (mode === "async") return "Async Consult";
  }
  return String(item?.item_type || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
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

export function B2BInvoiceList({ clientId }: B2BInvoiceListProps) {
  const [invoiceType, setInvoiceType] = useState<InvoiceType | "all">("all");
  const [status, setStatus] = useState<InvoiceStatusFilter>("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [ordering, setOrdering] = useState<InvoiceOrdering>("-issued_at");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<B2BInvoice | null>(null);
  const pageSize = 10;

  const params = useMemo(() => {
    const merged: Record<string, unknown> = {
      page,
      page_size: pageSize,
      ordering,
    };
    if (status !== "all") merged.status = status;
    if (search.trim()) merged.invoice_number = search.trim();
    if (fromDate) merged.issued_at_after = fromDate;
    if (toDate) merged.issued_at_before = toDate;
    return merged;
  }, [page, ordering, status, search, fromDate, toDate]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["b2bInvoices", clientId, invoiceType, params],
    queryFn: () =>
      clientApi.getB2BInvoices(
        clientId,
        invoiceType === "all" ? undefined : invoiceType,
        params
      ),
    enabled: !!clientId,
  });

  const invoices = useMemo(() => data?.results || [], [data?.results]);
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const displayedInvoices = useMemo(() => {
    const invoiceIds = new Set(invoices.map((inv) => inv.id));
    return invoices.filter((inv) => {
      // Collapse a supplemental row into its parent when the parent is present
      // on this page; otherwise show it standalone so nothing silently disappears.
      if (inv.is_supplemental_split_capture && inv.supplemental_parent_invoice_id) {
        return !invoiceIds.has(inv.supplemental_parent_invoice_id);
      }
      return true;
    });
  }, [invoices]);

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

  return (
    <section className="bg-card rounded-2xl border shadow-sm overflow-hidden mb-8">
      <div className="p-4 border-b space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              B2B Invoices
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Platform billing invoices</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={invoiceType}
              onValueChange={(value) => {
                setInvoiceType(value as InvoiceType | "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="reimbursement">Reimbursement</SelectItem>
                <SelectItem value="saas_fee">SaaS Fee</SelectItem>
                <SelectItem value="aggregated_snapshot">Snapshot</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm"
              placeholder="Search invoice number"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as InvoiceStatusFilter);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="authorized">Authorized</SelectItem>
              <SelectItem value="authorization_failed">Authorization Failed</SelectItem>
              <SelectItem value="due">Due</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={ordering}
            onValueChange={(value) => {
              setOrdering(value as InvoiceOrdering);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-issued_at">Newest first</SelectItem>
              <SelectItem value="issued_at">Oldest first</SelectItem>
              <SelectItem value="-total_amount">Amount high to low</SelectItem>
              <SelectItem value="total_amount">Amount low to high</SelectItem>
              <SelectItem value="status">Status A to Z</SelectItem>
            </SelectContent>
          </Select>
          <input
            type="date"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
          />
          <input
            type="date"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="p-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300">Failed to load invoices. Please try again later.</p>
          </div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="p-8 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No invoices found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Invoices will appear here once generated.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Breakdown</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedInvoices.map((invoice) => {
                  const effectiveStatus =
                    invoice.invoice_type === "credit_note" && invoice.status === "pending"
                      ? "refund_pending"
                      : (invoice as any).is_overdue && invoice.status !== "paid"
                        ? "overdue"
                        : invoice.status;
                  const hasNestedSupplementals = (invoice.supplemental_invoices || []).length > 0;
                  const supplementalTotal = invoiceSupplementalTotal(invoice);

                  return (
                    <TableRow
                      key={invoice.id}
                      className={hasNestedSupplementals ? "bg-amber-50/40 dark:bg-amber-900/10" : undefined}
                    >
                      <TableCell className="font-mono text-xs">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>
                        <Badge variant={typeVariant(invoice.invoice_type)}>
                          {invoice.invoice_type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatMoney(invoiceCombinedTotal(invoice))}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div>{formatBreakdown(invoice)}</div>
                        {hasNestedSupplementals && (
                          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                            <GitBranch className="h-3 w-3" />
                            Split Capture · +${supplementalTotal.toFixed(2)} supplemental
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(effectiveStatus)}>
                          {effectiveStatus.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(invoice.issued_at || (invoice as any).created_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(invoice.due_date)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => setSelected(invoice)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} to{" "}
                {Math.min(page * pageSize, totalCount)} of {totalCount} invoices
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {selected && createPortal(
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl border shadow-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Invoice {selected.invoice_number}</h3>
                <p className="text-xs text-muted-foreground">{selected.invoice_type.replace("_", " ")} · {selected.status}</p>
              </div>
              <Button size="sm" variant="outline" type="button" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>

            {(selected.supplemental_invoices || []).length > 0 && (
              <div className="mx-4 mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-900/20">
                <div className="flex items-center gap-2 font-medium text-amber-900 dark:text-amber-200">
                  <GitBranch className="h-3.5 w-3.5" />
                  Split Capture · {(selected.supplemental_invoices || []).length} supplemental invoice
                  {(selected.supplemental_invoices || []).length > 1 ? "s" : ""}
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="rounded-md border border-amber-200 bg-white px-2 py-1.5 dark:border-amber-700 dark:bg-slate-900">
                    <div className="text-[11px] text-amber-700 dark:text-amber-300">Base invoice</div>
                    <div className="font-semibold text-amber-900 dark:text-amber-200">
                      {selected.invoice_number}: {formatMoney(invoiceAmount(selected))}
                    </div>
                  </div>
                  <div className="rounded-md border border-amber-200 bg-white px-2 py-1.5 dark:border-amber-700 dark:bg-slate-900">
                    <div className="text-[11px] text-amber-700 dark:text-amber-300">Supplemental total</div>
                    <div className="font-semibold text-amber-900 dark:text-amber-200">
                      {formatMoney(invoiceSupplementalTotal(selected))}
                    </div>
                  </div>
                  <div className="rounded-md border border-amber-200 bg-white px-2 py-1.5 dark:border-amber-700 dark:bg-slate-900">
                    <div className="text-[11px] text-amber-700 dark:text-amber-300">Combined settlement</div>
                    <div className="font-semibold text-amber-900 dark:text-amber-200">
                      {formatMoney(invoiceCombinedTotal(selected))}
                    </div>
                  </div>
                </div>
                <div className="mt-2 overflow-x-auto rounded-md border border-amber-200 bg-white dark:border-amber-700 dark:bg-slate-900">
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
                      {(selected.supplemental_invoices || []).map((child) => (
                        <tr key={child.id} className="border-t border-amber-100 dark:border-amber-800/60">
                          <td className="px-2 py-1 font-medium">{child.invoice_number}</td>
                          <td className="px-2 py-1">{child.status}</td>
                          <td className="px-2 py-1">{formatDate(child.issued_at || child.created_at)}</td>
                          <td className="px-2 py-1 text-right">{formatMoney(child.total_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selected.invoice_type === "credit_note" && (
              <div className="mx-4 mt-4 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm dark:border-orange-800 dark:bg-orange-900/20">
                <div className="text-xs font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-300">
                  Refund reason
                </div>
                <div className="mt-1 font-medium text-orange-900 dark:text-orange-200">
                  {(selected.refund_required_reason || "Rx Revision Over Reimbursed").replace(/_/g, " ")}
                </div>
              </div>
            )}

            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-md border p-3">
                <div className="text-muted-foreground text-xs">Total Amount</div>
                <div className="font-semibold">{formatMoney(selected.total_amount)}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-muted-foreground text-xs">Issued Date</div>
                <div className="font-semibold">{formatDate(selected.issued_at || (selected as any).created_at)}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-muted-foreground text-xs">
                  {selected.invoice_type === "saas_fee" ? "Usage Billing Period" : "Billing Period"}
                </div>
                <div className="font-semibold">
                  {formatDate(selected.billing_period_start)} to {formatDate(selected.billing_period_end)}
                </div>
              </div>
              {selected.invoice_type === "saas_fee" && getAccessPeriodFromInvoice(selected) && (
                <div className="rounded-md border p-3">
                  <div className="text-muted-foreground text-xs">Renewal Access Period</div>
                  <div className="font-semibold">{getAccessPeriodFromInvoice(selected)}</div>
                </div>
              )}
              {selected.invoice_type === "reimbursement" && selected.adjustment_summary && (
                <>
                  {Number(selected.adjustment_summary.supplemental_charges || 0) > 0 && (
                    <div className="rounded-md border p-3">
                      <div className="text-muted-foreground text-xs">Supplemental Charges</div>
                      <div className="font-semibold text-red-600">
                        +{formatMoney(selected.adjustment_summary.supplemental_charges)}
                      </div>
                    </div>
                  )}
                  {Number(selected.adjustment_summary.credit_notes || 0) > 0 && (
                    <div className="rounded-md border p-3">
                      <div className="text-muted-foreground text-xs">Credit Notes</div>
                      <div className="font-semibold text-emerald-600">
                        −{formatMoney(selected.adjustment_summary.credit_notes)}
                      </div>
                    </div>
                  )}
                  <div className="rounded-md border p-3">
                    <div className="text-muted-foreground text-xs">Adjusted Total</div>
                    <div className="font-semibold">{formatMoney(selected.adjustment_summary.adjusted_total)}</div>
                  </div>
                </>
              )}
              {selected.invoice_type === "reimbursement" && (
                <>
                  <div className="rounded-md border p-3">
                    <div className="text-muted-foreground text-xs">Intended Auth Amount</div>
                    <div className="font-semibold">{(selected as any).intended_authorization_amount || "-"}</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-muted-foreground text-xs">Auth Retry Count</div>
                    <div className="font-semibold">{(selected as any).authorization_retry_count ?? "-"}</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-muted-foreground text-xs">Next Auth Retry</div>
                    <div className="font-semibold">
                      {(selected as any).authorization_next_retry_at
                        ? formatDate((selected as any).authorization_next_retry_at)
                        : "-"}
                    </div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-muted-foreground text-xs">Retry Exhausted At</div>
                    <div className="font-semibold">
                      {(selected as any).authorization_retry_exhausted_at
                        ? formatDate((selected as any).authorization_retry_exhausted_at)
                        : "-"}
                    </div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-muted-foreground text-xs">Auth Error Code</div>
                    <div className="font-semibold">{(selected as any).authorization_last_error_code || "-"}</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-muted-foreground text-xs">Auth Error Message</div>
                    <div className="font-semibold">{(selected as any).authorization_last_error_message || "-"}</div>
                  </div>
                </>
              )}
            </div>

            {selected.treatment_prescription && (
              <div className="px-4 pb-4">
                <TreatmentPrescriptionInvoiceSets contract={selected.treatment_prescription} />
              </div>
            )}

            {!selected.treatment_prescription && (selected.revision_adjustments || []).length > 0 && (
              <div className="px-4 pb-4">
                <h4 className="font-semibold mb-2">Revision History</h4>
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="text-left px-3 py-2">Revision</th>
                        <th className="text-left px-3 py-2">Product</th>
                        <th className="text-left px-3 py-2">Kind</th>
                        <th className="text-left px-3 py-2">Status</th>
                        <th className="text-right px-3 py-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selected.revision_adjustments || []).map((adjustment) => {
                        const isCredit = adjustment.kind === "credit_note";
                        return (
                          <tr key={adjustment.id} className="border-t">
                            <td className="px-3 py-2">{adjustment.revision_number ?? "-"}</td>
                            <td className="px-3 py-2">{adjustment.product_name || "-"}</td>
                            <td className="px-3 py-2">{adjustment.kind.replace(/_/g, " ")}</td>
                            <td className="px-3 py-2">{adjustment.status}</td>
                            <td className={`px-3 py-2 text-right font-medium ${isCredit ? "text-emerald-600" : "text-red-600"}`}>
                              {isCredit ? "−" : "+"}{formatMoney(adjustment.adjustment_amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="px-4 pb-4">
              <h4 className="font-semibold mb-2">Line Items</h4>
              {(selected.line_items || []).length === 0 ? (
                <div className="rounded-md border p-3 text-sm text-muted-foreground">
                  No line items available for this invoice.
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
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
                      {(selected.line_items || []).map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="px-3 py-2">{lineItemLabel(item)}</td>
                          <td className="px-3 py-2 font-mono text-xs">
                            {(item as any).client_order_number || (item as any).order_display_id || (selected as any).client_order_number || selected.source_tenant_order_display_id || "-"}
                          </td>
                          <td className="px-3 py-2">{item.description || "-"}</td>
                          <td className="px-3 py-2 text-right">{item.quantity || 0}</td>
                          <td className="px-3 py-2 text-right">{formatMoney(item.unit_price)}</td>
                          <td className="px-3 py-2 text-right font-medium">{formatMoney(item.total_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
