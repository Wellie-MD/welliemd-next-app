import { useState, useMemo, useCallback } from "react";
import { Search, Users, X, Check, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { useClients } from "@/hooks/useClients";

interface AssignableItem {
  id: string;
  name: string;
  subtitle?: string;
}

interface AssignToClientsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: AssignableItem[];
  itemLabel: string;
  subtitle?: string;
  onAssign: (selectedItemIds: string[], clientIds: string[]) => Promise<{
    success_count: number;
    failure_count: number;
    message: string;
  }>;
}

export function AssignToClientsModal({
  open,
  onOpenChange,
  items,
  itemLabel,
  subtitle,
  onAssign,
}: AssignToClientsModalProps) {
  const { clients, loading: clientsLoading } = useClients("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [itemSearch, setItemSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [result, setResult] = useState<{
    success_count: number;
    failure_count: number;
    message: string;
  } | null>(null);

  const filteredItems = useMemo(() => {
    if (!itemSearch.trim()) return items;
    const q = itemSearch.toLowerCase();
    return items.filter(
      (it) =>
        it.name.toLowerCase().includes(q) ||
        (it.subtitle || "").toLowerCase().includes(q)
    );
  }, [items, itemSearch]);

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const q = clientSearch.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.user?.email || "").toLowerCase().includes(q)
    );
  }, [clients, clientSearch]);

  const toggleItem = useCallback((id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleClient = useCallback((id: string) => {
    setSelectedClients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const canAssign = selectedItems.size > 0 && selectedClients.size > 0 && !assigning;

  const handleAssign = async () => {
    if (!canAssign) return;
    setAssigning(true);
    setResult(null);
    try {
      const res = await onAssign(Array.from(selectedItems), Array.from(selectedClients));
      setResult(res);
      if (res.failure_count === 0) {
        setTimeout(() => {
          handleOpenChange(false);
        }, 1500);
      }
    } catch (err) {
      setResult({
        success_count: 0,
        failure_count: 1,
        message: err instanceof Error ? err.message : "Assignment failed",
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedItems(new Set());
      setSelectedClients(new Set());
      setItemSearch("");
      setClientSearch("");
      setResult(null);
    }
    onOpenChange(newOpen);
  };

  const assignBtnText = canAssign
    ? `Assign ${selectedItems.size} to ${selectedClients.size} client${selectedClients.size > 1 ? "s" : ""}`
    : "Assign";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden gap-0 rounded-2xl border-none shadow-2xl bg-white">
        <DialogTitle className="sr-only">Assign to Clients</DialogTitle>
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50">
              <Users className="h-5 w-5 text-sky-600" />
            </div>
            <div className="text-left">
              <h3 className="text-base font-semibold text-slate-800">
                Assign to Clients
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {subtitle || `Pick ${itemLabel.toLowerCase()}s and the client brands that can offer them.`}
              </p>
            </div>
          </div>
        </div>

        {/* Body — two columns */}
        <div className="flex" style={{ height: 420 }}>
          {/* Left Column: Items with checkboxes + search */}
          <div className="w-2/5 flex flex-col overflow-hidden border-r border-slate-100 bg-slate-50/50">
            <div className="px-5 pb-2 pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {itemLabel}s
                </p>
                <span className="text-xs text-slate-400">
                  {selectedItems.size} selected
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 bg-white">
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder={`Search ${itemLabel.toLowerCase()}s`}
                  className="w-full bg-transparent text-sm outline-none border-none p-0 focus:ring-0 focus:outline-none text-slate-800 placeholder-slate-400"
                />
                {itemSearch && (
                  <button
                    type="button"
                    onClick={() => setItemSearch("")}
                    className="text-slate-400 hover:text-slate-600 outline-none shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-3">
              {filteredItems.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-slate-400">
                  No matches
                </p>
              ) : (
                filteredItems.map((it) => {
                  const isSelected = selectedItems.has(it.id);
                  return (
                    <label
                      key={it.id}
                      className="flex items-start gap-2.5 py-2 px-2 border-b border-slate-100 cursor-pointer hover:bg-white transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItem(it.id)}
                        className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded-md border-slate-300 text-sky-400 focus:ring-sky-400 focus:ring-1 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 leading-tight truncate">
                          {it.name}
                        </p>
                        {it.subtitle && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate">
                            {it.subtitle}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Client Selection */}
          <div className="w-3/5 flex flex-col bg-white">
            <div className="px-5 pb-2 pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Assign to clients
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedClients(new Set(filteredClients.map((c) => c.id)))
                    }
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors outline-none"
                  >
                    All
                  </button>
                  <span className="text-xs text-slate-200">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedClients(new Set())}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors outline-none"
                  >
                    None
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5">
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Search clients by name or email"
                  className="w-full bg-transparent text-sm outline-none border-none p-0 focus:ring-0 focus:outline-none text-slate-800 placeholder-slate-400"
                />
                {clientSearch && (
                  <button
                    type="button"
                    onClick={() => setClientSearch("")}
                    className="text-slate-400 hover:text-slate-600 outline-none shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-3">
              {clientsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : filteredClients.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-slate-400">
                  No matches
                </p>
              ) : (
                filteredClients.map((c) => {
                  const isSelected = selectedClients.has(c.id);
                  const initials = c.name
                    ? c.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "CL";
                  return (
                    <label
                      key={c.id}
                      className="flex items-center gap-3 py-2 px-2 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleClient(c.id)}
                        className="h-[18px] w-[18px] shrink-0 rounded-md border-slate-300 text-sky-400 focus:ring-sky-400 focus:ring-1 cursor-pointer"
                      />
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white bg-slate-800">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {c.name}
                        </p>
                        <p className="truncate text-xs text-slate-400 mt-0.5">
                          {c.user?.email || "-"}
                        </p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
          {result ? (
            <div className="flex items-center gap-2 text-sm">
              {result.failure_count === 0 ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-green-700 font-medium">{result.message}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-amber-700 font-medium">
                    {result.success_count} succeeded, {result.failure_count} failed
                  </span>
                </>
              )}
            </div>
          ) : (
            <span className="text-sm text-slate-500 font-medium">
              {selectedItems.size} {itemLabel.toLowerCase()}
              {selectedItems.size === 1 ? "" : "s"} · {selectedClients.size} client
              {selectedClients.size === 1 ? "" : "s"} selected
            </span>
          )}
          <div className="flex gap-2">
            <DialogClose className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-50 bg-white text-slate-700 outline-none">
              Cancel
            </DialogClose>
            <button
              type="button"
              disabled={!canAssign}
              onClick={handleAssign}
              className="rounded-lg bg-sky-400 hover:bg-sky-500 text-slate-950 px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed outline-none flex items-center gap-2"
            >
              {assigning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                assignBtnText
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
