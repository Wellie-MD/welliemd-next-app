import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { clientApi } from "@/api/clientApi";
import type { B2BInvoice } from "@/types/b2bBilling";
import { Search } from "lucide-react";

export default function Billing() {
  const [invoiceType, setInvoiceType] = useState<
    "all" | "reimbursement" | "saas_fee"
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
    if (search.trim()) params.invoice_number = search.trim();
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

  const formatBreakdown = (inv: B2BInvoice) => {
    const items = (inv as any).line_items ?? [];
    const pharmacy = items
      .filter((li: any) => li.item_type === "medication_reimbursement")
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
    const buckets = new Map<string, { invoice: B2BInvoice; line_items: any[]; total_amount: number }>();
    for (const inv of invoices) {
      const periodStart = (inv as any).billing_period_start || "";
      const periodEnd = (inv as any).billing_period_end || "";
      const key = `${(inv as any).client_id || (inv as any).client?.id || ""}|${inv.invoice_type}|${periodStart}|${periodEnd}`;
      const amount = parseFloat((inv as any).total_amount ?? inv.amount ?? "0");
      if (!buckets.has(key)) {
        buckets.set(key, {
          invoice: inv,
          line_items: [...(inv.line_items ?? [])],
          total_amount: amount,
        });
      } else {
        const bucket = buckets.get(key)!;
        bucket.total_amount += amount;
        bucket.line_items.push(...(inv.line_items ?? []));
      }
    }
    return Array.from(buckets.values()).map((b) => ({
      ...b.invoice,
      line_items: b.line_items,
      total_amount: b.total_amount.toFixed(2),
    })) as B2BInvoice[];
  }, [invoices]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invoices</h1>
      </div>

      <div className="flex items-center gap-3">
          {[
            { key: "all", label: "All Invoices" },
            { key: "reimbursement", label: "Reimbursement Billings" },
            { key: "saas_fee", label: "Monthly SaaS Fee Invoices" },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`px-3 py-1 rounded text-sm ${
                invoiceType === tab.key ? "bg-muted" : "hover:bg-muted/50"
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
                placeholder="Search invoice number"
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
              <option value="-amount">Amount high → low</option>
              <option value="amount">Amount low → high</option>
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
                    <th className="px-6 py-3 font-semibold tracking-wider">Client</th>
                    <th className="px-6 py-3 font-semibold tracking-wider">Type</th>
                    <th className="px-6 py-3 font-semibold tracking-wider">Breakdown</th>
                    <th className="px-6 py-3 font-semibold tracking-wider">Status</th>
                    <th className="px-6 py-3 font-semibold tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedInvoices.map((inv) => {
                    const amount = parseFloat(
                      (inv as any).total_amount ?? inv.amount ?? "0"
                    ).toFixed(2);
                    const status = (inv.status || "-").toString();
                    return (
                      <tr
                        key={inv.id}
                        className="border-b hover:bg-muted/10 transition-colors"
                        onClick={() => setSelected(inv)}
                        role="button"
                      >
                        <td className="px-6 py-4">
                          {inv.issued_at
                            ? new Date(inv.issued_at).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {inv.invoice_number}
                        </td>
                        <td className="px-6 py-4">
                          {(inv as any).client_name || (inv as any).client?.name || "-"}
                        </td>
                        <td className="px-6 py-4">
                          {inv.invoice_type?.replace("_", " ")}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {formatBreakdown(inv)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium">${amount}</div>
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-md p-4 w-full max-w-3xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Invoice {selected.invoice_number}</h3>
              <button onClick={() => setSelected(null)} className="text-sm px-2 py-1">
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><strong>Client:</strong> {(selected as any).client_name || "-"}</div>
              <div><strong>Type:</strong> {selected.invoice_type?.replace("_", " ")}</div>
              <div><strong>Status:</strong> {selected.status}</div>
              <div><strong>Total:</strong> ${(selected as any).total_amount ?? selected.amount}</div>
              <div><strong>Issued:</strong> {selected.issued_at ? new Date(selected.issued_at).toLocaleDateString() : "-"}</div>
            </div>
            <div className="mt-4">
              <h4 className="font-medium mb-2">Line Items</h4>
              <ul className="list-disc pl-5 text-sm">
                {(selected.line_items ?? []).map((li) => (
                  <li key={li.id}>
                    {li.description} — {li.quantity} × {li.unit_price} = {(li as any).total_amount}
                  </li>
                ))}
                {(selected.line_items ?? []).length === 0 && <li>No line items</li>}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
