import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogClose } from "@radix-ui/react-dialog";
import { History, Loader2, X } from "lucide-react";
import type { LabChangeAction, LabChangeHistoryResponse, LabChangeLogEntry } from "@/api/labs";

export type ChangeHistoryAction = LabChangeAction;
export type ChangeHistoryRecordType = "product" | "supply" | "lab";

export interface ChangeHistoryEntry {
  id?: string;
  action: ChangeHistoryAction;
  field: string;
  from: string;
  to: string;
  user: string;
  role: string;
  ts: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordName: string;
  recordType: ChangeHistoryRecordType;
  history?: LabChangeHistoryResponse | null;
  loading?: boolean;
  error?: string | null;
  filter?: "all" | ChangeHistoryAction;
  onFilterChange?: (filter: "all" | ChangeHistoryAction) => void;
}

function formatHistoryDate(ts: string): string {
  if (!ts) return "";
  const date = new Date(ts);
  if (isNaN(date.getTime())) {
    const m = /^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}):(\d{2})$/.exec(ts);
    if (!m) return ts;
    let h = parseInt(m[2], 10);
    const min = m[3];
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return `${m[1]} ${h}:${min} ${ampm}`;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${year}-${month}-${day} ${hours}:${minutes} ${ampm}`;
}

function ActionIcon({ action }: { action: ChangeHistoryAction }) {
  if (action === "created")
    return (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="p-0.5">
        <path d="M12 5v14m-7-7h14" />
      </svg>
    );
  if (action === "status")
    return (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="p-0.5">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    );
  if (action === "deleted")
    return (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="p-0.5">
        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    );
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="p-0.5">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function actionLabel(entry: { action: ChangeHistoryAction; field: string }): string {
  if (entry.action === "created") return "Record created";
  if (entry.action === "status") return "Status changed";
  if (entry.action === "deleted") return "Record archived";
  return `Updated ${entry.field || "field"}`;
}

function typeLabel(t: ChangeHistoryRecordType): string {
  return ({ product: "Medicine / Product", supply: "Supply", lab: "Lab" })[t] || "Record";
}

export default function LabChangeHistoryModal({
  open,
  onOpenChange,
  recordName,
  recordType,
  history,
  loading = false,
  error = null,
  filter = "all",
  onFilterChange,
}: Props) {
  const [internalFilter, setInternalFilter] = useState<"all" | ChangeHistoryAction>("all");
  const activeFilter = onFilterChange ? filter : internalFilter;

  const entries: ChangeHistoryEntry[] = useMemo(() => {
    if (history?.results) {
      return history.results.map((r: LabChangeLogEntry) => ({
        id: r.id,
        action: r.action,
        field: r.field_label || r.field_name,
        from: r.old_display || "",
        to: r.new_display || "",
        user: r.changed_by_name || "System",
        role: r.changed_by_role || "Admin",
        ts: r.changed_at,
      }));
    }
    return [];
  }, [history]);

  const totalCount = history?.total_changes ?? entries.length;

  const filteredEntries = useMemo(() => {
    if (activeFilter === "all") return entries;
    return entries.filter((e) => e.action === activeFilter);
  }, [entries, activeFilter]);

  const handleFilterChange = (val: "all" | ChangeHistoryAction) => {
    if (onFilterChange) {
      onFilterChange(val);
    } else {
      setInternalFilter(val);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="!bg-black/40"
        showClose={false}
        className="max-w-[760px] max-h-[calc(100vh-24px)] overflow-hidden gap-0 rounded-lg border-none p-0 shadow-[0_10px_25px_rgba(0,0,0,0.2)] bg-white"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex-1 text-left">
            <h3 className="text-lg font-semibold text-slate-800">Change History</h3>
            <p className="mt-0.5 text-[13px] font-normal text-slate-400">
              Audit trail of every change made to this{" "}
              {recordType === "lab" ? "lab panel" : recordType}.
            </p>
          </div>
          <DialogClose className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 outline-none transition-colors hover:bg-slate-100 hover:text-slate-600">
            <X className="h-[18px] w-[18px]" />
          </DialogClose>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
          <div className="mb-[18px] flex flex-wrap items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
            <span className="text-[11.5px] text-slate-400">
              Record: <b className="font-semibold text-slate-700">{history?.record?.name || recordName || "—"}</b>
            </span>
            <span className="text-[11.5px] text-slate-400">
              Type: <b className="font-semibold text-slate-700">{history?.record?.type || typeLabel(recordType)}</b>
            </span>
            <span className="text-[11.5px] text-slate-400">
              Total changes: <b className="font-semibold text-slate-700">{totalCount}</b>
            </span>
          </div>

          <div className="mb-4 flex flex-col items-stretch gap-2">
            <label className="text-[11px] font-semibold tracking-[0.03em] text-slate-400">FILTER</label>
            <select
              value={activeFilter}
              onChange={(e) => handleFilterChange(e.target.value as typeof activeFilter)}
              className="h-[38px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
            >
              <option value="all">All activity</option>
              <option value="created">Created</option>
              <option value="updated">Field updates</option>
              <option value="status">Status changes</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-sm text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-sky-500" />
              Loading change history...
            </div>
          ) : error ? (
            <div className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <History className="mx-auto mb-2 h-[34px] w-[34px] opacity-60" />
              <div className="text-[13px] font-medium">No changes match this filter</div>
            </div>
          ) : (
            <div className="relative pl-[26px] before:absolute before:bottom-1.5 before:left-2 before:top-1.5 before:w-0.5 before:bg-slate-200">
              <div className="space-y-5">
                {filteredEntries.map((e, idx) => (
                  <div key={e.id || idx} className="relative">
                    <span
                      className={`absolute -left-[26px] top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 bg-white ${
                        e.action === "created"
                          ? "border-green-600 text-green-600"
                          : e.action === "status"
                            ? "border-amber-600 text-amber-600"
                            : e.action === "deleted"
                              ? "border-red-600 text-red-600"
                              : "border-blue-700 text-blue-700"
                      }`}
                    >
                      <ActionIcon action={e.action} />
                    </span>
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                      <span className="text-[13px] font-semibold text-slate-800">
                        {actionLabel(e)}
                      </span>
                      <span className="whitespace-nowrap font-mono text-[11.5px] text-slate-400">
                        {formatHistoryDate(e.ts)}
                      </span>
                    </div>
                    <div className="mb-1.5 text-[11.5px] text-slate-400">
                      by <b className="font-semibold text-slate-700">{e.user}</b>
                      {e.role ? ` · ${e.role}` : ""}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs">
                      <span className="min-w-[110px] font-semibold text-slate-700">
                        {e.field}
                      </span>
                      {e.action !== "created" && e.from ? (
                        <>
                          <span className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-red-800">
                            {e.from}
                          </span>
                          <span className="text-slate-400">→</span>
                        </>
                      ) : null}
                      <span className="rounded border border-green-200 bg-green-50 px-1.5 py-0.5 text-green-800">
                        {e.to}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}