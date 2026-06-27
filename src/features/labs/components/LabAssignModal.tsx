/**
 * LabAssignModal — "Assign to Clients" two-pane dialog.
 * Left pane: lab panels to assign. Right pane: clients + per-assignment Junction actions.
 */
import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type AssignItem, type AssignClient } from "@/features/labs/types";
import { renderJunctionStatusBadge } from "@/features/labs/utils";

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
  onSubmit: () => Promise<void>;
  onSyncToTenant: (client: AssignClient) => Promise<void>;
  onSubmitToJunction: (client: AssignClient) => Promise<void>;
  onCheckStatus: (client: AssignClient) => Promise<void>;
  onReplaceSubmission: (client: AssignClient) => Promise<void>;
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
  onSubmit,
  onSyncToTenant,
  onSubmitToJunction,
  onCheckStatus,
  onReplaceSubmission,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                const busy = !!c.assignment_id && assignmentActionId === c.assignment_id;
                const accountOptions = c.lab_account_options ?? [];
                const hasAmbiguousAccounts =
                  c.lab_account_state === "ambiguous" || accountOptions.length > 1;
                const needsAccountSelection = hasAmbiguousAccounts && !c.lab_account_id;
                const canSubmit =
                  !!c.assignment_id &&
                  c.checked &&
                  !c.junction_lab_test_id &&
                  !needsAccountSelection;
                const canSync =
                  !!c.assignment_id &&
                  c.checked &&
                  !!c.junction_lab_test_id;
                const canCheck =
                  !!c.assignment_id &&
                  c.checked &&
                  !!c.junction_lab_test_id &&
                  !c.is_orderable &&
                  statusNorm !== "active";
                const canReplace =
                  !!c.assignment_id &&
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
                      {c.checked && c.assignment_id && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {renderJunctionStatusBadge(c.junction_status || "pending_submission")}
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
                      {c.checked && accountOptions.length > 1 && (
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
                        {accountOptions.length || (c.linkedLabAccountIds ?? []).length} acct
                        {(accountOptions.length || (c.linkedLabAccountIds ?? []).length) === 1 ? "" : "s"}
                      </span>
                      {c.checked && c.assignment_id && (
                        <div className="flex items-center gap-1">
                          {canSync && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => onSyncToTenant(c)}
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
                              onClick={() => onSubmitToJunction(c)}
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
                              onClick={() => onCheckStatus(c)}
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
                              onClick={() => onReplaceSubmission(c)}
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
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 px-4"
          >
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
