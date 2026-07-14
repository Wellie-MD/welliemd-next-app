/**
 * LabResultsTable — biomarker results table + Download PDF button.
 * Extracted from LabOrderDetail to stay under 600 lines.
 */
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LabResultRow } from "@/features/labs/types";

interface Props {
  biomarkers: LabResultRow[];
  resultsReleased: boolean;
  downloadingPdf: boolean;
  onDownloadPdf: () => void;
  statusLabel: string;
}

export default function LabResultsTable({ biomarkers, resultsReleased, downloadingPdf, onDownloadPdf, statusLabel }: Props) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Lab Results</h3>
        {biomarkers.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDownloadPdf}
            disabled={downloadingPdf || !resultsReleased}
            className="h-7 gap-2 border border-gray-200 px-2 text-[10px] text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-850"
          >
            <FileText className="h-3.5 w-3.5 text-gray-400" />
            {downloadingPdf ? "Downloading…" : "Download PDF"}
          </Button>
        )}
      </div>

      <div className="overflow-x-auto -mx-6">
        <table className="w-full text-left text-sm border-t border-b border-gray-100 dark:border-gray-800/60">
          <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 dark:text-gray-550 font-bold text-[11px] uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">Biomarker</th>
              <th className="px-6 py-3 text-right">Result</th>
              <th className="px-6 py-3">Units</th>
              <th className="px-6 py-3">Reference</th>
              <th className="px-6 py-3 text-right">Flag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
            {biomarkers.length > 0 ? (
              biomarkers.map((row, i) => {
                const isHigh = row.flag?.toLowerCase() === "high";
                const isLow = row.flag?.toLowerCase() === "low";
                const isNormal = !row.flag || /normal|within range/i.test(row.flag);
                return (
                  <tr key={i} className="hover:bg-gray-50/30 dark:hover:bg-gray-850/30">
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{row.biomarker}</td>
                    <td className={cn("px-6 py-4 text-right font-bold",
                      isHigh ? "text-red-500 dark:text-red-400" : isLow ? "text-blue-500 dark:text-blue-400" : isNormal ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white"
                    )}>{row.result}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-450 text-xs">{row.units}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-450 text-xs">{row.reference_range}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border",
                        isHigh ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/45"
                          : isLow ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/45"
                          : isNormal ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/45"
                          : "bg-gray-50 text-gray-600 border-gray-200/60 dark:bg-gray-850 dark:text-gray-400 dark:border-gray-800"
                      )}>{row.flag || "Normal"}</span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-xs text-slate-400">
                  Results will appear here once the lab completes processing. Current status: <strong className="font-semibold text-slate-600 dark:text-gray-300">{statusLabel}</strong>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
