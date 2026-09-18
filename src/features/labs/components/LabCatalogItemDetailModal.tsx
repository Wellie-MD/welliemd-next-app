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
      <DialogContent className="w-[calc(100vw-24px)] max-w-4xl gap-0 overflow-hidden border-sky-100 p-0">
        <div className="border-b border-sky-100 bg-gradient-to-r from-sky-50 via-white to-teal-50 px-6 pb-4 pt-5">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold leading-none tracking-tight text-slate-900">
              Test Details
            </DialogTitle>
            <DialogDescription className="mt-2 text-xs text-slate-600">
              Reference-catalog item from Junction's marker/test catalog.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="max-h-[80vh] space-y-6 overflow-y-auto bg-white px-6 py-5 text-sm">
          {loading ? (
            <div className="text-sm text-slate-500">Loading test details…</div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Detail label="Name" value={detail?.name || item.name} />
                <Detail label="Test code / Provider ID" value={detail?.provider_id || item.provider_id || "—"} mono />
                <Detail label="Type" value={detail?.item_type || item.item_type || "—"} />
                <Detail label="Price" value={detail?.price || item.price || "—"} />
                <Detail label="Vital slug" value={detail?.slug || item.slug || "—"} mono />
                <Detail label="Marker count" value={String(detail?.markers?.length || item.marker_count || 0)} />
                <Detail label="Common turnaround time" value={tatLabel(detail?.common_tat_days ?? item.common_tat_days)} />
                <Detail label="Worst-case turnaround time" value={tatLabel(detail?.worst_case_tat_days ?? item.worst_case_tat_days)} />
              </div>

              <div className="overflow-hidden rounded-xl border border-sky-100 shadow-sm">
                <div className="border-b border-sky-100 bg-sky-50/80 px-4 py-3">
                  <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-sky-800">
                    <span className="h-4 w-1 rounded-full bg-sky-600" />
                    LOINC Map
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead className="bg-white">
                      <tr className="border-b border-sky-100">
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-sky-800">Name</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-sky-800">Test code</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-sky-800">Slug</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-sky-800">Required</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-sky-800">LOINC</th>
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
                          <tr key={`${row.test_code}-${index}`} className="border-b border-sky-50 odd:bg-white even:bg-slate-50/40 last:border-b-0 hover:bg-sky-50/50">
                            <td className="px-4 py-3 font-medium text-slate-900">{row.name || "—"}</td>
                            <td className="px-4 py-3 font-mono text-teal-700">{row.test_code || "—"}</td>
                            <td className="px-4 py-3 text-slate-600 break-words">{row.slug || "—"}</td>
                            <td className="px-4 py-3 text-slate-700">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${row.required ? "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200" : "bg-slate-100 text-slate-500"}`}>
                                {row.required ? "Yes" : "No"}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-teal-700">{row.loinc || "—"}</td>
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
    <div className="rounded-lg border border-sky-100 bg-sky-50/40 p-3 space-y-1">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sky-800">{label}</p>
      <p className={mono ? "break-all font-mono text-slate-900" : "text-slate-900"}>{value || "—"}</p>
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
    <div className="space-y-3 rounded-xl border border-teal-100 bg-teal-50/30 p-4">
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-teal-800"><span className="h-4 w-1 rounded-full bg-teal-600" />{title}</p>
      {rows.map((row) => (
        <div key={row.label} className="flex items-start justify-between gap-4 text-sm">
          <span className="text-slate-500">{row.label}</span>
          <span className="text-right font-medium text-slate-900">{row.value || "—"}</span>
        </div>
      ))}
    </div>
  );
}
