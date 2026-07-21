import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  Clock3,
  Loader2,
  RefreshCw,
  ShieldAlert,
  StopCircle,
  Users,
  X,
} from "lucide-react";

import {
  AssignmentOperation,
  AssignmentPreflight,
  AssignmentSourceKind,
  treatmentAssignmentApi,
} from "@/api/treatmentAssignmentApi";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useClients } from "@/hooks/useClients";
import {
  ASSIGNMENT_POLL_INTERVAL_MS,
  ASSIGNMENT_STEP_LABELS,
  DEPENDENCY_LABELS,
  OPERATION_STATUS,
  PREFLIGHT_STATUS,
  RETRYABLE_OPERATION_STATUSES,
  TERMINAL_OPERATION_STATUSES,
} from "@/features/treatments/assignment/constants";
import {
  AssignmentEmptyState,
  AssignmentListItem,
  AssignmentPrimaryButton,
  AssignmentSelection,
} from "@/features/treatments/assignment/components/AssignmentModalPrimitives";

interface PairState {
  key: string;
  sourceId: string;
  sourceName: string;
  clientId: string;
  clientName: string;
  preflight?: AssignmentPreflight;
  operation?: AssignmentOperation;
  error?: string;
}

interface TreatmentAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: AssignmentListItem[];
  sourceKind: AssignmentSourceKind;
  itemLabel: string;
}

type Phase = "select" | "preflight" | "progress";

const errorMessage = (error: unknown) => {
  const value = error as {
    response?: { data?: { detail?: string; code?: string } };
    message?: string;
  };
  return (
    value.response?.data?.detail ||
    value.response?.data?.code ||
    value.message ||
    "The assignment service is unavailable."
  );
};

export function TreatmentAssignmentModal({
  open,
  onOpenChange,
  items,
  sourceKind,
  itemLabel,
}: TreatmentAssignmentModalProps) {
  const { clients, loading: clientsLoading, error: clientsError } = useClients("");
  const [phase, setPhase] = useState<Phase>("select");
  const [itemIds, setItemIds] = useState<Set<string>>(new Set());
  const [clientIds, setClientIds] = useState<Set<string>>(new Set());
  const [itemSearch, setItemSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [pairs, setPairs] = useState<PairState[]>([]);
  const [working, setWorking] = useState(false);

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
    setPhase("select");
    setItemIds(new Set());
    setClientIds(new Set());
    setItemSearch("");
    setClientSearch("");
    setPairs([]);
    setWorking(false);
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
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const runPreflight = async () => {
    setWorking(true);
    setPhase("preflight");
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
            return { ...pair, preflight };
          } catch (error) {
            return { ...pair, error: errorMessage(error) };
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
          return { ...pair, error: errorMessage(error) };
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
        !TERMINAL_OPERATION_STATUSES.has(pair.operation.status)
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
      setPairs(refreshed);
    }, ASSIGNMENT_POLL_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [open, pairs, phase]);

  const retry = async (pair: PairState) => {
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

  const cancel = async (pair: PairState) => {
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
  const completeCount = pairs.filter(
    (pair) => pair.operation?.status === OPERATION_STATUS.completed
  ).length;
  const canPreflight = itemIds.size > 0 && clientIds.size > 0 && !working;

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="max-w-5xl gap-0 overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl">
        <DialogTitle className="sr-only">Dependency-aware assignment</DialogTitle>
        <header className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
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
                    : `${completeCount} of ${pairs.length} tenant assignments runtime-ready.`}
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
          <div className="max-h-[560px] space-y-3 overflow-y-auto bg-slate-50/60 p-5">
            {working && pairs.length === 0 ? (
              <AssignmentEmptyState icon={<Loader2 className="h-6 w-6 animate-spin" />} text="Analyzing dependencies…" />
            ) : (
              pairs.map((pair) => (
                <PairCard
                  key={pair.key}
                  pair={pair}
                  phase={phase}
                  onRetry={() => retry(pair)}
                  onCancel={() => cancel(pair)}
                />
              ))
            )}
          </div>
        )}

        <footer className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
          <span className="text-sm text-slate-500">
            {phase === "select"
              ? `${itemIds.size} ${itemLabel}${itemIds.size === 1 ? "" : "s"} · ${clientIds.size} clients`
              : `${readyCount} ready · ${pairs.length - readyCount} require attention`}
          </span>
          <div className="flex gap-2">
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

function PairCard(props: {
  pair: PairState;
  phase: Phase;
  onRetry: () => void;
  onCancel: () => void;
}) {
  const { pair } = props;
  const preflight = pair.preflight;
  const operation = pair.operation;
  const issues = [
    ...(preflight?.blockers || []),
    ...(preflight?.external_pending || []),
  ];
  return (
    <article className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{pair.sourceName}</h3>
          <p className="text-xs text-slate-500">{pair.clientName}</p>
        </div>
        <StatusBadge
          status={operation?.status || preflight?.status || (pair.error ? "error" : "loading")}
        />
      </div>
      {pair.error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {pair.error}
        </p>
      )}
      {preflight && !operation && (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(preflight.counts).map(([kind, count]) => (
              <span key={kind} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs">
                {count} {DEPENDENCY_LABELS[kind] || kind}
              </span>
            ))}
            {preflight.update_available && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                Update available · {preflight.impact.severity} impact
              </span>
            )}
          </div>
          {issues.map((issue) => (
            <p key={`${issue.kind}:${issue.source_id}`} className="mt-2 flex gap-2 text-xs text-amber-800">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span><strong>{issue.name}:</strong> {issue.message || issue.code}</span>
            </p>
          ))}
          {preflight.impact.severity === "high" && (
            <p className="mt-2 text-xs text-slate-600">
              Treatment Type changed. Existing session and order snapshots remain immutable;
              this confirmation creates an explicit tenant update.
            </p>
          )}
        </>
      )}
      {operation && (
        <>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {operation.steps.map((step) => (
              <div key={step.key} className="rounded-lg border px-3 py-2">
                <p className="text-xs font-medium text-slate-700">
                  {ASSIGNMENT_STEP_LABELS[step.key] || step.key}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">{step.status}</p>
                {step.error_detail && (
                  <p className="mt-1 text-[11px] text-red-600">{step.error_detail}</p>
                )}
              </div>
            ))}
          </div>
          {operation.last_error_detail && (
            <p className="mt-2 text-xs text-red-700">{operation.last_error_detail}</p>
          )}
          <div className="mt-3 flex gap-2">
            {RETRYABLE_OPERATION_STATUSES.has(operation.status) && (
              <button type="button" onClick={props.onRetry} className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium">
                <RefreshCw className="h-3.5 w-3.5" /> Retry failed steps
              </button>
            )}
            {!TERMINAL_OPERATION_STATUSES.has(operation.status) && (
              <button type="button" onClick={props.onCancel} className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium text-red-700">
                <StopCircle className="h-3.5 w-3.5" /> Cancel
              </button>
            )}
          </div>
        </>
      )}
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  const complete = status === OPERATION_STATUS.completed;
  const active = status === OPERATION_STATUS.pending || status === OPERATION_STATUS.running;
  return (
    <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
      complete ? "bg-emerald-100 text-emerald-800" : active ? "bg-sky-100 text-sky-800" : "bg-amber-100 text-amber-800"
    }`}>
      {complete ? <Check className="h-3.5 w-3.5" /> : active ? <Clock3 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
      {status.replaceAll("_", " ")}
    </span>
  );
}
