import { useCallback, useMemo, useState } from "react";
import type { CustomProgram, CustomProgramFlowItem } from "../types";
import { useConsents, usePrograms, useSections } from "./useTreatmentLibraries";
import { buildFlowItem, findDefaultInsertIndex, isSidebarDragPayload, parseDragPayload, type ExistingDragPayload, type SidebarDragPayload } from "../utils/flowBuilderDrag";
import { buildFlowGraph } from "../utils/flowBuilderGraph";

export type FlowBuilderViewMode = "list" | "flow";
export type FlowBuilderSidebarFilter = "all" | "in_flow" | "unused";

export interface FlowLibraryItem {
  id: string;
  name: string;
  kind: "program" | "section" | "consent";
  visitTypeKey?: string;
}

interface UseCustomProgramFlowBuilderArgs {
  customProgram: CustomProgram;
  onSave?: (updated: CustomProgram) => void;
  onUpdateFlow?: (updatedItems: CustomProgramFlowItem[]) => void;
}

export function useCustomProgramFlowBuilder({
  customProgram,
  onSave,
  onUpdateFlow,
}: UseCustomProgramFlowBuilderArgs) {
  const [viewMode, setViewMode] = useState<FlowBuilderViewMode>("flow");
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [slugInput, setSlugInput] = useState(customProgram.slug);
  const [sidebarFilter, setSidebarFilter] = useState<FlowBuilderSidebarFilter>("all");
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const { data: programs = [] } = usePrograms();
  const { data: sections = [] } = useSections();
  const { data: consents = [] } = useConsents();

  const allLibraryItems = useMemo<FlowLibraryItem[]>(() => {
    return [
      ...sections.map((section) => ({ id: section.id, name: section.name, kind: "section" as const })),
      ...programs.map((program) => ({
        id: program.id,
        name: program.name,
        kind: "program" as const,
        visitTypeKey: program.visitType,
      })),
      ...consents.map((consent) => ({ id: consent.id, name: consent.name, kind: "consent" as const })),
    ];
  }, [consents, programs, sections]);

  const isItemInFlow = useCallback(
    (item: FlowLibraryItem) =>
      customProgram.flowItems.some((flowItem) => flowItem.kind === item.kind && flowItem.sourceId === item.id),
    [customProgram.flowItems]
  );

  const filteredLibraryItems = useMemo(() => {
    const query = sidebarSearch.trim().toLowerCase();
    return allLibraryItems.filter((item) => {
      const matchesSearch = !query || item.name.toLowerCase().includes(query) || item.kind.includes(query);
      if (!matchesSearch) return false;

      const inFlow = isItemInFlow(item);
      if (sidebarFilter === "in_flow") return inFlow;
      if (sidebarFilter === "unused") return !inFlow;
      return true;
    });
  }, [allLibraryItems, isItemInFlow, sidebarFilter, sidebarSearch]);

  const handleToggleItemInFlow = useCallback(
    (item: FlowLibraryItem) => {
      if (!onUpdateFlow) return;
      if (isItemInFlow(item)) {
        onUpdateFlow(customProgram.flowItems.filter((flowItem) => !(flowItem.kind === item.kind && flowItem.sourceId === item.id)));
        return;
      }

      const items = [...customProgram.flowItems];
      items.splice(findDefaultInsertIndex(items), 0, buildFlowItem(item));
      onUpdateFlow(items);
    },
    [customProgram.flowItems, isItemInFlow, onUpdateFlow]
  );

  const handleSidebarDragStart = useCallback((event: React.DragEvent, item: FlowLibraryItem) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        isNewItem: true,
        kind: item.kind,
        title: item.name,
        visitTypeKey: item.visitTypeKey,
        sourceId: item.id,
      } satisfies SidebarDragPayload)
    );
  }, []);

  const handleDragStart = useCallback(
    (event: React.DragEvent, index: number) => {
      if (customProgram.flowItems[index]?.locked) {
        event.preventDefault();
        return;
      }
      setDraggedIndex(index);
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", JSON.stringify({ draggedIndex: index } satisfies ExistingDragPayload));
    },
    [customProgram.flowItems]
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent, index: number) => {
      if (customProgram.flowItems[index]?.locked) return;
      event.preventDefault();
    },
    [customProgram.flowItems]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const getTargetIndexForId = useCallback(
    (itemId: string): number => {
      const exactIndex = customProgram.flowItems.findIndex((flowItem) => flowItem.id === itemId);
      if (exactIndex !== -1) return exactIndex;

      if (itemId === "sys-start" || itemId === "sys-auth") return 0;
      if (itemId === "sys-matched") {
        const sectionIndex = customProgram.flowItems.findIndex((flowItem) => flowItem.kind === "section");
        if (sectionIndex !== -1) return sectionIndex;
        const programIndex = customProgram.flowItems.findIndex((flowItem) => flowItem.kind === "program");
        if (programIndex !== -1) return programIndex;
      }

      const checkoutIndex = customProgram.flowItems.findIndex((flowItem) => flowItem.kind === "checkout");
      return checkoutIndex !== -1 ? checkoutIndex : customProgram.flowItems.length;
    },
    [customProgram.flowItems]
  );

  const handleInsertItem = useCallback(
    (rawData: string, targetIndex: number) => {
      if (!onUpdateFlow) return;
      const payload = parseDragPayload(rawData);
      if (!payload) return;

      const items = [...customProgram.flowItems];
      if (isSidebarDragPayload(payload)) {
        const newItem = buildFlowItem({
          id: payload.sourceId,
          name: payload.title,
          kind: payload.kind,
          visitTypeKey: payload.visitTypeKey,
        });
        const checkoutIndex = items.findIndex((item) => item.kind === "checkout");
        const insertAt = checkoutIndex >= 0 && targetIndex > checkoutIndex ? checkoutIndex : targetIndex;
        items.splice(insertAt, 0, newItem);
        onUpdateFlow(items);
        return;
      }

      const sourceIndex = payload.draggedIndex;
      if (sourceIndex === targetIndex || !items[sourceIndex] || items[sourceIndex].locked) return;
      const [draggedItem] = items.splice(sourceIndex, 1);
      let insertAt = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
      const checkoutIndex = items.findIndex((item) => item.kind === "checkout");
      if (checkoutIndex >= 0 && insertAt > checkoutIndex) insertAt = checkoutIndex;
      items.splice(insertAt, 0, draggedItem);
      onUpdateFlow(items);
    },
    [customProgram.flowItems, onUpdateFlow]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent, targetIndex: number) => {
      event.preventDefault();
      if (customProgram.flowItems[targetIndex]?.locked) return;
      const rawData = event.dataTransfer.getData("text/plain");
      if (rawData) handleInsertItem(rawData, targetIndex);
    },
    [customProgram.flowItems, handleInsertItem]
  );

  const handleDropOnArrow = useCallback(
    (event: React.DragEvent, afterItemId: string) => {
      event.preventDefault();
      const rawData = event.dataTransfer.getData("text/plain");
      if (rawData) handleInsertItem(rawData, getTargetIndexForId(afterItemId) + 1);
    },
    [getTargetIndexForId, handleInsertItem]
  );

  const handleCanvasContainerDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const rawData = event.dataTransfer.getData("text/plain");
      if (!rawData) return;
      const checkoutIndex = customProgram.flowItems.findIndex((item) => item.kind === "checkout");
      handleInsertItem(rawData, checkoutIndex !== -1 ? checkoutIndex : customProgram.flowItems.length);
    },
    [customProgram.flowItems, handleInsertItem]
  );

  const handleMoveItem = useCallback(
    (index: number, direction: "up" | "down") => {
      if (!onUpdateFlow) return;
      const items = [...customProgram.flowItems];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= items.length || items[index]?.locked || items[targetIndex]?.locked) return;
      [items[index], items[targetIndex]] = [items[targetIndex], items[index]];
      onUpdateFlow(items);
    },
    [customProgram.flowItems, onUpdateFlow]
  );

  const handleDeleteItem = useCallback(
    (index: number) => {
      if (!onUpdateFlow || customProgram.flowItems[index]?.locked) return;
      const items = [...customProgram.flowItems];
      items.splice(index, 1);
      onUpdateFlow(items);
    },
    [customProgram.flowItems, onUpdateFlow]
  );

  const handleSave = useCallback(() => {
    onSave?.(customProgram);
  }, [customProgram, onSave]);

  const handleStartEditSlug = useCallback(() => {
    setSlugInput(customProgram.slug);
    setIsEditingSlug(true);
  }, [customProgram.slug]);

  const handleSaveSlug = useCallback(() => {
    onSave?.({ ...customProgram, slug: slugInput });
    setIsEditingSlug(false);
  }, [customProgram, onSave, slugInput]);

  const handleCancelEditSlug = useCallback(() => {
    setSlugInput(customProgram.slug);
    setIsEditingSlug(false);
  }, [customProgram.slug]);

  const flowItems = useMemo(() => customProgram.flowItems || [], [customProgram.flowItems]);
  const getConsentScope = useCallback((name: string) => consents.find((consent) => consent.name === name)?.scope || "global", [consents]);
  const getConsentVisitTypeKeys = useCallback((name: string) => consents.find((consent) => consent.name === name)?.visitTypeKeys || [], [consents]);
  const { tracks, preFan, postFan } = useMemo(
    () => buildFlowGraph({ flowItems, getConsentScope, getConsentVisitTypeKeys }),
    [flowItems, getConsentScope, getConsentVisitTypeKeys]
  );

  return {
    viewMode,
    setViewMode,
    isTestModalOpen,
    setIsTestModalOpen,
    isEditingSlug,
    slugInput,
    setSlugInput,
    sidebarFilter,
    setSidebarFilter,
    sidebarSearch,
    setSidebarSearch,
    draggedIndex,
    filteredLibraryItems,
    isItemInFlow,
    handleToggleItemInFlow,
    handleSidebarDragStart,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
    handleDropOnArrow,
    handleCanvasContainerDrop,
    handleInsertItem,
    getTargetIndexForId,
    handleMoveItem,
    handleDeleteItem,
    handleSave,
    handleStartEditSlug,
    handleSaveSlug,
    handleCancelEditSlug,
    tracks,
    preFan,
    postFan,
  };
}
