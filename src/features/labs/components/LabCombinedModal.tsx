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
import { formatAoeCount } from "@/features/labs/utils/aoeUtils";
import { getCollectionMethodLabel } from "@/features/labs/utils";
import {
  type CombinedMethodRow,
  type CombinedLabPanel,
  INITIAL_COMBINED_METHODS,
  STATES_LIST,
} from "@/features/labs/types";
import {
  combinedPanelEditForm,
  type CombinedPanelEditForm,
} from "@/features/treatments/programs/components/programLabRequirementCatalog";
import {
  AuthoringSteps,
  CombinedMemberMatrix,
  ComparisonOverview,
  DecisionConfirmation,
  QualificationClientSelection,
  type CombinedValidationState,
} from "./CombinedAuthoringExperience";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** All active single-method lab panels (pre-loaded from parent). */
  labs: LabPanel[];
  onCreated: () => void;
  initialPanel?: CombinedLabPanel | null;
  onUpdated?: () => void;
}

const EMPTY_VALIDATION: CombinedValidationState = {
  valid: false,
  errors: [],
  warnings: [],
  checking: false,
};

function apiErrorMessage(error: unknown, fallback: string) {
  const response = typeof error === "object" && error !== null && "response" in error
    ? (error as { response?: { data?: { detail?: string; message?: string } } }).response
    : undefined;
  return response?.data?.detail ?? response?.data?.message ?? fallback;
}

