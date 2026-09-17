import { useDeferredValue, useState } from "react";
import { AlertTriangle, Check, CircleHelp, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LabResultRow } from "@/features/labs/types";

type ResultFilter = "all" | "normal" | "watch" | "alert";

interface Props {
  biomarkers: LabResultRow[];
  panelName: string;
  provider: string;
  orderingPhysician?: string;
  resultsAvailable: boolean;
  pdfAvailable: boolean;
  downloadingPdf: boolean;
  onDownloadPdf: () => void;
  statusLabel: string;
}

const formatDate = (value?: string | null) => value
  ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value))
  : "—";

const tone = (row: LabResultRow): ResultFilter => {
  const value = `${row.flag} ${row.interpretation}`.toLowerCase();
  if (/critical|alert/.test(value)) return "alert";
  if (/high|low|abnormal|borderline|watch/.test(value)) return "watch";
  return "normal";
};

const numericRange = (row: LabResultRow) => {
  const result = Number.parseFloat(row.result);
  const values = row.reference_range.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (!Number.isFinite(result) || (values.length === 0 && row.min_range_value === null && row.max_range_value === null)) return null;
  const min = row.min_range_value ?? values[0] ?? 0;
  const max = row.max_range_value ?? values[1] ?? values[0] ?? 0;
  if (max <= min) return null;
  const padding = (max - min) * 0.25;
  return { min, max, position: Math.max(3, Math.min(97, ((result - (min - padding)) / (max - min + padding * 2)) * 100)) };
};

function FlagBadge({ row }: { row: LabResultRow }) {
  const category = tone(row);
  const label = category === "normal" ? "Normal" : row.flag || row.interpretation || (category === "alert" ? "Alert" : "Watch");
  return <span className={cn(
    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize",
    category === "normal" && "border-emerald-200 bg-emerald-50 text-emerald-700",
    category === "watch" && "border-amber-200 bg-amber-50 text-amber-700",
    category === "alert" && "border-red-200 bg-red-50 text-red-700",
  )}>{category === "normal" ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}{label}</span>;
}

