/**
 * LabMarkerDetailModal — "Biomarker Details" dialog.
 *
 * Responsive layout:
 *  - Core fields: 2-col grid on ≥480 px, 1-col on smaller screens
 *  - LOINC MAP: horizontally scrollable table; SLUG col hidden on xs
 *  - AOE questions: question text + badges stack vertically on xs
 *  - Dialog width: full-width with safe side margins on mobile, capped at xl on desktop
 *
 * Data source: Junction GET /v3/lab_tests/markers (stored in source_snapshot).
 */
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type Biomarker } from "@/api/labs";
import { normalizeAoeQuestion } from "@/features/labs/utils/aoeUtils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marker: Biomarker | null;
}

export default function LabMarkerDetailModal({ open, onOpenChange, marker }: Props) {
  if (!marker) return null;

  const aoe = (marker.aoe_questions ?? []).map(normalizeAoeQuestion);
  const loincMap = marker.loinc_map ?? [];
  const typeLabel =
    marker.marker_type && marker.marker_type.trim() ? marker.marker_type : "biomarker";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
       * Responsive dialog sizing:
       *   - w-[calc(100vw-24px)] on mobile keeps 12px safe margin each side
       *   - max-w-xl caps width on desktop
       *   - max-h-[92vh] + overflow-y-auto on the content div handles tall content
       */}
      <DialogContent className="w-[calc(100vw-24px)] max-w-xl gap-0 overflow-hidden border-sky-100 p-0">
        {/* Sticky header */}
        <div className="border-b border-sky-100 bg-gradient-to-r from-sky-50 via-white to-teal-50 px-5 pb-4 pt-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight text-slate-900">Biomarker Details</DialogTitle>
            <DialogDescription className="mt-1 text-xs text-slate-600">
              From Junction's marker catalog (
              <code className="text-[10px]">GET /v3/lab_tests/markers</code>).
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable body */}
        <div className="max-h-[calc(92vh-110px)] space-y-5 overflow-y-auto bg-white px-5 py-4 text-xs">

          {/* ── Core fields ───────────────────────────────────────────────── */}
          {/*
           * grid-cols-1 on xs, grid-cols-2 from 480 px up (min-[480px]).
           * Each Detail is self-contained so the grid reflow is clean.
           */}
          <div className="grid grid-cols-1 gap-3 border-y border-sky-100 py-3 min-[480px]:grid-cols-2">
            <Detail label="Name" value={marker.name} />
            <Detail
              label="Test Code / Provider ID"
              value={
                <span className="font-mono break-all">{marker.provider_id || "—"}</span>
              }
            />
            <Detail label="Type" value={typeLabel} />
            <Detail
              label="Marker ID"
              value={
                <span className="font-mono">{marker.junction_marker_id || "—"}</span>
              }
            />
            <Detail
              label="Vital slug"
              value={
                <span className="font-mono break-all">{marker.slug || "—"}</span>
              }
            />
            <Detail label="Category" value={marker.category || "—"} />
            <Detail
              label="Common turnaround"
              value={
                <span className="text-emerald-600 font-semibold">
                  {marker.common_tat || "—"}
                </span>
              }
            />
            <Detail
              label="Worst-case turnaround"
              value={
                <span className="text-amber-600 font-semibold">
                  {marker.worst_case_tat || "—"}
                </span>
              }
            />
          </div>

          {/* ── LOINC MAP ─────────────────────────────────────────────────── */}
          {loincMap.length > 0 && (
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-sky-800">
                <span className="h-4 w-1 rounded-full bg-sky-600" />
                LOINC Map
              </p>
              {/*
               * -mx-5 + px-5 lets the scroll area reach the modal edge on mobile
               * without a double scroll bar on desktop.
               */}
              <div className="-mx-5 px-5 overflow-x-auto">
                <div className="min-w-[420px]">
                  <div className="overflow-hidden rounded-lg border border-sky-100 shadow-sm">
                    <table className="w-full text-xs">
                      <thead className="bg-sky-50/80">
                        <tr className="border-b border-sky-100">
                          <th className="px-3 py-2 text-left text-[10px] font-bold tracking-wider text-sky-800">
                            NAME
                          </th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold tracking-wider text-sky-800">
                            TEST CODE
                          </th>
                          {/* SLUG hidden on xs via min-[480px]:table-cell */}
                          <th className="hidden px-3 py-2 text-left text-[10px] font-bold tracking-wider text-sky-800 min-[480px]:table-cell">
                            SLUG
                          </th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold tracking-wider text-sky-800">
                            REQUIRED
                          </th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold tracking-wider text-sky-800">
                            LOINC
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sky-50">
                        {loincMap.map((row, i) => (
                          <tr key={i} className="align-middle odd:bg-white even:bg-slate-50/40 hover:bg-sky-50/50">
                            <td className="px-3 py-2 font-medium text-slate-900">{row.name || "—"}</td>
                            <td className="px-3 py-2">
                              <span className="rounded bg-teal-50 px-1.5 py-0.5 font-mono text-[10px] text-teal-800 ring-1 ring-inset ring-teal-200">
                                {row.test_code || "—"}
                              </span>
                            </td>
                            <td className="hidden px-3 py-2 font-mono text-slate-500 min-[480px]:table-cell">
                              {row.slug || "—"}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[9.5px] font-semibold whitespace-nowrap ${
                                  row.required
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "border border-slate-200 bg-slate-100 text-slate-500"
                                }`}
                              >
                                {row.required ? "Yes" : "No"}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              {row.loinc ? (
                                <span className="whitespace-nowrap rounded border border-teal-200 bg-teal-50 px-1.5 py-0.5 font-mono text-[10px] text-teal-800">
                                  {row.loinc}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ASK ON ORDER ENTRY ────────────────────────────────────────── */}
          {aoe.length > 0 && (
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                <span className="h-4 w-1 rounded-full bg-amber-500" />
                Ask on Order Entry
              </p>

              <div className="space-y-2">
                {aoe.map((q, i) => (
                  <div key={i} className="space-y-2 rounded-lg border border-amber-100 bg-amber-50/30 p-3">
                    <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-start min-[480px]:justify-between gap-2">
                      <p className="font-medium text-foreground leading-snug">
                        {q.label || q.code || q.questionId || "—"}
                      </p>
                      <div className="flex flex-wrap gap-1.5 min-[480px]:shrink-0">
                        <span className="inline-block whitespace-nowrap rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[9.5px] font-semibold text-slate-600">
                          {q.typeLabel}
                        </span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[9.5px] font-semibold border whitespace-nowrap ${
                            q.required
                              ? "bg-amber-50 text-amber-700 border-amber-300"
                              : "border-slate-200 bg-slate-100 text-slate-500"
                          }`}
                        >
                          {q.required ? "Required" : "Optional"}
                        </span>
                        {q.isFastingDuplicate && (
                          <span className="inline-block whitespace-nowrap rounded border border-sky-200 bg-sky-50 px-2 py-0.5 text-[9.5px] font-semibold text-sky-700">
                            Fasting (auto)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Helper text for friendly questions (e.g. Specimen source) */}
                    {q.helperText && (
                      <p className="text-[11px] leading-snug text-slate-600">{q.helperText}</p>
                    )}

                    {/* Metadata row: code · sequence · constraint · default */}
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10px] text-slate-500">
                      {q.code && <span>code: {q.code}</span>}
                      {q.sequence ? <span>seq: {q.sequence}</span> : null}
                      {q.constraint && <span>constraint: {String(q.constraint)}</span>}
                      {q.defaultValue != null && q.defaultValue !== "" && (
                        <span>default: {String(q.defaultValue)}</span>
                      )}
                    </div>

                    {/* Options only for choice / multi_choice; never empty text rows */}
                    {(q.isChoice || q.isMultiChoice) && q.options.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {q.options.map((opt, j) => (
                          <span
                            key={j}
                            className="inline-block rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[10px] font-medium text-sky-800"
                          >
                            {opt.code} · {opt.value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-slate-500">
                Collected at intake and sent in{" "}
                <code className="text-[10px]">aoe_answers</code> on the Create Order
                request.
              </p>
            </div>
          )}

          {/* Close button */}
          <div className="flex justify-end pt-1 pb-1">
            <Button
              onClick={() => onOpenChange(false)}
              className="text-xs h-8 min-w-[64px]"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Detail helper ─────────────────────────────────────────────────────────────

function Detail({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">
        {label}
      </span>
      {/* min-w-0 on the parent + break-all on mono values prevents grid blowout */}
      <span className="text-foreground font-semibold text-xs leading-snug block">
        {value}
      </span>
    </div>
  );
}
