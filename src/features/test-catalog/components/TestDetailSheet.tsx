import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

function Copyable({
  value,
  mono = false,
  truncateWidth,
}: {
  value: string;
  mono?: boolean;
  truncateWidth?: string;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const textStyle = truncateWidth ? { maxWidth: truncateWidth } : undefined;
  const textClassName = truncateWidth ? "truncate block" : "";

  return (
    <span className="inline-flex items-center gap-1.5 max-w-full">
      <span
        style={textStyle}
        className={`${mono ? "font-mono" : "font-medium"} text-[#2D3748] break-all ${textClassName}`}
      >
        {value}
      </span>
      {value && value !== "—" && value !== "N/A" && (
        <button
          type="button"
          onClick={handleCopy}
          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all shrink-0"
          title="Copy to clipboard"
        >
          {copied ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-600">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      )}
    </span>
  );
}

export default function TestDetailSheet({
  item,
  open,
  onOpenChange,
  loadDetail,
}: Props) {
  const [detail, setDetail] = useState<CatalogItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!open || !item) {
      setIsExpanded(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    setDetail(null);
    loadDetail(item.id)
      .then((result) => {
        if (!cancelled) setDetail(result);
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(err?.response?.data?.detail || "Failed to load test details.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, item, loadDetail]);

  const rows = detail?.expected_results ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={`w-[calc(100vw-24px)] p-0 gap-0 overflow-hidden flex flex-col border-l border-slate-200 transition-all duration-300 ${
          isExpanded
            ? "sm:max-w-[85vw] md:max-w-[80vw] lg:max-w-[70vw] xl:max-w-[60vw]"
            : "sm:max-w-[640px] md:max-w-[720px]"
        }`}
      >
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="absolute right-12 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-200 z-50"
          title={isExpanded ? "Minimize panel" : "Maximize panel"}
        >
          {isExpanded ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 14h6v-6M20 10h-6v6M14 10l7-7M10 14l-7 7" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          )}
        </button>

        <div className="flex shrink-0 items-center justify-between border-b border-sky-100 bg-gradient-to-r from-sky-50 to-white px-6 py-5">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold tracking-tight text-slate-900">
              Test Details
            </SheetTitle>
          </SheetHeader>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto bg-white px-6 py-6 text-sm">
          {loading ? (
            <div className="text-sm text-slate-500 py-4">Loading test details…</div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : (
            <>
              {/* Metadata Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <MetaField label="Name" value={detail?.name || item?.name || "—"} />
                <MetaField
                  label="Test Code / Provider ID"
                  value={detail?.provider_id || item?.provider_id || "—"}
                  copyable
                />
                <MetaField label="Type" value={detail?.item_type || item?.item_type || "—"} />
                <MetaField label="Price" value={detail?.price || item?.price || "—"} />
                <MetaField
                  label="Vital Slug"
                  value={detail?.slug || item?.slug || "—"}
                  copyable
                />
                <MetaField
                  label="Marker ID"
                  value={
                    detail?.markers?.[0]?.junction_id || detail?.markers?.[0]?.id || "—"
                  }
                  copyable
                />
                <MetaField
                  label="Common Turnaround Time"
                  value={tatLabel(detail?.common_tat_days ?? item?.common_tat_days)}
                />
                <MetaField
                  label="Worst-case Turnaround Time"
                  value={tatLabel(detail?.worst_case_tat_days ?? item?.worst_case_tat_days)}
                />
              </div>

              <hr className="border-sky-100" />

              {/* LOINC Map Section */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-bold text-base text-sky-900"><span className="h-5 w-1 rounded-full bg-sky-600" />LOINC Map</h3>
                <div className="overflow-hidden rounded-xl border border-sky-100 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm table-fixed min-w-[600px]">
                      <colgroup>
                        <col className="w-[32%]" />
                        <col className="w-[15%]" />
                        <col className="w-[28%]" />
                        <col className="w-[12%]" />
                        <col className="w-[13%]" />
                      </colgroup>
                      <thead className="bg-sky-50/80">
                        <tr className="border-b border-sky-100">
                          <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-sky-800">Name</th>
                          <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-sky-800">Test Code</th>
                          <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-sky-800">Slug</th>
                          <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-sky-800">
                            <span className="inline-flex items-center gap-1 whitespace-nowrap">
                              Required
                              <span className="text-slate-400 text-[10px] cursor-help font-normal" title="Whether this marker is required when ordering this panel">
                                ⓘ
                              </span>
                            </span>
                          </th>
                          <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-sky-800">LOINC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sky-50 bg-white">
                        {rows.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-500 italic">
                              No LOINC mappings available.
                            </td>
                          </tr>
                        ) : (
                          rows.map((row, index) => (
                            <tr key={`${row.test_code}-${index}`} className="transition-colors duration-150 odd:bg-white even:bg-slate-50/40 hover:bg-sky-50/50">
                              <td className="px-3 py-3 font-medium text-slate-800 break-words">{row.name || "—"}</td>
                              <td className="px-3 py-3 text-slate-700 whitespace-nowrap">
                                <Copyable value={row.test_code || "—"} mono />
                              </td>
                              <td className="px-3 py-3 text-slate-600">
                                <Copyable value={row.slug || "—"} truncateWidth="130px" />
                              </td>
                              <td className="px-3 py-3 text-slate-700 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${row.required ? "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200" : "bg-slate-100 text-slate-500"}`}>
                                  {row.required ? "Yes" : "No"}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-slate-700 whitespace-nowrap">
                                <Copyable value={row.loinc || "—"} truncateWidth="80px" />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MetaField({
  label,
  value,
  copyable = false,
}: {
  label: string;
  value: string;
  copyable?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      {copyable ? (
        <Copyable value={value} mono={label === "Test Code / Provider ID"} />
      ) : (
        <p className="font-semibold text-[#2D3748] break-words">
          {value || "—"}
        </p>
      )}
    </div>
  );
}
