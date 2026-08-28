import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  Loader2,
  RefreshCw,
  Users,
  X,
} from "lucide-react";

import {
  AssignmentSourceKind,
  treatmentAssignmentApi,
} from "@/api/treatmentAssignmentApi";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useClients } from "@/hooks/useClients";
import {
  ASSIGNMENT_POLL_INTERVAL_MS,
  ASSIGNMENT_MAX_POLL_ATTEMPTS,
  OPERATION_STATUS,
  PREFLIGHT_STATUS,
  RUNTIME_STATE,
  safeAssignmentMessage,
  TERMINAL_OPERATION_STATUSES,
} from "@/features/treatments/assignment/constants";
import {
  AssignmentEmptyState,
  AssignmentListItem,
  AssignmentPrimaryButton,
  AssignmentSelection,
} from "@/features/treatments/assignment/components/AssignmentModalPrimitives";
import {
  AssignmentPairCard,
  AssignmentPairState,
} from "@/features/treatments/assignment/components/AssignmentPairCard";
import { useAuthStore } from "@/store/useAuthStore";

interface TreatmentAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: AssignmentListItem[];
  sourceKind: AssignmentSourceKind;
  itemLabel: string;
  onAssignmentsCompleted?: () => void;
}

type Phase = "select" | "preflight" | "progress";

const errorMessage = (error: unknown) => {
  const value = error as {
    response?: { data?: { detail?: string; error?: string; code?: string } };
    message?: string;
  };
  return safeAssignmentMessage(
    value.response?.data?.detail ||
    value.response?.data?.error ||
    value.response?.data?.code ||
    value.message ||
    "The assignment service is unavailable."
  );
};

const errorDetails = (error: unknown) => {
  const value = error as {
    response?: {
      data?: { detail?: string; code?: string; action?: string };
    };
  };
  return {
    error: errorMessage(error),
    errorCode: value.response?.data?.code,
    errorAction: value.response?.data?.action,
  };
};

