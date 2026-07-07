/**
 * LabResultsTable — biomarker results table + Download PDF button.
 * Extracted from LabOrderDetail to stay under 600 lines.
 */
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BiomarkerRow {
  biomarker: string;
  result: string;
  units: string;
  reference_range: string;
  flag: string;
}

interface Props {
  biomarkers: BiomarkerRow[];
  resultsReleased: boolean;
  downloadingPdf: boolean;
  onDownloadPdf: () => void;
}

export default function LabResultsTable({ biomarkers, resultsReleased, downloadingPdf, onDownloadPdf }: Props) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Lab Results</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onDownloadPdf}
          disabled={downloadingPdf || !resultsReleased}
          className="gap-2 text-xs border border-gray-200 hover:bg-gray-50 text-gray-700 dark:text-gray-300 dark:border-gray-800 dark:hover:bg-gray-850"
        >
          <FileText className="h-4 w-4 text-gray-400" />
          {downloadingPdf ? "Downloading…" : "Download PDF"}
        </Button>
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
                return (
                  <tr key={i} className="hover:bg-gray-50/30 dark:hover:bg-gray-850/30">
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{row.biomarker}</td>
                    <td className={cn("px-6 py-4 text-right font-bold",
                      isHigh ? "text-red-500 dark:text-red-400" : isLow ? "text-blue-500 dark:text-blue-400" : "text-gray-900 dark:text-white"
                    )}>{row.result}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-450 text-xs">{row.units}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-450 text-xs">{row.reference_range}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border",
                        isHigh ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/45"
                          : isLow ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/45"
                          : "bg-gray-50 text-gray-600 border-gray-200/60 dark:bg-gray-850 dark:text-gray-400 dark:border-gray-800"
                      )}>{row.flag || "Normal"}</span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No biomarker results loaded</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
