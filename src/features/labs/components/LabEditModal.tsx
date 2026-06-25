/**
 * LabEditModal — "Lab Test Details" dialog.
 * Shows read-only panel metadata + editable pricing, availability, and service states.
 */
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Biomarker, type LabPanel } from "@/api/labs";
import { countAoeQuestions, formatAoeCount } from "@/features/labs/utils/aoeUtils";
import { STATES_LIST } from "@/features/labs/types";
import { getCollectionMethodLabel, renderJunctionStatusBadge } from "@/features/labs/utils";

interface EditFormState {
  cost_to_client: number;
  cost_to_welliemd: number;
  is_active: boolean;
  service_states: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLab: LabPanel | null;
  editForm: EditFormState;
  onEditFormChange: (updater: (prev: EditFormState) => EditFormState) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onMarkerClick: (marker: Biomarker) => void;
}

export default function LabEditModal({
  open,
  onOpenChange,
  selectedLab,
  editForm,
  onEditFormChange,
  onSubmit,
  onMarkerClick,
}: Props) {
  if (!selectedLab) return null;

  const toggleState = (code: string) => {
    onEditFormChange(prev => ({
      ...prev,
      service_states: prev.service_states.includes(code)
        ? prev.service_states.filter(s => s !== code)
        : [...prev.service_states, code],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="text-lg font-bold">Lab Test Details</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1 leading-normal">
            The lab and biomarkers are fixed once created. Pricing and availability are
            editable below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="p-6 space-y-5">
          {/* Read-only info grid */}
          <div className="grid grid-cols-2 gap-y-3.5 gap-x-6 py-2 text-xs">
            <InfoRow label="Name" value={selectedLab.name} wide />
            <InfoRow label="Junction Status" value={renderJunctionStatusBadge(selectedLab.junction_status)} />
            <InfoRow
              label="Junction Lab ID"
              value={
                <span className="font-mono text-[12px]">
                  {selectedLab.vital_slug || "—"}
                </span>
              }
            />
            <InfoRow label="Type" value="Lab panel" />
            <InfoRow label="Lab" value={selectedLab.lab_provider} />
            <InfoRow label="Sample type" value={selectedLab.sample_type || "—"} />
            <InfoRow
              label="Collection method"
              value={getCollectionMethodLabel(selectedLab.collection_method)}
            />
            <InfoRow
              label="Fasting required"
              value={selectedLab.fasting_required === "yes" ? "Yes" : "No"}
            />
            <InfoRow
              label="Common turnaround"
              value={selectedLab.turnaround_days ? `${selectedLab.turnaround_days} days` : "—"}
            />
            <InfoRow
              label="Junction price"
              value={selectedLab.junction_price ? `$${selectedLab.junction_price.toFixed(2)}` : "—"}
            />
            <InfoRow
              label="Description"
              value={selectedLab.description || "—"}
              wide
            />
          </div>

          {/* Biomarkers table */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Biomarkers ({selectedLab.biomarkers.length})
              </p>
              <span className="inline-block px-2 py-0.5 rounded-full text-[9.5px] font-semibold border border-border/60 bg-muted text-muted-foreground whitespace-nowrap">
                Lab questions: {formatAoeCount({
                  required: selectedLab.aoe_required_count ?? 0,
                  optional: selectedLab.aoe_optional_count ?? 0,
                })}
              </span>
            </div>
            <div className="border border-border/80 rounded-lg overflow-hidden bg-card">
              <Table className="text-xs">
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-bold text-foreground h-8">NAME</TableHead>
                    <TableHead className="font-bold text-foreground h-8">PROVIDER ID</TableHead>
                    <TableHead className="font-bold text-foreground h-8">CATEGORY</TableHead>
                    <TableHead className="h-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedLab.biomarkers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        No biomarkers mapped.
                      </TableCell>
                    </TableRow>
                  ) : (
                    selectedLab.biomarkers.map((bm: Biomarker) => (
                      <TableRow key={bm.id} className="h-8">
                        <TableCell className="font-medium text-foreground py-1.5">
                          <div className="flex items-center gap-1.5">
                            <span>{bm.name}</span>
                            {(() => {
                              const counts = countAoeQuestions(bm.aoe_questions);
                              if (counts.required + counts.optional === 0) return null;
                              return (
                                <span
                                  className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold border border-amber-200 bg-amber-50 text-amber-700 whitespace-nowrap"
                                  title="Requires order questions (AOE)"
                                >
                                  {formatAoeCount(counts)}
                                </span>
                              );
                            })()}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground py-1.5">
                          {bm.provider_id || bm.code || "—"}
                        </TableCell>
                        <TableCell className="py-1.5">{bm.category}</TableCell>
                        <TableCell className="text-right py-1.5 pr-4">
                          <button
                            type="button"
                            onClick={() => onMarkerClick(bm)}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            Details
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Editable pricing */}
          <div className="space-y-3.5 pt-4 border-t">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Pricing & availability (editable)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit_cost_client" className="font-semibold text-xs text-foreground">
                  Cost to Client ($)
                </Label>
                <Input
                  id="edit_cost_client"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={editForm.cost_to_client}
                  onChange={e =>
                    onEditFormChange(prev => ({
                      ...prev,
                      cost_to_client: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit_cost_welliemd" className="font-semibold text-xs text-foreground">
                  Cost to WellieMD ($)
                </Label>
                <Input
                  id="edit_cost_welliemd"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={editForm.cost_to_welliemd}
                  onChange={e =>
                    onEditFormChange(prev => ({
                      ...prev,
                      cost_to_welliemd: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/20 border border-border/40 rounded-lg">
              <div>
                <span className="font-semibold text-xs text-foreground block">
                  WellieMD availability:{" "}
                  <strong className="font-bold">{editForm.is_active ? "Enabled" : "Disabled"}</strong>
                </span>
              </div>
              <Switch
                id="edit-active"
                checked={editForm.is_active}
                onCheckedChange={val => onEditFormChange(prev => ({ ...prev, is_active: val }))}
              />
            </div>
          </div>

          {/* Service states */}
          <div className="space-y-3 pt-4 border-t">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Service States
            </p>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">
                States where this lab panel is offered. Leave empty to offer in all states.
              </p>
              <div className="flex gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onEditFormChange(prev => ({ ...prev, service_states: [...STATES_LIST] }))
                  }
                  className="h-7 text-xs border-border/80"
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEditFormChange(prev => ({ ...prev, service_states: [] }))}
                  className="h-7 text-xs border-border/80"
                >
                  Clear All
                </Button>
              </div>
            </div>

            {editForm.service_states.length === 0 && (
              <div className="bg-[#fef3c7] border border-[#fde68a] text-[#92400e] p-2.5 rounded-lg text-xs flex items-center gap-2">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="shrink-0">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>
                  <strong>No states selected</strong> — this panel will be offered in{" "}
                  <strong>ALL states</strong>.
                </span>
              </div>
            )}

            <div className="border border-border/80 rounded-lg p-3 max-h-36 overflow-y-auto flex flex-wrap gap-1.5 bg-background/50">
              {STATES_LIST.map(state => {
                const active = editForm.service_states.includes(state);
                return (
                  <button
                    key={state}
                    type="button"
                    onClick={() => toggleState(state)}
                    className={`h-7 w-11 text-xs font-semibold rounded border transition-colors ${
                      active
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-background text-muted-foreground border-input hover:bg-muted"
                    }`}
                  >
                    {state}
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="gap-2 md:gap-0 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="text-xs h-9">
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 px-4"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Small helper to avoid repetitive JSX inside the info grid
function InfoRow({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <span className="text-muted-foreground block font-bold uppercase tracking-wider text-[10px] mb-0.5">
        {label}
      </span>
      <span className="text-foreground font-semibold text-xs">{value}</span>
    </div>
  );
}
