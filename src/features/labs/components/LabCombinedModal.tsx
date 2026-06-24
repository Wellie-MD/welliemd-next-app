/**
 * LabCombinedModal — "Create combined panel" dialog.
 *
 * Matches client prototype exactly:
 *   - Panel name field
 *   - Four method rows (at-home phlebotomy, walk-in, test kit, on-site)
 *   - Each row: checkbox + dropdown of active panels for that method
 *   - Live validation: ≥2 methods, biomarker match, price warning
 *   - "Create combined panel" disabled until valid
 */
import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { labsApi, type LabPanel } from "@/api/labs";
import {
  type CombinedMethodRow,
  INITIAL_COMBINED_METHODS,
} from "@/features/labs/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** All active single-method lab panels (pre-loaded from parent). */
  labs: LabPanel[];
  onCreated: () => void;
}

interface ValidationState {
  valid: boolean;
  errors: string[];
  warnings: string[];
  checking: boolean;
}

const EMPTY_VALIDATION: ValidationState = {
  valid: false,
  errors: [],
  warnings: [],
  checking: false,
};

export default function LabCombinedModal({ open, onOpenChange, labs, onCreated }: Props) {
  const [name, setName] = useState("");
  const [methods, setMethods] = useState<CombinedMethodRow[]>(
    INITIAL_COMBINED_METHODS.map(m => ({ ...m }))
  );
  const [validation, setValidation] = useState<ValidationState>(EMPTY_VALIDATION);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Reset on open
  useEffect(() => {
    if (open) {
      setName("");
      setMethods(INITIAL_COMBINED_METHODS.map(m => ({ ...m })));
      setValidation(EMPTY_VALIDATION);
      setSaveError("");
    }
  }, [open]);

  // Panels available per method (active + same method)
  const panelsForMethod = useMemo(() => {
    const map: Record<string, LabPanel[]> = {};
    for (const row of INITIAL_COMBINED_METHODS) {
      map[row.method] = labs.filter(
        l =>
          l.collection_method === row.method &&
          (l.junction_status === "active" || l.junction_status === "Active")
      );
    }
    return map;
  }, [labs]);

  // Selected panels (checked + has a panel picked)
  const selectedRows = useMemo(
    () => methods.filter(r => r.checked && r.selectedPanelId),
    [methods]
  );

  const selectedPanelIds = useMemo(
    () => selectedRows.map(r => r.selectedPanelId),
    [selectedRows]
  );

  // Live validation — debounced call to backend
  useEffect(() => {
    if (selectedPanelIds.length < 2) {
      setValidation({
        valid: false,
        errors: selectedPanelIds.length === 0
          ? []
          : ["Select at least two methods (with a test each) to combine."],
        warnings: [],
        checking: false,
      });
      return;
    }
    let cancelled = false;
    setValidation(v => ({ ...v, checking: true }));
    labsApi.validateCombinedMembers(selectedPanelIds).then(res => {
      if (!cancelled) setValidation({ ...res, checking: false });
    }).catch(() => {
      if (!cancelled) setValidation(v => ({ ...v, checking: false }));
    });
    return () => { cancelled = true; };
  }, [selectedPanelIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMethod = (method: string, checked: boolean) => {
    setMethods(prev => prev.map(r =>
      r.method === method ? { ...r, checked, selectedPanelId: checked ? r.selectedPanelId : "" } : r
    ));
  };

  const setPanel = (method: string, panelId: string) => {
    setMethods(prev => prev.map(r =>
      r.method === method ? { ...r, selectedPanelId: panelId, checked: !!panelId } : r
    ));
  };

  const canSave = name.trim().length > 0 && validation.valid && !saving;

  const handleCreate = async () => {
    if (!canSave) return;
    setSaving(true);
    setSaveError("");
    try {
      await labsApi.createCombinedPanel({
        name: name.trim(),
        member_panel_ids: selectedPanelIds,
      });
      onOpenChange(false);
      onCreated();
    } catch (e: any) {
      setSaveError(
        e?.response?.data?.detail ?? e?.response?.data?.message ?? "Failed to create combined panel."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="text-lg font-bold">Create combined panel</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1 leading-normal">
            Pair an at-home test with a walk-in test so one checkout link lets the patient
            pick by location. Junction locks each test to its method, so a combined panel
            links two lab tests.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* Panel name */}
          <div className="space-y-1.5">
            <Label htmlFor="comb-name" className="font-semibold text-xs text-foreground">
              Panel name <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="comb-name"
              placeholder="e.g. Comprehensive Metabolic Panel"
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          {/* Methods to combine */}
          <div className="space-y-2">
            <Label className="font-semibold text-xs text-foreground">
              Methods to combine <span className="text-rose-500">*</span>
            </Label>
            <p className="text-[10.5px] text-muted-foreground leading-normal">
              Pick at least two. Each must point to a lab test with the same biomarkers —
              the patient gets whichever is available at their ZIP.
            </p>

            {methods.map(row => {
              const available = panelsForMethod[row.method] ?? [];
              return (
                <div key={row.method} className="flex items-center gap-3 py-1.5">
                  <Checkbox
                    id={`comb-${row.method}`}
                    checked={row.checked}
                    onCheckedChange={(v) => toggleMethod(row.method, !!v)}
                  />
                  <label
                    htmlFor={`comb-${row.method}`}
                    className="text-xs font-medium text-foreground w-[156px] shrink-0 cursor-pointer"
                  >
                    {row.label}
                  </label>
                  <Select
                    value={row.selectedPanelId}
                    onValueChange={val => setPanel(row.method, val)}
                    disabled={available.length === 0}
                  >
                    <SelectTrigger className="h-8 text-xs flex-1">
                      <SelectValue
                        placeholder={
                          available.length === 0 ? "No active panels for this method" : "Select a test…"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {available.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>

          {/* Validation area */}
          <ValidationArea
            selectedCount={selectedRows.length}
            validation={validation}
          />

          {saveError && (
            <p className="text-xs text-red-600 font-medium">{saveError}</p>
          )}
        </div>

        <DialogFooter className="gap-2 md:gap-0 px-6 py-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs h-9"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={!canSave}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 px-4"
          >
            {saving ? "Creating…" : "Create combined panel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Validation area sub-component ─────────────────────────────────────────────

function ValidationArea({
  selectedCount,
  validation,
}: {
  selectedCount: number;
  validation: ValidationState;
}) {
  if (selectedCount === 0) return null;

  if (validation.checking) {
    return (
      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
        Checking…
      </div>
    );
  }

  if (selectedCount < 2 && validation.errors.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
        Select at least two methods (with a test each) to combine.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/60 bg-muted/10 px-3 py-2.5 space-y-1.5">
      {validation.errors.map((err, i) => (
        <div key={i} className="flex items-start gap-2 text-xs text-red-600">
          <span className="mt-0.5 shrink-0">✗</span>
          <span>{err}</span>
        </div>
      ))}
      {validation.errors.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-emerald-700">
          <span>✓</span>
          <span>Biomarkers match — combined panel is valid.</span>
        </div>
      )}
      {validation.warnings.map((w, i) => (
        <div key={i} className="flex items-start gap-2 text-xs text-amber-700">
          <span className="mt-0.5 shrink-0">⚠</span>
          <span>{w}</span>
        </div>
      ))}
    </div>
  );
}
