import { useEffect, useState } from "react";
import billingService, { Invoice, InvoiceListResponse } from "@/services/billingService";
import mockData from "@/data/mockData.json";
import { Link } from "react-router-dom";
import { Search, Calendar } from "lucide-react";

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<"reimbursement" | "saas">("reimbursement");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Invoice | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const res: InvoiceListResponse = await billingService.getInvoices(activeTab, page, 25);
      if (mounted) {
        if (res && res.results && res.results.length) {
          setInvoices(res.results);
          setTotal(res.count ?? res.results.length);
        } else {
          // fallback to mock
          const md: any = mockData as any;
          const mockInvoices = md?.billingInvoices ?? [];
          const filtered = mockInvoices.filter((i: any) => i.invoice_type === activeTab || activeTab === "reimbursement");
          setInvoices(filtered);
          setTotal(filtered.length);
        }
      }
      setLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [activeTab, page]);

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
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
          {activeTab === "reimbursement" && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary-light dark:text-text-secondary-dark" />
                <input
                  className="form-input w-full pl-10 pr-4 py-2 rounded-md border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:ring-primary focus:border-primary transition-all duration-200"
                  placeholder="Order Identifier"
                />
              </div>
              <select className="form-select w-full py-2 px-4 rounded-md border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:ring-primary focus:border-primary transition-all duration-200">
                <option>All Statuses</option>
              </select>
              <select className="form-select w-full py-2 px-4 rounded-md border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:ring-primary focus:border-primary transition-all duration-200">
                <option>All Pharmacies</option>
              </select>
            </>
          )}
          <div className={`grid grid-cols-2 gap-2 ${activeTab === "reimbursement" ? "lg:col-span-1" : "sm:col-span-2 lg:col-span-4"}`}>
            <div className="relative">
              <input className="form-input w-full py-2 px-4 pr-8 rounded-md border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:ring-primary focus:border-primary transition-all duration-200" placeholder="mm/dd/yyyy" type="date"/>
            </div>
            <div className="relative">
              <input className="form-input w-full py-2 px-4 pr-8 rounded-md border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:ring-primary focus:border-primary transition-all duration-200" placeholder="mm/dd/yyyy" type="date"/>
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
                {activeTab === "reimbursement" && <th className="px-6 py-3 font-semibold tracking-wider">Order</th>}
                <th className="px-6 py-3 font-semibold tracking-wider">Status</th>
                <th className="px-6 py-3 font-semibold tracking-wider">Reimbursement Amount</th>
                <th className="px-6 py-3 font-semibold tracking-wider">Paid</th>
                <th className="px-6 py-3 font-semibold tracking-wider">Product</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 && (
                <tr className="border-b border-border-light dark:border-border-dark">
                  <td className="px-6 py-4" colSpan={activeTab === "reimbursement" ? 6 : 5}>No invoices found</td>
                </tr>
              )}
              {invoices.map((inv) => (
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
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary dark:bg-primary/20">{inv.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-text-primary-light dark:text-text-primary-dark">Total: ${( (inv as any).total_amount ?? inv.amount )}</div>
                    <div className="text-text-secondary-light dark:text-text-secondary-dark text-xs">{(inv.line_items ?? []).length > 0 ? `Product: ${(inv.line_items ?? [])[0].description}` : ''}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">{inv.status === 'paid' ? 'Paid' : inv.status}</span>
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate text-text-secondary-light dark:text-text-secondary-dark">{(inv.line_items ?? []).map(li=> li.description).join(' | ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
