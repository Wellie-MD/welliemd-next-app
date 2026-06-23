/**
 * LabMarkerDetailModal — "Biomarker Details" dialog.
 * Shows Junction marker specs, TAT, LOINC map, and AOE questions.
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Biomarker Details</DialogTitle>
          <DialogDescription className="text-xs">
            From Junction's marker catalog (<code>GET /v3/lab_tests/markers</code>).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-y py-3">
            <Detail label="Name" value={marker.name} />
            <Detail
              label="Provider ID"
              value={<span className="font-mono">{marker.provider_id || "—"}</span>}
            />
            <Detail label="Category" value={marker.category || "—"} />
            <Detail
              label="Slug"
              value={<span className="font-mono">{marker.slug || "—"}</span>}
            />
            <Detail
              label="Marker ID"
              value={
                <span className="font-mono">
                  {marker.junction_marker_id || "—"}
                </span>
              }
            />
            <Detail
              label="Display Code"
              value={
                <span className="font-mono">
                  {marker.display_code || marker.code || "—"}
                </span>
              }
            />
            <Detail
              label="Common TAT"
              value={
                <span className="font-semibold text-emerald-600">
                  {marker.common_tat || "—"}
                </span>
              }
            />
            <Detail
              label="Worst-case TAT"
              value={
                <span className="font-semibold text-amber-600">
                  {marker.worst_case_tat || "—"}
                </span>
              }
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => onOpenChange(false)} className="text-xs h-8">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
        {label}
      </span>
      <span className="text-foreground font-semibold">{value}</span>
    </div>
  );
}