function RangeBar({ row }: { row: LabResultRow }) {
  const range = numericRange(row);
  if (range === null) return null;
  const category = tone(row);
  return (
    <div className="mt-2 w-full max-w-56">
      <div className="h-1.5 rounded-full bg-slate-200">
        <span className={cn("block h-3 w-1 -translate-y-[3px] rounded-full", category === "normal" ? "bg-emerald-600" : category === "watch" ? "bg-amber-500" : "bg-red-600")} style={{ marginLeft: `${range.position}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[8px] font-medium text-slate-400"><span>{range.min}</span><span>{range.max}</span></div>
    </div>
  );
}

export default function LabResultsTable({ biomarkers, panelName, provider, orderingPhysician, resultsAvailable, pdfAvailable, downloadingPdf, onDownloadPdf, statusLabel }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ResultFilter>("all");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const visible = biomarkers.filter((row) => {
    const matchesText = !deferredQuery || `${row.biomarker} ${row.result} ${row.flag}`.toLowerCase().includes(deferredQuery);
    return matchesText && (filter === "all" || tone(row) === filter);
  });
  const collected = biomarkers.find((row) => row.collected_at)?.collected_at;
  const reported = biomarkers.find((row) => row.reported_at)?.reported_at;

  return (
    <section className="overflow-hidden rounded-[14px] border border-slate-200 bg-white font-sans shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <header className="px-6 py-5 max-sm:px-4 max-sm:py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-800">1 panel · {biomarkers.length} biomarkers</p>
            <h3 className="mt-1 text-base font-bold leading-none text-slate-950 dark:text-white">Lab Results</h3>
            {resultsAvailable && <p className="mt-1.5 text-[10px] text-slate-500">Collected {formatDate(collected)} · Reported {formatDate(reported)} · Ordered by {orderingPhysician || "Junction Physician Network"}</p>}
          </div>
          {pdfAvailable && <Button variant="outline" size="sm" onClick={onDownloadPdf} disabled={downloadingPdf} className="h-8 gap-2 rounded-md px-3 text-[10px] font-semibold"><Download className="h-3.5 w-3.5" />{downloadingPdf ? "Downloading…" : "Download PDF"}</Button>}
        </div>
      </header>
      {biomarkers.length > 0 && <div className="flex flex-wrap items-center gap-3 border-y border-slate-200 bg-slate-50/50 px-6 py-3 max-sm:px-4 dark:border-gray-800 dark:bg-gray-950/30">
          <label className="relative min-w-56 flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search biomarkers…" className="h-9 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-[10px] outline-none focus:border-slate-500 dark:border-gray-700 dark:bg-gray-950" />
          </label>
          <div className="flex flex-wrap gap-2">{(["all", "normal", "watch", "alert"] as ResultFilter[]).map((value) => <button key={value} onClick={() => setFilter(value)} className={cn("rounded-full border px-3 py-1.5 text-[10px] font-semibold capitalize", filter === value ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900" : "border-slate-300 bg-white text-slate-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300")}>{value}</button>)}</div>
        </div>}

      {biomarkers.length === 0 ? <p className="px-5 py-7 text-sm text-slate-500">Results will appear here once the lab completes processing. Current status: <strong>{statusLabel}</strong>.</p> : <div>
        <div className="grid grid-cols-[minmax(190px,1.55fr)_minmax(180px,1fr)_minmax(110px,.65fr)_90px] gap-6 border-b border-slate-200 px-6 py-2.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-400 max-md:hidden dark:border-gray-800"><span>Biomarker</span><span>Result</span><span>Reference</span><span className="text-right">Flag</span></div>
        <div className="border-b border-slate-200 bg-slate-100/70 px-6 py-2.5 dark:border-gray-800 dark:bg-gray-950/50">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">{panelName}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">{provider}</p>
        </div>
        {visible.map((row) => <div key={`${row.biomarker}-${row.result}`} className="grid min-h-[70px] grid-cols-[minmax(190px,1.55fr)_minmax(180px,1fr)_minmax(110px,.65fr)_90px] items-center gap-6 border-b border-slate-200 px-6 py-4 last:border-0 max-md:grid-cols-2 max-md:gap-x-4 max-sm:px-4 dark:border-gray-800">
          <div><p className="text-[11px] font-semibold leading-4 text-slate-950 dark:text-white">{row.biomarker}</p>{row.interpretation && row.interpretation.toLowerCase() !== row.flag.toLowerCase() && <p className="mt-0.5 text-[9px] text-slate-400">{row.interpretation}</p>}</div>
          <div><p className={cn("text-xs font-bold", tone(row) === "normal" ? "text-slate-950 dark:text-white" : tone(row) === "watch" ? "text-amber-700" : "text-red-700", !Number.isFinite(Number.parseFloat(row.result)) && "font-medium italic")}>{row.result} {Number.isFinite(Number.parseFloat(row.result)) && <span className="text-[9px] font-medium text-slate-400">{row.units}</span>}</p><RangeBar row={row} /></div>
          <p className="text-[11px] font-medium text-slate-500 max-md:pl-0">{row.reference_range || "No range"}</p>
          <div className="text-right"><FlagBadge row={row} /></div>
        </div>)}
        {visible.length === 0 && <p className="px-5 py-8 text-center text-xs text-slate-500">No biomarkers match this filter.</p>}
      </div>}
      {biomarkers.length > 0 && <footer className="flex items-start gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-3 text-[10px] leading-4 text-slate-400 dark:border-gray-800 dark:bg-gray-950/30"><CircleHelp className="mt-0.5 h-3 w-3 shrink-0" />These results show your recorded lab values and laboratory reference ranges. Clinical interpretation should be completed by the ordering provider.</footer>}
    </section>
  );
}
