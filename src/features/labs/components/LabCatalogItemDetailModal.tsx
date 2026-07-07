import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CatalogItem, CatalogItemDetail } from "@/api/labs";

interface Props {
  item: CatalogItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadDetail: (id: string) => Promise<CatalogItemDetail>;
}

function tatLabel(value?: number | null) {
  if (value == null) return "N/A";
  return `${value} day${value === 1 ? "" : "s"}`;
}

export default function LabCatalogItemDetailModal({
  item,
  open,
  onOpenChange,
  loadDetail,
}: Props) {
  const [detail, setDetail] = useState<CatalogItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !item) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    loadDetail(item.id)
      .then((result) => {
        if (!cancelled) setDetail(result);
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(err?.response?.data?.detail || "Failed to load test details.");
          setDetail(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, item, loadDetail]);

  if (!item) return null;

  const rows = detail?.expected_results ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-24px)] max-w-4xl p-0 gap-0 overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="text-[30px] leading-none font-bold tracking-tight text-slate-900">
              Test Details
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Reference-catalog item from Junction's marker/test catalog.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto space-y-6 text-sm">
          {loading ? (
            <div className="text-sm text-slate-500">Loading test details…</div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Detail label="Name" value={detail?.name || item.name} />
                <Detail label="Test code / Provider ID" value={detail?.provider_id || item.provider_id || "—"} mono />
                <Detail label="Type" value={detail?.item_type || item.item_type || "—"} />
                <Detail label="Price" value={detail?.price || item.price || "—"} />
                <Detail label="Vital slug" value={detail?.slug || item.slug || "—"} mono />
                <Detail label="Marker count" value={String(detail?.markers?.length || item.marker_count || 0)} />
                <Detail label="Common turnaround time" value={tatLabel(detail?.common_tat_days ?? item.common_tat_days)} />
                <Detail label="Worst-case turnaround time" value={tatLabel(detail?.worst_case_tat_days ?? item.worst_case_tat_days)} />
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b bg-slate-50/80">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    LOINC Map
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead className="bg-white">
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Name</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Test code</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Slug</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Required</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">LOINC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                            No expected result rows available.
                          </td>
                        </tr>
                      ) : (
                        rows.map((row, index) => (
                          <tr key={`${row.test_code}-${index}`} className="border-b border-slate-100 last:border-b-0">
                            <td className="px-4 py-3 font-medium text-slate-900">{row.name || "—"}</td>
                            <td className="px-4 py-3 font-mono text-emerald-700">{row.test_code || "—"}</td>
                            <td className="px-4 py-3 text-slate-600 break-words">{row.slug || "—"}</td>
                            <td className="px-4 py-3 text-slate-700">{row.required ? "Yes" : "No"}</td>
                            <td className="px-4 py-3 font-mono text-emerald-700">{row.loinc || "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoBlock
                  title="Lab"
                  rows={[
                    { label: "Provider", value: detail?.lab?.name || item.lab_name || "—" },
                    { label: "Sample type", value: detail?.sample_type || "—" },
                    { label: "Collection", value: detail?.collection_method || "—" },
                    { label: "Fasting", value: detail?.fasting ? "Yes" : "No" },
                  ]}
                />
                <InfoBlock
                  title="Order questions"
                  rows={[
                    { label: "Required", value: String(detail?.aoe_summary?.required ?? 0) },
                    { label: "Optional", value: String(detail?.aoe_summary?.optional ?? 0) },
                    { label: "Orderable", value: detail?.is_orderable_summary ? "Yes" : "No" },
                    { label: "Markers", value: String(detail?.markers?.length ?? item.marker_count ?? 0) },
                  ]}
                />
              </div>
            </>
          )}

          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={mono ? "font-mono text-slate-900 break-all" : "text-slate-900"}>{value || "—"}</p>
    </div>
  );
}

function InfoBlock({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 space-y-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{title}</p>
      {rows.map((row) => (
        <div key={row.label} className="flex items-start justify-between gap-4 text-sm">
          <span className="text-slate-500">{row.label}</span>
          <span className="text-right font-medium text-slate-900">{row.value || "—"}</span>
        </div>
      ))}
    </div>
  );
}
