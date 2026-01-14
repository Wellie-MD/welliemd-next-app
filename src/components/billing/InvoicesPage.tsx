import { useEffect, useMemo, useState } from "react";
import billingService, { Invoice, InvoiceListResponse } from "@/services/billingService";
import mockData from "@/data/mockData.json";
import { Link } from "react-router-dom";
import { Search, Calendar } from "lucide-react";

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<
    "all" | "reimbursement" | "saas"
  >("all");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("");
  const [ordering, setOrdering] = useState("-issued_at");
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const groupedInvoices = useMemo(() => {
    const buckets = new Map<string, { invoice: Invoice; line_items: any[]; total_amount: number }>();
    for (const inv of invoices) {
      const periodStart = (inv as any).billing_period_start || "";
      const periodEnd = (inv as any).billing_period_end || "";
      const key = `${inv.invoice_type}|${periodStart}|${periodEnd}`;
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
    })) as Invoice[];
  }, [invoices]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const params: Record<string, unknown> = { ordering };
      if (search.trim()) params.invoice_number = search.trim();
      if (fromDate) params.issued_at_after = fromDate;
      if (toDate) params.issued_at_before = toDate;
      if (status) params.status = status;
      const res: InvoiceListResponse = await billingService.getInvoices(activeTab, page, 25, params);
      if (mounted) {
        if (res && res.results && res.results.length) {
          setInvoices(res.results);
          setTotal(res.count ?? res.results.length);
          setHasNext(!!res.next);
          setHasPrev(!!res.previous);
        } else {
          // fallback to mock
          const md: any = mockData as any;
          const mockInvoices = md?.billingInvoices ?? [];
          const filtered =
            activeTab === "all"
              ? mockInvoices
              : mockInvoices.filter((i: any) => {
                  if (i.invoice_type === activeTab) return true;
                  if (activeTab === "saas" && i.invoice_type === "saas_fee") return true;
                  return false;
                });
          const filteredBySearch = search.trim()
            ? filtered.filter((i: any) =>
                `${i.invoice_number || ""}`.toLowerCase().includes(search.trim().toLowerCase())
              )
            : filtered;
          setInvoices(filteredBySearch);
          setTotal(filteredBySearch.length);
          setHasNext(false);
          setHasPrev(page > 1);
        }
      }
      setLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [activeTab, page, search, fromDate, toDate, status, ordering]);

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          className={`px-3 py-1 rounded ${activeTab === "all" ? "bg-slate-100" : ""}`}
          onClick={() => { setActiveTab("all"); setPage(1); }}
        >
          All Invoices
        </button>
        <button
          className={`px-3 py-1 rounded ${activeTab === "reimbursement" ? "bg-slate-100" : ""}`}
          onClick={() => { setActiveTab("reimbursement"); setPage(1); }}
        >
          Reimbursement Billings
        </button>
        <button
          className={`px-3 py-1 rounded ${activeTab === "saas" ? "bg-slate-100" : ""}`}
          onClick={() => { setActiveTab("saas"); setPage(1); }}
        >
          Monthly SaaS Fee Invoices
        </button>
      </div>


      <div className="bg-content-light dark:bg-content-dark p-4 rounded-lg shadow-md mb-8 border border-border-light dark:border-border-dark">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary-light dark:text-text-secondary-dark" />
            <input
              className="form-input w-full pl-10 pr-4 py-2 rounded-md border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:ring-primary focus:border-primary transition-all duration-200"
              placeholder={activeTab === "reimbursement" ? "Order Identifier" : "Invoice Number"}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="form-select w-full py-2 px-4 rounded-md border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:ring-primary focus:border-primary transition-all duration-200"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
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
            className="form-select w-full py-2 px-4 rounded-md border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:ring-primary focus:border-primary transition-all duration-200"
            value={ordering}
            onChange={(e) => { setOrdering(e.target.value); setPage(1); }}
          >
            <option value="-issued_at">Newest first</option>
            <option value="issued_at">Oldest first</option>
            <option value="-amount">Amount high → low</option>
            <option value="amount">Amount low → high</option>
          </select>
          <div className={`grid grid-cols-2 gap-2 ${activeTab === "reimbursement" ? "lg:col-span-1" : "sm:col-span-2 lg:col-span-4"}`}>
            <div className="relative">
              <input
                className="form-input w-full py-2 px-4 pr-8 rounded-md border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:ring-primary focus:border-primary transition-all duration-200"
                placeholder="mm/dd/yyyy"
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              />
            </div>
            <div className="relative">
              <input
                className="form-input w-full py-2 px-4 pr-8 rounded-md border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:ring-primary focus:border-primary transition-all duration-200"
                placeholder="mm/dd/yyyy"
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-4 pt-4 border-t border-border-light dark:border-border-dark">
          <button className="bg-primary text-white font-medium py-2 px-5 rounded-md hover:bg-opacity-90 transition-colors duration-200 shadow-sm">Search</button>
        </div>
      </div>

      <div className="bg-content-light dark:bg-content-dark p-6 rounded-lg shadow-md border border-border-light dark:border-border-dark">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark">
              <tr>
                <th className="px-6 py-3 font-semibold tracking-wider">Date</th>
                {activeTab === "reimbursement" && (
                  <th className="px-6 py-3 font-semibold tracking-wider">Order</th>
                )}
                {activeTab !== "reimbursement" && (
                  <th className="px-6 py-3 font-semibold tracking-wider">Invoice</th>
                )}
                <th className="px-6 py-3 font-semibold tracking-wider">Type</th>
                <th className="px-6 py-3 font-semibold tracking-wider">Status</th>
                <th className="px-6 py-3 font-semibold tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody>
      {groupedInvoices.length === 0 && (
        <tr className="border-b border-border-light dark:border-border-dark">
          <td className="px-6 py-4" colSpan={6}>No invoices found</td>
        </tr>
      )}
      {groupedInvoices.map((inv) => (
        <tr key={inv.id} className="border-b border-border-light dark:border-border-dark hover:bg-background-light/50 dark:hover:bg-background-dark/50 transition-colors duration-150 cursor-pointer" onClick={() => setSelected(inv)}>
          <td className="px-6 py-4">{inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '-'}</td>
                  {activeTab === "reimbursement" && (
                    <td className="px-6 py-4">
                      <Link to="/dashboard/orders" className="block">
                        <div className="font-medium text-text-primary-light dark:text-text-primary-dark hover:text-primary transition-colors">{(inv as any).source_tenant_order_display_id ?? inv.invoice_number}</div>
                        <div className="text-text-secondary-light dark:text-text-secondary-dark text-xs">{(inv as any).source_tenant_email ?? ''}</div>
                      </Link>
                    </td>
                  )}
                  {activeTab !== "reimbursement" && (
                    <td className="px-6 py-4">
                      <div className="font-medium text-text-primary-light dark:text-text-primary-dark">
                        {inv.invoice_number || "-"}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    {(inv.invoice_type || "-").replace("_", " ")}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary dark:bg-primary/20">{inv.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-text-primary-light dark:text-text-primary-dark">
                      ${( (inv as any).total_amount ?? inv.amount ?? 0 )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-md p-4 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Invoice {selected.invoice_number}</h3>
              <button onClick={() => setSelected(null)} className="text-sm px-2 py-1">Close</button>
            </div>
            <div className="space-y-2">
              <div>Total: {(selected as any).total_amount ?? selected.amount}</div>
              <div>Status: {selected.status}</div>
              <div className="mt-2">
                <h4 className="font-medium">Line Items</h4>
                <ul className="list-disc pl-5">
                  {(selected.line_items ?? []).map((li) => (
                    <li key={li.id}>
                      {li.description} — {li.quantity} × {li.unit_price} = {((li as any).total_amount ?? (li as any).subtotal) as any}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
