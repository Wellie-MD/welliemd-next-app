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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marker: Biomarker | null;
}

export default function LabMarkerDetailModal({ open, onOpenChange, marker }: Props) {
  if (!marker) return null;

  const aoe = marker.aoe_questions ?? [];
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
      <DialogContent className="w-[calc(100vw-24px)] max-w-xl p-0 gap-0 overflow-hidden">
        {/* Sticky header */}
        <div className="px-5 pt-5 pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Biomarker Details</DialogTitle>
            <DialogDescription className="text-xs mt-0.5">
              From Junction's marker catalog (
              <code className="text-[10px]">GET /v3/lab_tests/markers</code>).
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable body */}
        <div className="px-5 py-4 space-y-5 text-xs overflow-y-auto max-h-[calc(92vh-110px)]">

          {/* ── Core fields ───────────────────────────────────────────────── */}
          {/*
           * grid-cols-1 on xs, grid-cols-2 from 480 px up (min-[480px]).
           * Each Detail is self-contained so the grid reflow is clean.
           */}
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-x-6 gap-y-3 border-y py-3">
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
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                LOINC Map
              </p>
              {/*
               * -mx-5 + px-5 lets the scroll area reach the modal edge on mobile
               * without a double scroll bar on desktop.
               */}
              <div className="-mx-5 px-5 overflow-x-auto">
                <div className="min-w-[420px]">
                  <div className="border border-border/70 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/30">
                        <tr>
                          <th className="text-left font-bold text-[10px] tracking-wider text-muted-foreground px-3 py-2">
                            NAME
                          </th>
                          <th className="text-left font-bold text-[10px] tracking-wider text-muted-foreground px-3 py-2">
                            TEST CODE
                          </th>
                          {/* SLUG hidden on xs via min-[480px]:table-cell */}
                          <th className="hidden min-[480px]:table-cell text-left font-bold text-[10px] tracking-wider text-muted-foreground px-3 py-2">
                            SLUG
                          </th>
                          <th className="text-left font-bold text-[10px] tracking-wider text-muted-foreground px-3 py-2">
                            REQUIRED
                          </th>
                          <th className="text-left font-bold text-[10px] tracking-wider text-muted-foreground px-3 py-2">
                            LOINC
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {loincMap.map((row, i) => (
                          <tr key={i} className="align-middle">
                            <td className="px-3 py-2 font-medium">{row.name || "—"}</td>
                            <td className="px-3 py-2">
                              <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">
                                {row.test_code || "—"}
                              </span>
                            </td>
                            <td className="hidden min-[480px]:table-cell px-3 py-2 font-mono text-muted-foreground">
                              {row.slug || "—"}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[9.5px] font-semibold whitespace-nowrap ${
                                  row.required
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-muted text-muted-foreground border border-border/60"
                                }`}
                              >
                                {row.required ? "Yes" : "No"}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              {row.loinc ? (
                                <span className="font-mono bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap">
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
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Ask on Order Entry
              </p>

              <div className="space-y-2">
                {aoe.map((q, i) => (
                  <div key={i} className="border border-border/70 rounded-lg p-3 space-y-2">
                    {/*
                     * On xs: question text on its own line, badges below it.
                     * On ≥480px: question + badges side-by-side (existing layout).
                     * flex-col on xs, flex-row on min-[480px].
                     */}
                    <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-start min-[480px]:justify-between gap-2">
                      <p className="font-medium text-foreground leading-snug">
                        {q.label || q.code || q.question_id || "—"}
                      </p>
                      {/* Badges always wrap on a new line on xs; inline on wider screens */}
                      <div className="flex flex-wrap gap-1.5 min-[480px]:shrink-0">
                        <span className="inline-block px-2 py-0.5 rounded text-[9.5px] font-semibold bg-muted text-muted-foreground border border-border/60 whitespace-nowrap">
                          {q.type || "text"}
                        </span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[9.5px] font-semibold border whitespace-nowrap ${
                            q.required
                              ? "bg-amber-50 text-amber-700 border-amber-300"
                              : "bg-muted text-muted-foreground border-border/60"
                          }`}
                        >
                          {q.required ? "Required" : "Optional"}
                        </span>
                      </div>
                    </div>

                    {/* Question code */}
                    {q.code && (
                      <p className="font-mono text-[10px] text-muted-foreground">
                        code: {q.code}
                      </p>
                    )}

                    {/* Answer options — always wrapping */}
                    {q.options.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {q.options.map((opt, j) => (
                          <span
                            key={j}
                            className="inline-block border border-border/60 rounded-full px-2.5 py-0.5 text-[10px] font-medium bg-background text-foreground"
                          >
                            {opt.code} · {opt.value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-muted-foreground">
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
