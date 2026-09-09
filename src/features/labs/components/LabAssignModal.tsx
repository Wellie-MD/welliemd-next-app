/**
 * LabAssignModal — "Assign to Clients" two-pane dialog.
 * Left pane: lab panels to assign. Right pane: clients + per-assignment Junction actions.
 */
import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type AssignItem, type AssignClient } from "@/features/labs/types";
import { getCombinedJunctionStatus, renderJunctionStatusBadge } from "@/features/labs/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignItemPool: AssignItem[];
  onAssignItemPoolChange: (pool: AssignItem[]) => void;
  assignClients: AssignClient[];
  onAssignClientsChange: (clients: AssignClient[]) => void;
  itemSearch: string;
  onItemSearchChange: (v: string) => void;
  clientSearch: string;
  onClientSearchChange: (v: string) => void;
  assignmentActionId: string | null;
  isSubmitting: boolean;
  /** Junction actions belong to standalone Lab assignments only. */
  showJunctionActions: boolean;
  onSubmit: () => Promise<void>;
  onSyncToTenant?: (client: AssignClient) => Promise<void>;
  onSubmitToJunction?: (client: AssignClient) => Promise<void>;
  onCheckStatus?: (client: AssignClient) => Promise<void>;
  onReplaceSubmission?: (client: AssignClient) => Promise<void>;
  onRetryCombinedSync?: (client: AssignClient) => Promise<void>;
}

