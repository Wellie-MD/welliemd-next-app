import { useState, useMemo } from "react";
import {
  Eye,
  Plus,
  Save,
  List as ListIcon,
  LayoutGrid,
  CheckCircle2,
  Lock,
  Play,
  FileText,
  GitBranch,
  Pill,
  CreditCard,
  Search,
  Check,
  X,
  ChevronRight,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CustomProgram, CustomProgramFlowItem } from "../../types";
import { FlowItemCard } from "./FlowItemCard";
import { PatientFlowTestModal } from "./PatientFlowTestModal";
import { usePrograms, useSections, useConsents } from "../../hooks/useTreatmentLibraries";
import { createMockId } from "../../data/factories";

interface CustomProgramFlowBuilderProps {
  customProgram: CustomProgram;
  onOpenDrawer?: () => void;
  onSave?: (updated: CustomProgram) => void;
  onUpdateFlow?: (updatedItems: CustomProgramFlowItem[]) => void;
}

export function CustomProgramFlowBuilder({
  customProgram,
  onOpenDrawer,
  onSave,
  onUpdateFlow,
}: CustomProgramFlowBuilderProps) {
  const [viewMode, setViewMode] = useState<"list" | "flow">("flow");
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // Slug editing states
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [slugInput, setSlugInput] = useState(customProgram.slug);

  // Fetch lists for Flow view sidebar
  const { data: programs = [] } = usePrograms();
  const { data: sections = [] } = useSections();
  const { data: consents = [] } = useConsents();

  // Aggregate all library items
  const allLibraryItems = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      kind: "program" | "section" | "consent";
      visitTypeKey?: string;
    }> = [];

    sections.forEach((s) => {
      list.push({ id: s.id, name: s.name, kind: "section" });
    });

    programs.forEach((p) => {
      list.push({ id: p.id, name: p.name, kind: "program", visitTypeKey: p.visitType });
    });

    consents.forEach((c) => {
      list.push({ id: c.id, name: c.name, kind: "consent" });
    });

    return list;
  }, [programs, sections, consents]);

  // Check if library item is currently in the custom program flow
  const isItemInFlow = (item: typeof allLibraryItems[0]) => {
    return customProgram.flowItems.some(
      (fi) => fi.kind === item.kind && fi.sourceId === item.id
    );
  };

  // Sidebar states
  const [sidebarFilter, setSidebarFilter] = useState<"all" | "in_flow" | "unused">("all");
  const [sidebarSearch, setSidebarSearch] = useState("");

  const filteredLibraryItems = useMemo(() => {
    return allLibraryItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
        item.kind.toLowerCase().includes(sidebarSearch.toLowerCase());
      if (!matchesSearch) return false;

      const inFlow = isItemInFlow(item);
      if (sidebarFilter === "in_flow") return inFlow;
      if (sidebarFilter === "unused") return !inFlow;
      return true;
    });
  }, [allLibraryItems, sidebarSearch, sidebarFilter, customProgram.flowItems]);

  const handleToggleItemInFlow = (item: typeof allLibraryItems[0]) => {
    if (!onUpdateFlow) return;

    const added = isItemInFlow(item);
    if (added) {
      // Remove item
      const updated = customProgram.flowItems.filter(
        (fi) => !(fi.kind === item.kind && fi.sourceId === item.id)
      );
      onUpdateFlow(updated);
    } else {
      // Add item (inserts before the locked Checkout/Consent items)
      const newItem: CustomProgramFlowItem = {
        id: createMockId(item.kind),
        kind: item.kind,
        title: item.name,
        subtitle:
          item.kind === "section"
            ? "Common medical section."
            : item.kind === "program"
            ? "Eligibility program."
            : "Consent form.",
        treatmentTypeKey: item.visitTypeKey,
        sourceId: item.id,
      };

      const items = [...customProgram.flowItems];
      let insertIdx = items.length;
      for (let i = items.length - 1; i >= 0; i--) {
        if (items[i].kind === "checkout" || items[i].kind === "consent") {
          insertIdx = i;
        } else {
          break;
        }
      }
      items.splice(insertIdx, 0, newItem);
      onUpdateFlow(items);
    }
  };

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);

  const handleSidebarDragStart = (e: React.DragEvent, item: typeof allLibraryItems[0]) => {
    setIsDraggingSidebar(true);
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        isNewItem: true,
        kind: item.kind,
        title: item.name,
        visitTypeKey: item.visitTypeKey,
        sourceId: item.id,
      })
    );
  };

  const handleSidebarDragEnd = () => {
    setIsDraggingSidebar(false);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (customProgram.flowItems[index]?.locked) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ draggedIndex: index })
    );
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (customProgram.flowItems[index]?.locked) return;
    e.preventDefault();
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const getTargetIndexForId = (itemId: string): number => {
    const idx = customProgram.flowItems.findIndex((fi) => fi.id === itemId);
    if (idx !== -1) return idx;

    if (itemId === "sys-start" || itemId === "sys-auth") {
      return 0;
    }
    if (itemId === "sys-matched") {
      const sectionIdx = customProgram.flowItems.findIndex((fi) => fi.kind === "section");
      if (sectionIdx !== -1) return sectionIdx;
      
      const progIdx = customProgram.flowItems.findIndex((fi) => fi.kind === "program");
      if (progIdx !== -1) return progIdx;

      const checkoutIdx = customProgram.flowItems.findIndex((fi) => fi.kind === "checkout");
      return checkoutIdx !== -1 ? checkoutIdx : customProgram.flowItems.length;
    }
    if (itemId === "sys-recommended") {
      const checkoutIdx = customProgram.flowItems.findIndex((fi) => fi.kind === "checkout");
      return checkoutIdx !== -1 ? checkoutIdx : customProgram.flowItems.length;
    }
    if (itemId === "sys-checkout") {
      const checkoutIdx = customProgram.flowItems.findIndex((fi) => fi.kind === "checkout");
      return checkoutIdx !== -1 ? checkoutIdx : customProgram.flowItems.length;
    }

    return customProgram.flowItems.length;
  };

  const handleInsertItem = (rawData: string, targetIndex: number) => {
    try {
      const data = JSON.parse(rawData);
      if (data && data.isNewItem) {
        // Drop new item from sidebar
        const newItem: CustomProgramFlowItem = {
          id: createMockId(data.kind),
          kind: data.kind,
          title: data.title,
          subtitle:
            data.kind === "section"
              ? "Common medical section."
              : data.kind === "program"
              ? "Eligibility program."
              : "Consent form.",
          treatmentTypeKey: data.visitTypeKey,
          sourceId: data.sourceId,
        };

        const items = [...customProgram.flowItems];
        const checkoutIdx = items.findIndex((i) => i.kind === "checkout");
        let insertAt = targetIndex;
        if (checkoutIdx >= 0 && insertAt > checkoutIdx) {
          insertAt = checkoutIdx;
        }
        items.splice(insertAt, 0, newItem);
        if (onUpdateFlow) onUpdateFlow(items);
      } else if (typeof data.draggedIndex === "number") {
        // Reordering existing item
        const sourceIdx = data.draggedIndex;
        if (sourceIdx === targetIndex) return;

        const items = [...customProgram.flowItems];
        const draggedItem = items[sourceIdx];
        
        // Remove from source
        items.splice(sourceIdx, 1);
        
        // Adjust target index if source was before target
        let insertAt = targetIndex;
        if (sourceIdx < targetIndex) {
          insertAt = targetIndex - 1;
        }

        const checkoutIdx = items.findIndex((i) => i.kind === "checkout");
        if (checkoutIdx >= 0 && insertAt > checkoutIdx) {
          insertAt = checkoutIdx;
        }

        items.splice(insertAt, 0, draggedItem);
        if (onUpdateFlow) onUpdateFlow(items);
      }
    } catch (err) {
      console.error("Failed to insert item:", err);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (customProgram.flowItems[targetIndex]?.locked) return;

    const rawData = e.dataTransfer.getData("text/plain");
    if (rawData) {
      handleInsertItem(rawData, targetIndex);
    }
  };

  const handleDropOnArrow = (e: React.DragEvent, afterItemId: string) => {
    e.preventDefault();
    const rawData = e.dataTransfer.getData("text/plain");
    if (rawData) {
      const targetIndex = getTargetIndexForId(afterItemId) + 1;
      handleInsertItem(rawData, targetIndex);
    }
  };

  const handleCanvasContainerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const rawData = e.dataTransfer.getData("text/plain");
    if (rawData) {
      const checkoutIdx = customProgram.flowItems.findIndex((i) => i.kind === "checkout");
      const targetIndex = checkoutIdx !== -1 ? checkoutIdx : customProgram.flowItems.length;
      handleInsertItem(rawData, targetIndex);
    }
  };

  const handleMoveItem = (index: number, direction: "up" | "down") => {
    if (!onUpdateFlow) return;
    const items = [...customProgram.flowItems];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    // Swap
    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;

    onUpdateFlow(items);
  };

  const handleDeleteItem = (index: number) => {
    if (!onUpdateFlow) return;
    const items = [...customProgram.flowItems];
    items.splice(index, 1);
    onUpdateFlow(items);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(customProgram);
    }
  };

  const handleStartEditSlug = () => {
    setSlugInput(customProgram.slug);
    setIsEditingSlug(true);
  };

  const handleSaveSlug = () => {
    if (onSave) {
      onSave({
        ...customProgram,
        slug: slugInput,
      });
    }
    setIsEditingSlug(false);
  };

  // Flowchart Layout Classification
  const flowItems = customProgram.flowItems || [];
  const routingItems = flowItems.filter((i) => i.kind === "routing_question");
  const sectionItems = flowItems.filter((i) => i.kind === "section");
  const programItems = flowItems.filter((i) => i.kind === "program");
  const consentItems = flowItems.filter((i) => i.kind === "consent");

  const getConsentScope = (name: string) => {
    const consentForm = consents.find((c) => c.name === name);
    return consentForm?.scope || "global";
  };
  const getConsentVisitTypeKeys = (name: string) => {
    const consentForm = consents.find((c) => c.name === name);
    return consentForm?.visitTypeKeys || [];
  };

  const universalConsents = consentItems.filter(
    (c) => getConsentScope(c.title) !== "treatment"
  );
  const treatmentSpecificConsents = consentItems.filter(
    (c) => getConsentScope(c.title) === "treatment"
  );

  const tracks = useMemo(() => {
    return programItems.map((prog) => {
      const visitTypeKeys = prog.treatmentTypeKey ? [prog.treatmentTypeKey] : [];
      const trackConsents = treatmentSpecificConsents.filter((c) => {
        const vts = getConsentVisitTypeKeys(c.title);
        return vts.some((vt) => vt === prog.treatmentTypeKey);
      });

      return {
        treatmentName: prog.title.replace(/ Intake$/, ""),
        visitTypes: visitTypeKeys,
        items: [
          prog,
          ...trackConsents,
        ],
      };
    });
  }, [programItems, treatmentSpecificConsents, consents]);

  const preFan = useMemo(() => {
    return [
      { id: "sys-start", kind: "start" as const, title: "Start", subtitle: "Patient enters", isStart: true },
      { id: "sys-auth", kind: "authentication" as const, title: "Sign in / Sign up", subtitle: "Authentication", isSystem: true },
      ...routingItems,
      { id: "sys-matched", kind: "matched_summary" as const, title: "Matched Summary", subtitle: "Multi-select", isSystem: true },
      ...sectionItems,
    ];
  }, [routingItems, sectionItems]);

  const postFan = useMemo(() => {
    return [
      ...universalConsents,
      { id: "sys-recommended", kind: "recommended_products" as const, title: "Recommended Products", subtitle: "Auto - per treatment", isSystem: true },
      { id: "sys-checkout", kind: "checkout" as const, title: "Checkout", subtitle: "Locked", isEnd: true },
    ];
  }, [universalConsents]);

  const renderCanvasChip = (item: {
    id: string;
    kind: string;
    title: string;
    subtitle?: string;
    isSystem?: boolean;
    isStart?: boolean;
    isEnd?: boolean;
  }) => {
    const isDraggable = !item.isSystem && !item.isStart && !item.isEnd;
    const realIndex = customProgram.flowItems.findIndex((fi) => fi.id === item.id);

    let cardClass =
      "w-[160px] p-3 rounded-xl border flex flex-col gap-1.5 shadow-sm shrink-0 min-h-[76px] justify-between transition-all duration-150";
    let typeLabel = "System";
    let typeIcon = <CheckCircle2 className="h-3 w-3" />;

    if (item.isStart || item.isEnd) {
      cardClass += " bg-slate-900 border-slate-900 text-white";
      typeLabel = "System";
      typeIcon = <Play className="h-3 w-3 text-slate-400" />;
    } else if (item.isSystem) {
      cardClass += " bg-slate-50 border-slate-200 border-dashed text-slate-700";
      typeLabel = "System";
      typeIcon = <Lock className="h-3 w-3 text-slate-400" />;
    } else if (item.kind === "section") {
      cardClass += " bg-sky-50 border-sky-200 text-sky-900";
      typeLabel = "Section";
      typeIcon = <LayoutGrid className="h-3 w-3 text-sky-400" />;
    } else if (item.kind === "program") {
      cardClass += " bg-emerald-50 border-emerald-200 text-emerald-900";
      typeLabel = "Program";
      typeIcon = <CheckCircle2 className="h-3 w-3 text-emerald-400" />;
    } else if (item.kind === "consent") {
      cardClass += " bg-purple-50 border-purple-200 text-purple-900";
      typeLabel = "Consent";
      typeIcon = <FileText className="h-3 w-3 text-purple-400" />;
    } else if (item.kind === "routing_question") {
      cardClass += " bg-orange-50 border-orange-200 text-orange-900";
      typeLabel = "Routing";
      typeIcon = <GitBranch className="h-3 w-3 text-orange-400" />;
    }

    if (isDraggable) {
      cardClass += " cursor-grab active:cursor-grabbing hover:border-slate-400 hover:shadow-md select-none";
    }

    return (
      <div
        className={cardClass}
        key={item.id}
        draggable={isDraggable}
        onDragStart={(e) => {
          if (realIndex !== -1) {
            handleDragStart(e, realIndex);
          } else {
            e.preventDefault();
          }
        }}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.stopPropagation();
          const rawData = e.dataTransfer.getData("text/plain");
          if (rawData) {
            const targetIdx = getTargetIndexForId(item.id);
            handleInsertItem(rawData, targetIdx);
          }
        }}
      >
        <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider opacity-85">
          {typeIcon}
          <span>{typeLabel}</span>
        </div>
        <div className="text-[11.5px] font-bold leading-snug line-clamp-2">
          {item.title}
        </div>
        <div className="text-[9.5px] opacity-65 truncate leading-none">
          {item.subtitle}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shrink-0">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">{customProgram.name}</h1>
            </div>
            <div className="mt-2 flex items-center gap-3 text-sm">
              {isEditingSlug ? (
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-slate-600 border border-slate-200">
                    <span className="text-slate-400">welliemd.com/start/</span>
                    <input
                      type="text"
                      className="font-semibold text-slate-900 bg-transparent outline-none w-32 border-b border-[#12517A]"
                      value={slugInput}
                      onChange={(e) => setSlugInput(e.target.value)}
                    />
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:text-emerald-700" onClick={handleSaveSlug}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-600 hover:text-rose-700" onClick={handleCancelEditSlug}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-2 rounded-md bg-slate-50 px-2 py-1 text-slate-600 border border-slate-200">
                    <span className="text-slate-400">welliemd.com/start/</span>
                    <span className="font-semibold text-slate-900">{customProgram.slug}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleStartEditSlug}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsTestModalOpen(true)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-500 max-w-2xl">
              Drag any item to reorder. Add new items anywhere from the side panel. Authentication and Checkout are locked in place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 md:justify-end">
            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "list" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <ListIcon className="mr-2 h-4 w-4" />
                List
              </button>
              <button
                onClick={() => setViewMode("flow")}
                className={`flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "flow" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                Flow
              </button>
            </div>
            <Button
              variant="secondary"
              className="bg-[#12517A] text-white hover:bg-[#12517A]/90"
              onClick={onOpenDrawer}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add to flow
            </Button>
            <Button variant="outline" onClick={() => setIsTestModalOpen(true)}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button onClick={handleSave} className="bg-[#12517A] text-white hover:bg-[#12517A]/90">
              <Save className="mr-2 h-4 w-4" />
              Save Plan
            </Button>
          </div>
        </div>
      </div>

      <PatientFlowTestModal
        open={isTestModalOpen}
        onOpenChange={setIsTestModalOpen}
        previewContext={{
          mode: "custom_program",
          id: customProgram.id,
          slug: customProgram.slug,
          title: customProgram.name,
        }}
      />

      {viewMode === "list" && (
        <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-6 overflow-y-auto">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-200"></div>
              <div className="text-sm font-semibold uppercase tracking-wider text-slate-500">Patient flow</div>
              <div className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                {customProgram.flowItems.length} items
              </div>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            <div className="space-y-3">
              {customProgram.flowItems.map((item, index) => (
                <FlowItemCard
                  key={item.id}
                  item={item}
                  onDelete={() => handleDeleteItem(index)}
                  onMoveUp={() => handleMoveItem(index, "up")}
                  onMoveDown={() => handleMoveItem(index, "down")}
                  isFirst={index === 0 || customProgram.flowItems[index - 1]?.locked}
                  isLast={index === customProgram.flowItems.length - 1 || customProgram.flowItems[index + 1]?.locked}
                  draggable={!item.locked}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, index)}
                />
              ))}
            </div>

            {!customProgram.flowItems.some((item) => item.kind === "checkout") && (
              <>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-slate-200"></div>
                  <div className="text-sm font-semibold uppercase tracking-wider text-slate-500">End of flow</div>
                  <div className="flex-1 h-px bg-slate-200"></div>
                </div>

                <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm opacity-80">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">Checkout</h3>
                      <div className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        <Lock className="h-3 w-3" /> Locked
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Patient confirms routed product, selects subscription length, completes payment. System exit point — can't be reordered.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {viewMode === "flow" && (
        <div className="flex-1 grid grid-cols-[280px_1fr] gap-4 min-h-[500px] overflow-hidden">
          {/* Left Sidebar: Library Items Search & Filter */}
          <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm">Items</h2>
              <div className="mt-3 relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or type"
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 pl-8 pr-3 py-2 outline-none focus:border-[#12517A] bg-slate-50 focus:bg-white transition-colors"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-1.5 mt-3">
                {(["all", "in_flow", "unused"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSidebarFilter(filter)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors border ${
                      sidebarFilter === filter
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {filter === "all" ? "All" : filter === "in_flow" ? "In flow" : "Unused"}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Library List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1 bg-slate-50/50">
              {filteredLibraryItems.map((item) => {
                const checked = isItemInFlow(item);
                return (
                  <div
                    key={`${item.kind}-${item.id}`}
                    onClick={() => handleToggleItemInFlow(item)}
                    draggable={true}
                    onDragStart={(e) => handleSidebarDragStart(e, item)}
                    onDragEnd={handleSidebarDragEnd}
                    className="flex items-center justify-between p-2 rounded-lg border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/80 cursor-grab active:cursor-grabbing hover:shadow-sm transition-all duration-150"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}} // handled by row onClick
                        className="h-3.5 w-3.5 rounded border-slate-300 text-[#12517A] focus:ring-[#12517A]"
                      />
                      <span className="text-[11.5px] font-semibold text-slate-700 truncate">
                        {item.name}
                      </span>
                    </div>

                    <span
                      className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded border ${
                        item.kind === "section"
                          ? "bg-sky-50 border-sky-100 text-sky-700"
                          : item.kind === "program"
                          ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                          : "bg-purple-50 border-purple-100 text-purple-700"
                      }`}
                    >
                      {item.kind.toUpperCase()}
                    </span>
                  </div>
                );
              })}
              {filteredLibraryItems.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400 italic">
                  No items matched search criteria.
                </div>
              )}
            </div>

            {/* Sidebar Footer count + create action */}
            <div className="p-3 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
              <span className="text-[11px] font-semibold text-slate-500">
                {filteredLibraryItems.length} items
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs border-slate-200 text-[#12517A] hover:bg-slate-50"
                onClick={onOpenDrawer}
              >
                <Plus className="mr-1.5 h-3 w-3" />
                Create new
              </Button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex flex-col rounded-xl border border-slate-200 bg-slate-50 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-sm">Patient Flow</h2>
                <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  Stage View
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs bg-[#0f766e] text-white hover:bg-[#0f766e]/90 border-[#0f766e] hover:border-[#0f766e]"
                  onClick={() => setIsTestModalOpen(true)}
                >
                  <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                  Simulate a patient
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs text-slate-700" onClick={onOpenDrawer}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add item
                </Button>
                <Button size="sm" className="h-8 text-xs bg-[#12517A] hover:bg-[#12517A]/90 text-white" onClick={handleSave}>
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Save
                </Button>
              </div>
            </div>

            {/* Horizontal Diagram Canvas */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleCanvasContainerDrop}
              className="flex-1 p-6 overflow-auto flex items-center justify-start min-w-0 bg-[#f8fafc]"
            >
              <div className="flex items-center gap-3 py-10 pl-4 pr-10">
                
                {/* Pre-Fan Chain */}
                {preFan.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3">
                    {idx > 0 && (
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropOnArrow(e, preFan[idx - 1].id)}
                        className="w-6 h-[2px] bg-slate-300 shrink-0 relative hover:bg-blue-500 hover:h-[4px] cursor-pointer transition-all after:content-[''] after:absolute after:right-[-2px] after:top-[-3px] after:border-t-[4px] after:border-t-transparent after:border-b-[4px] after:border-b-transparent after:border-l-[5px] after:border-l-slate-300"
                        title="Drop here to insert"
                      ></div>
                    )}
                    {renderCanvasChip(item)}
                  </div>
                ))}

                {/* Vertical Fan-Out Column of Tracks */}
                {tracks.length > 0 && (
                  <div className="flex items-center">
                    {/* Left Split Junction Line */}
                    <div className="relative w-6 shrink-0 h-full min-h-[40px] flex items-center justify-center">
                      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[2px] bg-slate-300"></div>
                      {tracks.length > 1 && (
                        <div className={`absolute right-0 w-[2px] bg-slate-300 ${tracks.length === 2 ? "top-[46px] bottom-[46px]" : "top-[54px] bottom-[54px]"}`}></div>
                      )}
                    </div>

                    {/* The Track Columns */}
                    <div className="flex flex-col gap-8">
                      {tracks.map((track, trackIdx) => (
                        <div key={trackIdx} className="relative flex items-center gap-3">
                          {/* Split row connector line */}
                          <div className="w-4 h-[2px] bg-slate-300 shrink-0"></div>

                          {/* Track Name Label */}
                          <div className="absolute -top-4 left-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <span>{track.treatmentName}</span>
                            {track.visitTypes.map((vt) => (
                              <span key={vt} className="px-1.5 py-px rounded bg-slate-100 text-[8px] font-bold border border-slate-200 normal-case text-slate-500">
                                {vt}
                              </span>
                            ))}
                          </div>

                          {/* Track items chain */}
                          {track.items.map((item, itemIdx) => (
                            <div key={item.id} className="flex items-center gap-3">
                              {itemIdx > 0 && (
                                <div
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => handleDropOnArrow(e, track.items[itemIdx - 1].id)}
                                  className="w-6 h-[2px] bg-slate-300 shrink-0 relative hover:bg-blue-500 hover:h-[4px] cursor-pointer transition-all after:content-[''] after:absolute after:right-[-2px] after:top-[-3px] after:border-t-[4px] after:border-t-transparent after:border-b-[4px] after:border-b-transparent after:border-l-[5px] after:border-l-slate-300"
                                  title="Drop here to insert"
                                ></div>
                              )}
                              {renderCanvasChip(item)}
                            </div>
                          ))}

                          {/* Merge row connector line */}
                          <div className="w-4 h-[2px] bg-slate-300 shrink-0"></div>
                        </div>
                      ))}
                    </div>

                    {/* Right Merge Junction Line */}
                    <div className="relative w-6 shrink-0 h-full min-h-[40px] flex items-center justify-center">
                      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[2px] bg-slate-300"></div>
                      {tracks.length > 1 && (
                        <div className={`absolute left-0 w-[2px] bg-slate-300 ${tracks.length === 2 ? "top-[46px] bottom-[46px]" : "top-[54px] bottom-[54px]"}`}></div>
                      )}
                      {/* arrowhead pointing to universal consents */}
                      <div className="absolute right-[-2px] top-1/2 -translate-y-1/2 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[5px] border-l-slate-300"></div>
                    </div>
                  </div>
                )}

                {/* Arrow connector from Fan-Out to Post-Fan */}
                {tracks.length === 0 && (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      if (preFan.length > 0) {
                        handleDropOnArrow(e, preFan[preFan.length - 1].id);
                      }
                    }}
                    className="w-6 h-[2px] bg-slate-300 shrink-0 relative hover:bg-blue-500 hover:h-[4px] cursor-pointer transition-all after:content-[''] after:absolute after:right-[-2px] after:top-[-3px] after:border-t-[4px] after:border-t-transparent after:border-b-[4px] after:border-b-transparent after:border-l-[5px] after:border-l-slate-300"
                  ></div>
                )}

                {/* Post-Fan Chain */}
                {postFan.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3">
                    {idx > 0 && (
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropOnArrow(e, postFan[idx - 1].id)}
                        className="w-6 h-[2px] bg-slate-300 shrink-0 relative hover:bg-blue-500 hover:h-[4px] cursor-pointer transition-all after:content-[''] after:absolute after:right-[-2px] after:top-[-3px] after:border-t-[4px] after:border-t-transparent after:border-b-[4px] after:border-b-transparent after:border-l-[5px] after:border-l-slate-300"
                        title="Drop here to insert"
                      ></div>
                    )}
                    {renderCanvasChip(item)}
                  </div>
                ))}

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