export function TreatmentAssignmentModal({
  open,
  onOpenChange,
  items,
  sourceKind,
  itemLabel,
  onAssignmentsCompleted,
}: TreatmentAssignmentModalProps) {
  const { clients, loading: clientsLoading, error: clientsError } = useClients("");
  const [phase, setPhase] = useState<Phase>("select");
  const [itemIds, setItemIds] = useState<Set<string>>(new Set());
  const [clientIds, setClientIds] = useState<Set<string>>(new Set());
  const [itemSearch, setItemSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [pairs, setPairs] = useState<AssignmentPairState[]>([]);
  const [working, setWorking] = useState(false);
  const [pollAttempts, setPollAttempts] = useState<Record<string, number>>({});
  const reportedCompletionIdsRef = useRef<Set<string>>(new Set());
  const permissionValues = useAuthStore((state) => state.user?.permissions);
  const permissions = useMemo(
    () => new Set(permissionValues || []),
    [permissionValues]
  );
  const isCustomProgram = sourceKind === "custom_program";

  const filteredItems = useMemo(() => {
    const query = itemSearch.trim().toLowerCase();
    return query
      ? items.filter((item) =>
          `${item.name} ${item.subtitle || ""}`.toLowerCase().includes(query)
        )
      : items;
  }, [itemSearch, items]);

  const filteredClients = useMemo(() => {
    const query = clientSearch.trim().toLowerCase();
    return query
      ? clients.filter((client) =>
          `${client.name} ${client.user?.email || ""}`.toLowerCase().includes(query)
        )
      : clients;
  }, [clientSearch, clients]);

  const reset = () => {
    reportedCompletionIdsRef.current.clear();
    setPhase("select");
    setItemIds(new Set());
    setClientIds(new Set());
    setItemSearch("");
    setClientSearch("");
    setPairs([]);
    setWorking(false);
    setPollAttempts({});
  };

  const changeOpen = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const toggle = (
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    id: string
  ) => {
    setter((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const runPreflight = async () => {
    setWorking(true);
    setPhase("preflight");
    if (isCustomProgram) setPairs([]);
    const selectedItems = items.filter((item) => itemIds.has(item.id));
    const selectedClients = clients.filter((client) => clientIds.has(client.id));
    const requestedPairs = selectedItems.flatMap((item) =>
      selectedClients.map((client) => ({
        key: `${item.id}:${client.id}`,
        sourceId: item.id,
        sourceName: item.name,
        clientId: client.id,
        clientName: client.name,
      }))
    );
    setPairs(
      await Promise.all(
        requestedPairs.map(async (pair) => {
          try {
            const preflight = await treatmentAssignmentApi.preflight(
              sourceKind,
              pair.sourceId,
              pair.clientId
            );
            return {
              ...pair,
              preflight,
              error: undefined,
              errorCode: undefined,
              errorAction: undefined,
            };
          } catch (error) {
            return { ...pair, ...errorDetails(error) };
          }
        })
      )
    );
    setWorking(false);
  };

  const confirmAssignments = async () => {
    setWorking(true);
    setPhase("progress");
    const next = await Promise.all(
      pairs.map(async (pair) => {
        if (pair.preflight?.status !== PREFLIGHT_STATUS.ready) return pair;
        try {
          return {
            ...pair,
            operation: await treatmentAssignmentApi.createOperation(pair.preflight),
            error: undefined,
          };
        } catch (error) {
          return { ...pair, ...errorDetails(error) };
        }
      })
    );
    setPairs(next);
    setWorking(false);
  };

  useEffect(() => {
    if (!open || phase !== "progress") return;
    const active = pairs.filter(
      (pair) =>
        pair.operation &&
        !TERMINAL_OPERATION_STATUSES.has(pair.operation.status) &&
        (pollAttempts[pair.key] || 0) < ASSIGNMENT_MAX_POLL_ATTEMPTS
    );
    if (!active.length) return;
    const timer = window.setTimeout(async () => {
      const refreshed = await Promise.all(
        pairs.map(async (pair) => {
          if (
            !pair.operation ||
            TERMINAL_OPERATION_STATUSES.has(pair.operation.status)
          ) {
            return pair;
          }
          try {
            return {
              ...pair,
              operation: await treatmentAssignmentApi.getOperation(
                pair.operation.id
              ),
              error: undefined,
            };
          } catch (error) {
            return { ...pair, error: errorMessage(error) };
          }
        })
      );
      setPairs(
        refreshed.map((pair) => {
          const nextAttempt = (pollAttempts[pair.key] || 0) + 1;
          return pair.operation &&
            !TERMINAL_OPERATION_STATUSES.has(pair.operation.status) &&
            nextAttempt >= ASSIGNMENT_MAX_POLL_ATTEMPTS
            ? {
                ...pair,
                error:
                  "Automatic status refresh timed out. The operation is still preserved; refresh it manually from Assignment History.",
              }
            : pair;
        })
      );
      setPollAttempts((current) => {
        const next = { ...current };
        active.forEach((pair) => {
          next[pair.key] = (next[pair.key] || 0) + 1;
        });
        return next;
      });
    }, ASSIGNMENT_POLL_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [open, pairs, phase, pollAttempts]);

  const recheckPair = async (pair: AssignmentPairState) => {
    try {
      const preflight = await treatmentAssignmentApi.preflight(
        sourceKind,
        pair.sourceId,
        pair.clientId
      );
      setPairs((current) =>
        current.map((value) =>
          value.key === pair.key
            ? {
                ...value,
                preflight,
                // A failed operation is immutable history. Once readiness is
                // rechecked, detach that terminal operation so the refreshed
                // preflight can be confirmed as a new assignment attempt.
                operation: undefined,
                error: undefined,
                errorCode: undefined,
                errorAction: undefined,
              }
            : value
        )
      );
      setPhase("preflight");
      setPollAttempts({});
    } catch (error) {
      updatePairError(pair.key, errorMessage(error));
    }
  };

  const retry = async (pair: AssignmentPairState) => {
    if (!pair.operation) return;
    try {
      const operation = await treatmentAssignmentApi.retryOperation(
        pair.operation.id
      );
      setPairs((current) =>
        current.map((value) =>
          value.key === pair.key ? { ...value, operation, error: undefined } : value
        )
      );
    } catch (error) {
      updatePairError(pair.key, errorMessage(error));
    }
  };

  const cancel = async (pair: AssignmentPairState) => {
    if (!pair.operation) return;
    try {
      const operation = await treatmentAssignmentApi.cancelOperation(
        pair.operation.id
      );
      setPairs((current) =>
        current.map((value) =>
          value.key === pair.key ? { ...value, operation } : value
        )
      );
    } catch (error) {
      updatePairError(pair.key, errorMessage(error));
    }
  };

  const updatePairError = (key: string, error: string) => {
    setPairs((current) =>
      current.map((pair) => (pair.key === key ? { ...pair, error } : pair))
    );
  };

  const readyCount = pairs.filter(
    (pair) => pair.preflight?.status === PREFLIGHT_STATUS.ready
  ).length;
  const runtimeReadyOperationIds = useMemo(
    () =>
      pairs.flatMap((pair) =>
        pair.operation?.status === OPERATION_STATUS.completed &&
        pair.operation.runtime_state === RUNTIME_STATE.ready
          ? [pair.operation.id]
          : []
      ),
    [pairs]
  );
  const completeCount = runtimeReadyOperationIds.length;
  const failedCount = pairs.filter(
    (pair) =>
      pair.error ||
      pair.operation?.status === OPERATION_STATUS.failed ||
      pair.operation?.status === OPERATION_STATUS.blocked
  ).length;
  const pendingCount = Math.max(0, pairs.length - completeCount - failedCount);
  const canPreflight = itemIds.size > 0 && clientIds.size > 0 && !working;

  useEffect(() => {
    if (!open || phase !== "progress") return;

    const newlyCompletedIds = runtimeReadyOperationIds.filter(
      (id) => !reportedCompletionIdsRef.current.has(id)
    );
    if (!newlyCompletedIds.length) return;

    newlyCompletedIds.forEach((id) => {
      reportedCompletionIdsRef.current.add(id);
    });
    onAssignmentsCompleted?.();
  }, [onAssignmentsCompleted, open, phase, runtimeReadyOperationIds]);

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent showClose={false} className="max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-5xl gap-0 overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl sm:w-[calc(100vw-2rem)]">
        <DialogTitle className="sr-only">Dependency-aware assignment</DialogTitle>
        <header className="flex shrink-0 items-start justify-between border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50">
              <Users className="h-5 w-5 text-sky-600" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Assign {itemLabel} to clients
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {phase === "select"
                  ? "Choose sources and tenants."
                  : phase === "preflight"
                    ? "Review every dependency before one confirmation."
                    : `${completeCount} completed · ${failedCount} failed · ${pendingCount} pending`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => changeOpen(false)}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
            aria-label="Close assignment"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {phase === "select" ? (
          <AssignmentSelection
            itemLabel={itemLabel}
            items={filteredItems}
            clients={filteredClients}
            itemIds={itemIds}
            clientIds={clientIds}
            itemSearch={itemSearch}
            clientSearch={clientSearch}
            clientsLoading={clientsLoading}
            clientsError={clientsError}
            onItemSearch={setItemSearch}
            onClientSearch={setClientSearch}
            onItemToggle={(id) => toggle(setItemIds, id)}
            onClientToggle={(id) => toggle(setClientIds, id)}
          />
        ) : (
          <div className="min-h-0 max-h-[min(560px,calc(100dvh-13rem))] space-y-3 overflow-y-auto bg-slate-50/60 p-3 sm:p-5">
            {working && pairs.length === 0 ? (
              <AssignmentEmptyState icon={<Loader2 className="h-6 w-6 animate-spin" />} text="Analyzing dependencies…" />
            ) : (
              pairs.map((pair) => (
                <AssignmentPairCard
                  key={pair.key}
                  pair={pair}
                  onRetry={() => retry(pair)}
                  onCancel={() => cancel(pair)}
                  onRecheck={() =>
                    isCustomProgram ? runPreflight() : recheckPair(pair)
                  }
                  rechecking={isCustomProgram && working}
                  onNavigate={() => changeOpen(false)}
                  permissions={permissions}
                />
              ))
            )}
          </div>
        )}

        <footer className="flex shrink-0 flex-col gap-3 border-t border-slate-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
          <span className="text-xs text-slate-500 sm:text-sm">
            {phase === "select"
              ? `${itemIds.size} ${itemLabel}${itemIds.size === 1 ? "" : "s"} · ${clientIds.size} clients`
              : phase === "preflight"
              ? `${readyCount} ready · ${pairs.length - readyCount} require attention`
              : `${completeCount} completed · ${failedCount} failed · ${pendingCount} pending`}
          </span>
          <div className="flex flex-wrap justify-end gap-2">
            {phase !== "select" && phase !== "progress" && (
              <button
                type="button"
                onClick={() => setPhase("select")}
                className="flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-medium"
              >
                <ChevronLeft className="h-4 w-4" /> Change selection
              </button>
            )}
            {phase === "select" && (
              <AssignmentPrimaryButton disabled={!canPreflight} onClick={runPreflight}>
                {working ? "Checking…" : "Review dependencies"}
              </AssignmentPrimaryButton>
            )}
            {phase === "preflight" && (
              <>
                <button
                  type="button"
                  disabled={working}
                  onClick={runPreflight}
                  className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium"
                >
                  <RefreshCw className="h-4 w-4" /> Refresh
                </button>
                <AssignmentPrimaryButton
                  disabled={!readyCount || working}
                  onClick={confirmAssignments}
                >
                  Confirm {readyCount} ready assignment{readyCount === 1 ? "" : "s"}
                </AssignmentPrimaryButton>
              </>
            )}
            {phase === "progress" && (
              <AssignmentPrimaryButton disabled={working} onClick={() => changeOpen(false)}>
                Close
              </AssignmentPrimaryButton>
            )}
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
