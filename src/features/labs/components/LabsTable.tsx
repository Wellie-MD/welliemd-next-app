import React, { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, RefreshCw, Trash2, UserPlus } from "lucide-react";
import { type LabPanel } from "@/api/labs";
import { type CombinedLabPanel, type CombinedDerivedStatus } from "@/features/labs/types";
import { getCollectionMethodLabel, renderJunctionStatusBadge } from "@/features/labs/utils";

type AnyPanel = LabPanel | CombinedLabPanel;

function isCombined(panel: AnyPanel): panel is CombinedLabPanel {
  return (panel as CombinedLabPanel).is_combined === true;
}

type StatusFilter = "All" | "Active" | "Pending approval" | "Inactive";

function renderDerivedStatusBadge(s: CombinedDerivedStatus) {
  const map: Record<CombinedDerivedStatus, { label: string; cls: string }> = {
    ready:           { label: "Ready",           cls: "bg-[#dcfce7] text-[#166534] border-[#bbf7d0]" },
    degraded:        { label: "Degraded",         cls: "bg-[#fef3c7] text-[#92400e] border-[#fde68a]" },
    unavailable:     { label: "Unavailable",      cls: "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]" },
    needs_attention: { label: "Needs Attention",  cls: "bg-[#fef3c7] text-[#92400e] border-[#fde68a]" },
    archived:        { label: "Archived",         cls: "bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]" },
  };
  const { label, cls } = map[s] ?? map.unavailable;
  return (
    <span className={`inline-block border px-[10px] py-[3px] rounded-[11px] text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

interface Props {
  labs: LabPanel[];
  combinedPanels?: CombinedLabPanel[];
  assignmentsCount: Record<string, number>;
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (v: StatusFilter) => void;
  selectedRowIds: string[];
  onRowSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onToggleActive: (lab: LabPanel) => Promise<void>;
  onEditOpen: (lab: LabPanel) => void;
  onAssignOpenSingle: (lab: LabPanel) => Promise<void>;
  onAssignOpenCombined?: (combined: CombinedLabPanel) => Promise<void>;
  onArchive: (lab: LabPanel) => Promise<void>;
  onArchiveCombined?: (combined: CombinedLabPanel) => Promise<void>;
}

export default function LabsTable({
  labs,
  combinedPanels = [],
  assignmentsCount,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedRowIds,
  onRowSelect,
  onSelectAll,
  onToggleActive,
  onEditOpen,
  onAssignOpenSingle,
  onAssignOpenCombined,
  onArchive,
  onArchiveCombined,
}: Props) {
  const filtered = useMemo(() => {
    return labs.filter(lab => {
      const q = search.toLowerCase();
      if (
        q &&
        !lab.name.toLowerCase().includes(q) &&
        !lab.lab_provider.toLowerCase().includes(q) &&
        !lab.id.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (statusFilter === "Active") return lab.is_active;
      if (statusFilter === "Pending approval")
        return (
          lab.junction_status === "pending_approval" ||
          lab.junction_status === "Pending"
        );
      if (statusFilter === "Inactive") return !lab.is_active;
      return true;
    });
  }, [labs, search, statusFilter]);

  const allVisible = filtered.length > 0 && filtered.every(l => selectedRowIds.includes(l.id));

  return (
    <>
      {/* Filter bar */}
      <div className="bg-card border border-border/60 rounded-lg p-4 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {(["All", "Active", "Pending approval", "Inactive"] as const).map(s => (
              <button
                key={s}
                onClick={() => onStatusFilterChange(s)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors border ${
                  statusFilter === s
                    ? "bg-blue-50 text-blue-600 border-blue-200"
                    : "bg-white text-muted-foreground hover:text-foreground border-border/60"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              onSearchChange("");
              onStatusFilterChange("All");
            }}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-medium ml-1"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset Filters
          </button>
        </div>

        <div className="relative w-full">
          <svg
            width="14"
            height="14"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <Input
            placeholder="Search labs by name, code, or vendor"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-10 h-10 w-full text-xs placeholder:text-muted-foreground border-border/80"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[50px] text-center">
                <Checkbox
                  checked={allVisible}
                  onCheckedChange={v => onSelectAll(!!v)}
                />
              </TableHead>
              <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground">
                LAB TEST
              </TableHead>
              <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground">
                LAB
              </TableHead>
              <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground">
                PRICE
              </TableHead>
              <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground">
                JUNCTION STATUS
              </TableHead>
              <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground">
                WELLIEMD
              </TableHead>
              <TableHead className="text-right font-semibold text-xs tracking-wider text-muted-foreground pr-6">
                ACTIONS
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(lab => {
              const count = assignmentsCount[lab.id] ?? 0;
              const assignedText =
                count > 0
                  ? ` · Assigned to ${count} client${count > 1 ? "s" : ""}`
                  : "";

              return (
                <TableRow key={lab.id} className="hover:bg-muted/5">
                  <TableCell className="text-center">
                    <Checkbox
                      checked={selectedRowIds.includes(lab.id)}
                      onCheckedChange={v => onRowSelect(lab.id, !!v)}
                    />
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`h-2 w-2 rounded-full inline-block shrink-0 ${
                          lab.is_active ? "bg-[#16a34a]" : "bg-[#94a3b8]"
                        }`}
                      />
                      <div>
                        <div className="font-semibold text-foreground text-[13.5px] flex items-center leading-normal">
                          {lab.name}
                          {lab.required === "required" && (
                            <span
                              className="text-rose-600 ml-1.5 text-[10.5px] select-none align-middle"
                              title="Required"
                            >
                              ●
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {getCollectionMethodLabel(lab.collection_method)}
                          {assignedText}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-[12.5px] font-medium text-foreground">
                    {lab.lab_provider}
                  </TableCell>

                  <TableCell>
                    <div className="text-[12.5px] leading-tight">
                      <span className="font-semibold text-foreground block">
                        ${lab.cost_to_client.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        cost ${lab.cost_to_welliemd.toFixed(2)}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>{renderJunctionStatusBadge(lab.junction_status)}</TableCell>

                  <TableCell>
                    {lab.junction_status === "active" || lab.junction_status === "Active" ? (
                      <button
                        type="button"
                        onClick={() => onToggleActive(lab)}
                        className={`inline-block border px-[10px] py-[3px] rounded-[11px] text-[11px] font-semibold cursor-pointer transition-all duration-150 ${
                          lab.is_active
                            ? "bg-[#dcfce7] text-[#15803d] border-[#bbf7d0] hover:bg-[#bbf7d0]"
                            : "bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0] hover:bg-[#e2e8f0]"
                        }`}
                      >
                        {lab.is_active ? "Enabled" : "Disabled"}
                      </button>
                    ) : (
                      <div className="space-y-0.5">
                        <span className="inline-block border px-[10px] py-[3px] rounded-[11px] text-[11px] font-semibold bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0] opacity-55 cursor-not-allowed">
                          Disabled
                        </span>
                        <div className="text-[10px] text-muted-foreground pl-[10px]">
                          locked
                        </div>
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onAssignOpenSingle(lab)}
                        className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                        title="Open client assignments for Junction status"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEditOpen(lab)}
                        className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit pricing & availability"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onArchive(lab)}
                        className="p-1.5 hover:bg-rose-50 rounded text-rose-500 hover:text-rose-600 transition-colors"
                        title="Archive lab panel"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {filtered.length === 0 && combinedPanels.filter(c => !c.is_archived).length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground text-sm"
                >
                  No labs match your filters.
                </TableCell>
              </TableRow>
            )}

            {/* Combined panel rows */}
            {combinedPanels.filter(c => !c.is_archived).map(combined => {
              const methodSummary = combined.members
                .map(m => getCollectionMethodLabel(m.collection_method))
                .join(" · ");
              const labSummary = [...new Set(combined.members.map(m => m.lab_provider))].join(", ");
              return (
                <TableRow key={combined.id} className="hover:bg-muted/5 bg-sky-50/30">
                  <TableCell className="text-center">
                    <Checkbox
                      checked={selectedRowIds.includes(combined.id)}
                      onCheckedChange={v => onRowSelect(combined.id, !!v)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span className={`h-2 w-2 rounded-full inline-block shrink-0 ${combined.is_active ? "bg-[#16a34a]" : "bg-[#94a3b8]"}`} />
                      <div>
                        <div className="font-semibold text-foreground text-[13.5px] flex items-center gap-1.5 leading-normal">
                          {combined.name}
                          <span className="inline-block border px-[8px] py-[1px] rounded-[8px] text-[9.5px] font-bold bg-sky-50 text-sky-700 border-sky-200">
                            Combined
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{methodSummary}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-[12.5px] font-medium text-muted-foreground">{labSummary}</TableCell>
                  <TableCell>
                    <div className="text-[12.5px] leading-tight">
                      <span className="font-semibold text-foreground block">
                        ${parseFloat(combined.patient_price?.amount ?? "0").toFixed(2)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{renderDerivedStatusBadge(combined.derived_status)}</TableCell>
                  <TableCell>
                    <span className={`inline-block border px-[10px] py-[3px] rounded-[11px] text-[11px] font-semibold ${
                      combined.is_active
                        ? "bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]"
                        : "bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]"
                    }`}>
                      {combined.is_active ? "Enabled" : "Disabled"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-1">
                      {onAssignOpenCombined && (
                        <button
                          onClick={() => onAssignOpenCombined(combined)}
                          className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                          title="Assign combined panel to clients"
                        >
                          <UserPlus className="h-4 w-4" />
                        </button>
                      )}
                      {onArchiveCombined && (
                        <button
                          onClick={() => onArchiveCombined(combined)}
                          className="p-1.5 hover:bg-rose-50 rounded text-rose-500 hover:text-rose-600 transition-colors"
                          title="Archive combined panel"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