export default function LabAssignModal({
  open,
  onOpenChange,
  assignItemPool,
  onAssignItemPoolChange,
  assignClients,
  onAssignClientsChange,
  itemSearch,
  onItemSearchChange,
  clientSearch,
  onClientSearchChange,
  assignmentActionId,
  isSubmitting,
  showJunctionActions,
  onSubmit,
  onSyncToTenant,
  onSubmitToJunction,
  onCheckStatus,
  onReplaceSubmission,
  onRetryCombinedSync,
}: Props) {
  const filteredItems = useMemo(
    () =>
      assignItemPool.filter(
        it =>
          it.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
          it.sub.toLowerCase().includes(itemSearch.toLowerCase()),
      ),
    [assignItemPool, itemSearch],
  );

  const filteredClients = useMemo(
    () =>
      assignClients.filter(
        c =>
          c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
          c.email.toLowerCase().includes(clientSearch.toLowerCase()),
      ),
    [assignClients, clientSearch],
  );

  const checkedCount = assignItemPool.filter(it => it.checked).length;

  const toggleItem = (id: string, checked: boolean) => {
    onAssignItemPoolChange(
      assignItemPool.map(it => (it.id === id ? { ...it, checked } : it)),
    );
  };

  const toggleClient = (id: string, checked: boolean) => {
    onAssignClientsChange(
      assignClients.map(c => (c.id === id ? { ...c, checked } : c)),
    );
  };

  const toggleAllClients = (checked: boolean) => {
    onAssignClientsChange(assignClients.map(c => ({ ...c, checked })));
  };

  const updateClientLabAccount = (clientId: string, labAccountId: string) => {
    onAssignClientsChange(
      assignClients.map(c => (
        c.id === clientId
          ? { ...c, lab_account_id: labAccountId, linkedLabAccountIds: labAccountId ? [labAccountId] : [] }
          : c
      ))
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        if (!isSubmitting) onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-[760px] w-[94%] p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-lg font-bold">Assign to Clients</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1 leading-normal">
            Pick lab panels and the client brands that can offer them under Products → Lab
            Tests.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-0 min-h-[40vh] max-h-[60vh] overflow-hidden">
          {/* Left: items */}
          <div className="w-[42%] border-r bg-muted/10 p-4 overflow-y-auto flex flex-col space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                Lab Panels
              </span>
              <span className="text-[11px] text-muted-foreground">{checkedCount} selected</span>
            </div>
            <Input
              placeholder="Search items"
              value={itemSearch}
              onChange={e => onItemSearchChange(e.target.value)}
              className="h-8 text-xs"
            />
            <div className="space-y-1">
              {filteredItems.map(it => (
                <label
                  key={it.id}
                  className="flex items-start gap-2.5 p-2 border-b border-border/60 hover:bg-muted/40 rounded cursor-pointer select-none"
                >
                  <Checkbox
                    checked={it.checked}
                    onCheckedChange={v => toggleItem(it.id, !!v)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-foreground leading-normal truncate">
                      {it.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">{it.sub}</div>
                  </div>
                </label>
              ))}
              {filteredItems.length === 0 && (
                <div className="p-6 text-center text-xs text-muted-foreground">No matches</div>
              )}
            </div>
          </div>

          {/* Right: clients */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                Assign to clients
              </span>
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => toggleAllClients(true)}
                  className="h-6 text-[10px] px-2 py-0.5"
                >
                  All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => toggleAllClients(false)}
                  className="h-6 text-[10px] px-2 py-0.5"
                >
                  None
                </Button>
              </div>
            </div>
            <Input
              placeholder="Search clients by name or email"
              value={clientSearch}
              onChange={e => onClientSearchChange(e.target.value)}
              className="h-8 text-xs"
            />
            <div className="space-y-1">
              {filteredClients.map(c => {
                const statusNorm = (c.junction_status ?? "").toLowerCase();
                const operationalNorm = (c.operational_status ?? "").toLowerCase();
                const assignmentIds = c.assignment_ids?.length
                  ? c.assignment_ids
                  : c.assignment_id
                    ? [c.assignment_id]
                    : [];
                const hasAssignment = assignmentIds.length > 0;
                const busy = hasAssignment && assignmentIds.includes(assignmentActionId ?? "");
                const accountOptions = c.lab_account_options ?? [];
                const labAccountRequired = c.lab_account_required ?? false;
                const usesPlatformAccounts = (c.lab_account_mode ?? "platform") === "platform";
                const hasAmbiguousAccounts =
                  labAccountRequired && (c.lab_account_state === "ambiguous" || accountOptions.length > 1);
                const needsAccountSelection = hasAmbiguousAccounts && !c.lab_account_id;
                const pendingCombinedSubmissions = (c.methods ?? []).filter(
                  method => method.submission_ready === true && !method.junction_lab_test_id,
                );
                const displayJunctionStatus = getCombinedJunctionStatus(
                  c.methods,
                  c.junction_status || "pending_submission",
                );
                const canSubmit =
                  hasAssignment &&
                  c.checked &&
                  !needsAccountSelection &&
                  (pendingCombinedSubmissions.length > 0 ||
                    ((c.methods?.length ?? 0) === 0 && !c.junction_lab_test_id && !!c.submission_ready));
                const canSync =
                  hasAssignment &&
                  c.checked &&
                  !!c.junction_lab_test_id;
                const canCheck =
                  hasAssignment &&
                  c.checked &&
                  !!c.junction_lab_test_id &&
                  !c.is_orderable &&
                  statusNorm !== "active";
                const canReplace =
                  hasAssignment &&
                  c.checked &&
                  (statusNorm === "failed" ||
                    statusNorm === "rejected" ||
                    operationalNorm === "failed" ||
                    operationalNorm === "needs_support");

                return (
                  <div
                    key={c.id}
                    className="flex items-start gap-2.5 p-2 border-b border-border/60 hover:bg-muted/40 rounded"
                  >
                    <Checkbox
                      checked={c.checked}
                      onCheckedChange={v => toggleClient(c.id, !!v)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-foreground truncate">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">{c.email}</div>
                      {c.checked && hasAssignment && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {renderJunctionStatusBadge(displayJunctionStatus)}
                          {c.is_orderable && (
                            <span className="inline-block border px-[8px] py-[2px] rounded-[10px] text-[10px] font-semibold bg-[#ecfdf5] text-[#047857] border-[#a7f3d0]">
                              Orderable
                            </span>
                          )}
                          {c.is_orderable && statusNorm === "active" && (
                            <span className="inline-block border px-[8px] py-[2px] rounded-[10px] text-[10px] font-semibold bg-sky-50 text-sky-700 border-sky-200">
                              Synced
                            </span>
                          )}
                          {c.junction_lab_test_id && (
                            <span
                              className="text-[10px] text-muted-foreground font-mono truncate max-w-[150px]"
                              title={c.junction_lab_test_id}
                            >
                              {c.junction_lab_test_id}
                            </span>
                          )}
                        </div>
                      )}
                      {c.checked && c.blocking_reason && !c.submission_ready && (
                        <div className="mt-1 text-[10px] text-amber-700">
                          {c.blocking_reason}
                        </div>
                      )}
                      {c.checked && c.submission_ready && !c.patient_price_configured && (
                        <div className="mt-1 text-[10px] text-sky-700">
                          Client pricing can be configured after Junction approval.
                        </div>
                      )}
                      {c.checked && usesPlatformAccounts && (
                        <div className="mt-2 rounded-md border border-sky-200 bg-sky-50 px-2 py-1.5 text-[10px] text-sky-800">
                          Junction routes orders through platform lab accounts for this assignment. No tenant lab account selection is required.
                        </div>
                      )}
                      {c.checked && labAccountRequired && accountOptions.length > 1 && (
                        <div className="mt-2">
                          <select
                            value={c.lab_account_id || ""}
                            onChange={e => updateClientLabAccount(c.id, e.target.value)}
                            className="h-7 w-full rounded-md border border-input bg-background px-2 text-[11px] text-foreground"
                          >
                            <option value="">Select Junction lab account</option>
                            {accountOptions.map(option => (
                              <option key={option.lab_account_id} value={option.lab_account_id}>
                                {(option.account_name || option.lab || option.lab_account_id)} · {option.status || "unknown"}
                              </option>
                            ))}
                          </select>
                          {needsAccountSelection && (
                            <div className="mt-1 text-[10px] text-amber-700">
                              Multiple active accounts match this provider. Select one before submitting.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-[10px] text-muted-foreground pr-1">
                        {usesPlatformAccounts
                          ? "Platform routing"
                          : `${accountOptions.length || (c.linkedLabAccountIds ?? []).length} acct${(accountOptions.length || (c.linkedLabAccountIds ?? []).length) === 1 ? "" : "s"}`}
                      </span>
                      {c.checked && hasAssignment && !showJunctionActions && (
                        <div className="mt-1.5 max-w-[190px] space-y-1.5">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <span className={`inline-block rounded-[10px] border px-[8px] py-[2px] text-[10px] font-semibold ${c.sync_status === "synced" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : c.sync_status === "failed" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                              {c.sync_status === "synced" ? "Synced" : c.sync_status === "failed" ? "Sync failed" : "Sync pending"}
                            </span>
                            {c.sync_attempt_count ? <span className="text-[10px] text-muted-foreground">Attempt {c.sync_attempt_count}</span> : null}
                          </div>
                          {c.sync_status === "failed" && c.sync_error && (
                            <p className="text-right text-[10px] leading-snug text-rose-700">{c.sync_error}</p>
                          )}
                          {c.sync_status === "failed" && onRetryCombinedSync && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => onRetryCombinedSync(c)}
                              disabled={busy || isSubmitting}
                              className="ml-auto h-7 border-rose-200 px-2 text-[10px] text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                            >
                              {busy && <Loader2 className="mr-1 h-3 w-3 animate-spin" aria-hidden="true" />}
                              {busy ? "Retrying…" : "Retry sync"}
                            </Button>
                          )}
                        </div>
                      )}
                      {c.checked && !showJunctionActions && (c.methods ?? []).length > 0 && (
                        <div className="mt-2 space-y-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
                          {(c.methods ?? []).map((method, index) => {
                            const readiness = String(method.operational_status || method.readiness_code || "unknown").replaceAll("_", " ");
                            const reason = method.blocking_reason || method.reason;
                            return (
                              <div key={String(method.assignment_id || method.panel_id || index)} className="text-[10px] text-slate-700">
                                <span className="font-semibold">{String(method.panel_name || method.name || "Member Lab")}</span>
                                {": "}
                                <span className="capitalize">{readiness}</span>
                                {reason ? ` — ${String(reason)}` : ""}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {c.checked && hasAssignment && showJunctionActions && (
                        <div className="flex items-center gap-1">
                          {canSync && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => onSyncToTenant?.(c)}
                              disabled={busy}
                              className="h-6 px-2 text-[10px]"
                              title="Sync latest admin panel changes to this client tenant without submitting a new Junction lab test"
                            >
                              Sync
                            </Button>
                          )}
                          {canSubmit && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => onSubmitToJunction?.(c)}
                              disabled={busy}
                              className="h-6 px-2 text-[10px]"
                            >
                              Submit
                            </Button>
                          )}
                          {canCheck && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => onCheckStatus?.(c)}
                              disabled={busy}
                              className="h-6 px-2 text-[10px]"
                            >
                              Check
                            </Button>
                          )}
                          {canReplace && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => onReplaceSubmission?.(c)}
                              disabled={busy}
                              className="h-6 px-2 text-[10px] text-rose-600 hover:text-rose-700"
                            >
                              Replace
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredClients.length === 0 && (
                <div className="p-6 text-center text-xs text-muted-foreground">No matches</div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t gap-2 bg-muted/5">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs h-9">
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 px-4 inline-flex items-center"
          >
            {isSubmitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            {isSubmitting ? "Assigning…" : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