export default function LabCombinedModal({
  open,
  onOpenChange,
  labs,
  onCreated,
  initialPanel = null,
  onUpdated,
}: Props) {
  const isEditing = Boolean(initialPanel);
  const [name, setName] = useState("");
  const [editForm, setEditForm] = useState<CombinedPanelEditForm | null>(null);
  const [methods, setMethods] = useState<CombinedMethodRow[]>(
    INITIAL_COMBINED_METHODS.map(m => ({ ...m }))
  );
  const [validation, setValidation] = useState<CombinedValidationState>(EMPTY_VALIDATION);
  const [createStep, setCreateStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [workflowBusy, setWorkflowBusy] = useState(false);
  const [reviewReason, setReviewReason] = useState("");
  const [saveError, setSaveError] = useState("");
  const [successorMode, setSuccessorMode] = useState(false);
  const [qualificationClientId, setQualificationClientId] = useState("");
  const [qualificationCandidates, setQualificationCandidates] = useState<import("@/features/labs/types").CombinedQualificationCandidate[]>([]);
  const [qualificationLoading, setQualificationLoading] = useState(false);

  // Reset on open
  useEffect(() => {
    if (open) {
      if (initialPanel) {
        const form = combinedPanelEditForm(initialPanel);
        setEditForm(form);
        setName(form.name);
        // Members are immutable after publication. Keep the edit form focused
        // on panel metadata and render the server-returned member matrix below.
        setMethods([]);
        setValidation({ valid: true, errors: [], warnings: [], checking: false });
      } else {
        setEditForm(null);
        setName("");
        setMethods(INITIAL_COMBINED_METHODS.map(m => ({ ...m })));
        setValidation(EMPTY_VALIDATION);
      }
      setSaveError("");
      setReviewReason(initialPanel?.review_reason || "");
      setWorkflowBusy(false);
      setSuccessorMode(false);
      setQualificationClientId("");
      setQualificationCandidates([]);
      setQualificationLoading(false);
      setCreateStep(1);
    }
  }, [open, initialPanel]);

  // Panels available per method (active + same method)
  const panelsForMethod = useMemo(() => {
    const map: Record<string, LabPanel[]> = {};
    for (const row of INITIAL_COMBINED_METHODS) {
      map[row.method] = labs.filter(
        l =>
          l.collection_method === row.method && l.is_active
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

  useEffect(() => {
    if (!open || isEditing || selectedPanelIds.length < 2) {
      setQualificationCandidates([]);
      setQualificationClientId("");
      return;
    }
    let cancelled = false;
    setQualificationLoading(true);
    labsApi.getCombinedQualificationCandidates(selectedPanelIds)
      .then(candidates => {
        if (cancelled) return;
        setQualificationCandidates(candidates);
        setQualificationClientId(current => candidates.some(candidate => candidate.client_id === current) ? current : "");
      })
      .catch(() => {
        if (!cancelled) {
          setQualificationCandidates([]);
          setQualificationClientId("");
        }
      })
      .finally(() => {
        if (!cancelled) setQualificationLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, isEditing, selectedPanelIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const selectedPanels = useMemo(
    () => selectedPanelIds.map(id => labs.find(panel => panel.id === id)).filter((panel): panel is LabPanel => Boolean(panel)),
    [labs, selectedPanelIds],
  );
  const reviewReasonRequired = !isEditing && validation.warnings.length > 0;
  const selectedQualificationCandidate = qualificationCandidates.find(candidate => candidate.client_id === qualificationClientId);
  const canSave = (isEditing ? editForm?.name.trim() : name.trim())
    && ((!isEditing && validation.valid) || (isEditing && successorMode ? validation.valid : true))
    && (isEditing || (Boolean(qualificationClientId) && selectedQualificationCandidate?.eligible === true))
    && (!reviewReasonRequired || Boolean(reviewReason.trim()))
    && !saving;

  const handleCreate = async () => {
    if (!canSave) return;
    setSaving(true);
    setSaveError("");
    try {
      if (isEditing && initialPanel && successorMode) {
        await labsApi.supersedeCombinedPanel(initialPanel.id, selectedPanelIds);
        onOpenChange(false);
        onUpdated?.();
        return;
      }
      if (isEditing && initialPanel && editForm) {
        await labsApi.updateCombinedPanel(initialPanel.id, {
          name: editForm.name.trim(),
          description: editForm.description,
          is_active: editForm.is_active,
          service_states: editForm.service_states,
          cost_to_client: { amount: editForm.cost_to_client, currency: "USD" },
          cost_to_welliemd: { amount: editForm.cost_to_welliemd, currency: "USD" },
        });
        onOpenChange(false);
        onUpdated?.();
        return;
      }
      await labsApi.createCombinedPanel({
        name: name.trim(),
        member_panel_ids: selectedPanelIds,
        review_reason: reviewReason.trim(),
        qualification_client_id: qualificationClientId,
      });
      onOpenChange(false);
      onCreated();
    } catch (error: unknown) {
      setSaveError(apiErrorMessage(error, "Failed to create combined panel."));
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (approvalBasis: "exact_loinc" | "manual_review") => {
    if (!initialPanel || workflowBusy) return;
    if (approvalBasis === "manual_review" && !reviewReason.trim()) {
      setSaveError("A review reason is required for manual approval.");
      return;
    }
    setWorkflowBusy(true);
    setSaveError("");
    try {
      await labsApi.approveCombinedPanel(initialPanel.id, {
        approval_basis: approvalBasis,
        reason: reviewReason.trim(),
      });
      onOpenChange(false);
      onUpdated?.();
    } catch (error: unknown) {
      setSaveError(apiErrorMessage(error, "Combined panel approval failed."));
    } finally {
      setWorkflowBusy(false);
    }
  };

  const handlePublish = async () => {
    if (!initialPanel || workflowBusy) return;
    setWorkflowBusy(true);
    setSaveError("");
    try {
      await labsApi.publishCombinedPanel(initialPanel.id);
      onOpenChange(false);
      onUpdated?.();
    } catch (error: unknown) {
      setSaveError(apiErrorMessage(error, "Combined panel publication failed."));
    } finally {
      setWorkflowBusy(false);
    }
  };

  const beginSuccessor = () => {
    if (!initialPanel) return;
    setSuccessorMode(true);
    setMethods(INITIAL_COMBINED_METHODS.map(row => {
      const member = initialPanel.members.find(item => item.collection_method === row.method);
      return { ...row, checked: Boolean(member), selectedPanelId: member?.panel_id || "" };
    }));
    setValidation(EMPTY_VALIDATION);
    setSaveError("");
  };

  const cancelSuccessor = () => {
    setSuccessorMode(false);
    setMethods([]);
    setValidation({ valid: true, errors: [], warnings: [], checking: false });
    setSaveError("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-24px)] sm:w-full max-w-3xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 border-b shrink-0">
          <DialogTitle className="text-lg font-bold">{isEditing ? (successorMode ? "Create successor combined panel" : "Edit combined panel") : "Create combined panel"}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1 leading-normal">
            {isEditing
              ? (successorMode
                ? "Create a new version from this published definition. The published definition remains unchanged."
                : "Review this version and its selected Lab tests. Published membership stays read-only.")
              : "Choose the Lab tests, understand the available information, and make the final decision."}
          </DialogDescription>
          {!isEditing && <div className="mt-4"><AuthoringSteps current={createStep} /></div>}
        </DialogHeader>

        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Panel name */}
          {(isEditing || createStep === 1) && <div className="space-y-1.5">
            <Label htmlFor="comb-name" className="font-semibold text-xs text-foreground">
              Panel name <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="comb-name"
              placeholder="e.g. Comprehensive Metabolic Panel"
              value={isEditing ? editForm?.name || "" : name}
              onChange={e => isEditing
                ? setEditForm(prev => prev ? { ...prev, name: e.target.value } : prev)
                : setName(e.target.value)}
              disabled={successorMode}
              className="h-9 text-xs"
            />
          </div>}

          {isEditing && editForm && (
            <div className="space-y-4 rounded-lg border border-slate-200 p-4">
              <div className="space-y-1.5">
                <Label htmlFor="comb-description" className="font-semibold text-xs">Description</Label>
                <Input id="comb-description" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} disabled={successorMode} className="h-9 text-xs" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="comb-client-cost" className="font-semibold text-xs">Cost to client</Label>
                  <Input id="comb-client-cost" inputMode="decimal" value={editForm.cost_to_client} onChange={e => setEditForm({ ...editForm, cost_to_client: e.target.value })} disabled={successorMode} className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="comb-welliemd-cost" className="font-semibold text-xs">Cost to WellieMD</Label>
                  <Input id="comb-welliemd-cost" inputMode="decimal" value={editForm.cost_to_welliemd} onChange={e => setEditForm({ ...editForm, cost_to_welliemd: e.target.value })} disabled={successorMode} className="h-9 text-xs" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold">
                <Checkbox checked={editForm.is_active} disabled={successorMode} onCheckedChange={checked => setEditForm({ ...editForm, is_active: Boolean(checked) })} />
                Panel enabled
              </label>
              <div>
                <p className="mb-2 text-xs font-semibold">Allowed service states</p>
                <div className="grid grid-cols-4 gap-2">
                  {STATES_LIST.map(state => (
                    <label key={state} className="flex items-center gap-1.5 text-[11px]">
                      <Checkbox checked={editForm.service_states.includes(state)} disabled={successorMode} onCheckedChange={checked => setEditForm({ ...editForm, service_states: checked ? [...editForm.service_states, state] : editForm.service_states.filter(item => item !== state) })} />
                      {state}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isEditing && initialPanel && (
            <section aria-labelledby="combined-review-heading" className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/40 p-4">
              <div>
                <h3 id="combined-review-heading" className="text-xs font-semibold text-foreground">Clinical review and publication</h3>
                <p className="mt-1 text-[10.5px] leading-normal text-muted-foreground">
                  Membership and clinical evidence are frozen by version. Approval is explicit; publication is a separate action.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div><span className="font-semibold">Compatibility:</span> {initialPanel.compatibility_status || "unvalidated"}</div>
                <div><span className="font-semibold">Lifecycle:</span> {initialPanel.lifecycle_state || "draft"}</div>
              </div>
              {successorMode ? (
                <Button type="button" variant="outline" onClick={cancelSuccessor} disabled={saving || workflowBusy} className="h-8 text-xs">
                  Cancel successor draft
                </Button>
              ) : initialPanel.compatibility_status === "approved" ? (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={handlePublish} disabled={workflowBusy || initialPanel.lifecycle_state === "published"} className="h-8 text-xs bg-blue-600 hover:bg-blue-700">
                    {workflowBusy ? "Publishing…" : initialPanel.lifecycle_state === "published" ? "Published" : "Publish approved panel"}
                  </Button>
                  {initialPanel.lifecycle_state === "published" && (
                    <Button type="button" variant="outline" onClick={beginSuccessor} disabled={workflowBusy} className="h-8 text-xs">
                      Create successor definition
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {initialPanel.compatibility_status === "review_required" && (
                    <Input
                      aria-label="Manual review reason"
                      placeholder="Reason for manual clinical review"
                      value={reviewReason}
                      onChange={e => setReviewReason(e.target.value)}
                      className="h-8 text-xs"
                    />
                  )}
                  <div className="flex flex-wrap gap-2">
                    {initialPanel.compatibility_status === "exact_candidate" && (
                      <Button type="button" onClick={() => handleApprove("exact_loinc")} disabled={workflowBusy} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700">
                        {workflowBusy ? "Reviewing…" : "Approve exact LOINC match"}
                      </Button>
                    )}
                    {initialPanel.compatibility_status === "review_required" && (
                      <Button type="button" onClick={() => handleApprove("manual_review")} disabled={workflowBusy} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700">
                        {workflowBusy ? "Reviewing…" : "Approve manual review"}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          {isEditing && !successorMode ? (
            <CombinedMemberMatrix members={initialPanel?.members ?? []} />
          ) : (isEditing || createStep === 1) ? (
          <div className="space-y-2">
            <Label className="font-semibold text-xs text-foreground">
              Methods to combine <span className="text-rose-500">*</span>
            </Label>
            <p className="text-[10.5px] text-muted-foreground leading-normal">
              Pick at least two. We will explain available similarities, differences,
              and setup gaps before you make the final decision.
            </p>

            {methods.map(row => {
              const available = panelsForMethod[row.method] ?? [];
              const selectedPanel = row.selectedPanelId
                ? available.find(p => p.id === row.selectedPanelId)
                : undefined;
              return (
                <div key={row.method} className="space-y-1 py-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-3 shrink-0">
                      <Checkbox
                        id={`comb-${row.method}`}
                        checked={row.checked}
                        disabled={isEditing && !successorMode}
                        onCheckedChange={(v) => toggleMethod(row.method, !!v)}
                      />
                      <label
                        htmlFor={`comb-${row.method}`}
                        className="text-xs font-medium text-foreground w-[156px] shrink-0 cursor-pointer"
                      >
                        {row.label}
                      </label>
                    </div>
                    <Select
                      value={row.selectedPanelId}
                      onValueChange={val => setPanel(row.method, val)}
                      disabled={(isEditing && !successorMode) || available.length === 0}
                    >
                      <SelectTrigger className="h-8 text-xs w-full sm:flex-1">
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
                  {selectedPanel && (
                    <p className="text-[10.5px] text-muted-foreground pl-7">
                      {row.label} · {formatAoeCount({
                        required: selectedPanel.aoe_required_count ?? 0,
                        optional: selectedPanel.aoe_optional_count ?? 0,
                      })}
                      {(selectedPanel.aoe_required_count ?? 0) + (selectedPanel.aoe_optional_count ?? 0) > 0
                        ? " questions"
                        : ""}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          ) : null}

          {!isEditing && createStep === 2 && <QualificationClientSelection candidates={qualificationCandidates} loading={qualificationLoading} selectedClientId={qualificationClientId} onSelect={setQualificationClientId} />}
          {!isEditing && createStep === 3 && selectedQualificationCandidate && (
            <ComparisonOverview
              panels={selectedPanels}
              validation={validation}
              qualificationCandidate={selectedQualificationCandidate}
            />
          )}
          {!isEditing && createStep === 4 && <DecisionConfirmation panels={selectedPanels} warnings={validation.warnings} reason={reviewReason} onReasonChange={setReviewReason} />}

          {saveError && (
            <p className="text-xs text-red-600 font-medium">{saveError}</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 px-4 sm:px-6 py-4 border-t shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs h-9"
          >
            Cancel
          </Button>
          {!isEditing && createStep > 1 && <Button type="button" variant="outline" onClick={() => setCreateStep(step => step - 1)} className="text-xs h-9">Back</Button>}
          {!isEditing && createStep < 4 ? <Button
            type="button"
            onClick={() => setCreateStep(step => step + 1)}
            disabled={
              (createStep === 1 && (!name.trim() || selectedRows.length < 2 || validation.checking || !validation.valid)) ||
              (createStep === 2 && (!qualificationClientId || selectedQualificationCandidate?.eligible !== true))
            }
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 px-4"
          >{createStep === 1 ? "Check qualification" : createStep === 2 ? "Review comparison" : "Continue to decision"}</Button> : <Button
            type="button"
            onClick={handleCreate}
            disabled={!canSave}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 px-4"
          >
            {saving ? (isEditing ? (successorMode ? "Creating…" : "Saving…") : "Creating…") : (isEditing ? (successorMode ? "Create successor" : "Save changes") : "Create Combined Panel")}
          </Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
