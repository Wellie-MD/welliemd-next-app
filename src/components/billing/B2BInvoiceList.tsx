import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, AlertCircle, Filter, Search, Eye, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
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
      return "secondary";
    default:
      return "outline";
  }
}

function typeVariant(type: string) {
  switch (type) {
    case "reimbursement":
      return "default";
    case "credit_note":
      return "destructive";
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
  const queryClient = useQueryClient();
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

  const invoices = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const markRefundMutation = useMutation({
    mutationFn: (invoiceId: string) => clientApi.markB2BRefundProcessed(clientId, invoiceId),
    onSuccess: () => {
      toast.success("Refund marked processed");
      queryClient.invalidateQueries({ queryKey: ["b2bInvoices", clientId] });
      queryClient.invalidateQueries({ queryKey: ["b2bAllInvoices"] });
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

  const formatBreakdown = (inv: any) => {
    if (inv.invoice_type === "credit_note") {
      return `Credit: ${formatMoney(inv.refund_required_amount || inv.total_amount)}`;
    }
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
                <SelectItem value="credit_note">Credit Note</SelectItem>
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
                {invoices.map((invoice) => {
                  const effectiveStatus =
                    (invoice as any).is_overdue && invoice.status !== "paid"
                      ? "overdue"
                      : invoice.status;

                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-xs">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>
                        <Badge variant={typeVariant(invoice.invoice_type)}>
                          {invoice.invoice_type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatMoney(invoice.total_amount)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatBreakdown(invoice)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <Badge variant={statusVariant(effectiveStatus)}>
                            {effectiveStatus}
                          </Badge>
                          {(invoice as any).refund_required && (
                            <Badge variant="destructive">Refund required</Badge>
                          )}
                        </div>
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

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl border shadow-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Invoice {selected.invoice_number}</h3>
                <p className="text-xs text-muted-foreground">{selected.invoice_type.replace("_", " ")} · {selected.status}</p>
              </div>
              <div className="flex items-center gap-2">
                {(selected as any).refund_required && selected.invoice_type === "credit_note" && (
                  <Button
                    size="sm"
                    type="button"
                    onClick={() => markRefundMutation.mutate(selected.id)}
                    disabled={markRefundMutation.isPending}
                  >
                    {markRefundMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                    )}
                    Mark Refund Processed
                  </Button>
                )}
                <Button size="sm" variant="outline" type="button" onClick={() => setSelected(null)}>
                  Close
                </Button>
              </div>
            </div>

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
              {(selected as any).refund_required && (
                <>
                  <div className="rounded-md border border-red-200 bg-red-50 p-3">
                    <div className="text-red-700 text-xs">Refund Required</div>
                    <div className="font-semibold text-red-800">
                      {formatMoney((selected as any).refund_required_amount || selected.total_amount)}
                    </div>
                  </div>
                  <div className="rounded-md border border-red-200 bg-red-50 p-3">
                    <div className="text-red-700 text-xs">Refund Reason</div>
                    <div className="font-semibold text-red-800">
                      {String((selected as any).refund_required_reason || "rx_revision_over_reimbursed").replace(/_/g, " ")}
                    </div>
                  </div>
                </>
              )}
              {selected.invoice_type === "saas_fee" && getAccessPeriodFromInvoice(selected) && (
                <div className="rounded-md border p-3">
                  <div className="text-muted-foreground text-xs">Renewal Access Period</div>
                  <div className="font-semibold">{getAccessPeriodFromInvoice(selected)}</div>
                </div>
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
        </div>
      )}
    </section>
  );
}
