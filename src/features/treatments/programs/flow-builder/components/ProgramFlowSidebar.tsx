import { useMemo, useState } from "react";
import { Search, Lock, Flag, ChevronUp, MoreHorizontal, Grid2X2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { ProgramQuestion } from "../../../types";

type FlowElement = {
  id: string;
  label: string;
  typeBadge: string;
  isSystem: boolean;
  index?: number;
};

interface ProgramFlowSidebarProps {
  questions: ProgramQuestion[];
  onSelectNode: (nodeId: string) => void;
  activeNodeId?: string | null;
}

export function ProgramFlowSidebar({
  questions,
  onSelectNode,
  activeNodeId,
}: ProgramFlowSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const flowElements = useMemo<FlowElement[]>(() => {
    const sortedQuestions = [...questions].sort(
      (a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER)
    );

    return [
      {
        id: "start",
        label: "Start",
        typeBadge: "START",
        isSystem: true,
      },
      {
        id: "auth",
        label: "Patient Authentication",
        typeBadge: "SIGN IN / SIGN UP",
        isSystem: true,
      },
      ...sortedQuestions.map((question, index) => ({
        id: question.id,
        label: question.text || "(untitled question)",
        typeBadge: "QUESTION",
        isSystem: false,
        index: index + 1,
      })),
      {
        id: "consent",
        label: "Consents",
        typeBadge: `CONSENT`,
        isSystem: true,
      },
      {
        id: "checkout",
        label: "Checkout",
        typeBadge: `CHECKOUT`,
        isSystem: true,
      },
      {
        id: "end",
        label: "Complete",
        typeBadge: "END",
        isSystem: true,
      },
    ];
  }, [questions]);

  const filteredElements = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return flowElements;

    return flowElements.filter(
      (element) =>
        element.label.toLowerCase().includes(query) ||
        element.typeBadge.toLowerCase().includes(query)
    );
  }, [flowElements, searchQuery]);

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white">
      {/* ── Header ── */}
      <div className="flex h-10 items-center justify-between border-b border-slate-200 px-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold tracking-tight text-slate-900">Items</h3>
        </div>
        <div className="flex items-center gap-1">
          <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
          <MoreHorizontal className="h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* ── Search ── */}
      <div className="border-b border-slate-200 px-3 py-2.5">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by name or type"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-8 rounded-md border-slate-200 bg-white pl-8 text-[12.5px] focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-100"
          />
        </div>
      </div>

      {/* ── Section label ── */}
      <div className="px-3 pt-3 pb-1.5">
        <span className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.05em] text-slate-400">
          <Grid2X2 className="h-3 w-3" />
          Flow Elements
        </span>
      </div>

      {/* ── Items list ── */}
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        <div className="space-y-0.5">
          {filteredElements.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-2 py-3 text-center text-[11px] italic text-slate-400 mt-2">
              No flow elements match search
            </div>
          ) : (
            filteredElements.map((element) => {
              const isActive = activeNodeId === element.id;

              return (
                <button
                  key={element.id}
                  type="button"
                  onClick={() => onSelectNode(element.id)}
                  className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-all duration-100 ${
                    isActive
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  {/* Left indicator: lock icon for system, numbered circle for questions */}
                  <span
                    className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                      isActive
                        ? (element.isSystem
                          ? "bg-blue-100 text-blue-600"
                          : "bg-blue-100 text-blue-600 border border-blue-200")
                        : "bg-white border border-slate-200 text-slate-500"
                    }`}
                  >
                    {element.isSystem ? (
                      element.id === "start" || element.id === "end" ? (
                        <Flag className="h-2.5 w-2.5" />
                      ) : (
                        <Lock className="h-2.5 w-2.5" />
                      )
                    ) : (
                      String(element.index)
                    )}
                  </span>

                  {/* Label */}
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium leading-tight">
                    {element.label}
                  </span>

                  {/* Type label */}
                  <span className="shrink-0 text-[9.5px] font-medium uppercase tracking-[0.04em] text-slate-400">
                    {element.typeBadge}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Bottom count ── */}
      <div className="flex h-8 items-center justify-between border-t border-slate-200 bg-white px-3">
        <span className="text-[11px] font-bold text-slate-800">{flowElements.length}</span>
        <span className="text-[10px] text-slate-400">⌄</span>
      </div>
    </aside>
  );
}
