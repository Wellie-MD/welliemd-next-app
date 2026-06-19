import { useState, useCallback, useMemo, useEffect } from "react";
import type { QuestionFlowAdapter, QuestionFlowItem } from "../types";
import { createMockId } from "@/features/treatments/common/data/factories";
import type { QuestionKind } from "@/features/treatments/types";

export type QuestionFlowViewMode = "list" | "flow";
export type QuestionTypePaletteFilter = "all" | "basic" | "medical";

export function useQuestionFlowBuilder(adapter: QuestionFlowAdapter) {
  const [items, setItems] = useState<QuestionFlowItem[]>(adapter.items);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // Keep the builder in sync with the source-of-truth items. The adapter is
  // rebuilt whenever the underlying questions change (e.g. a modal adds an
  // element, or an external edit persists), so re-seed local state on those
  // content changes. Local drag reorders don't change the signature until they
  // are saved, so in-progress reorders are preserved.
  const adapterSignature = useMemo(
    () => adapter.items.map((item) => `${item.id}:${item.order}:${item.kind}:${item.required}:${item.text}`).join("|"),
    [adapter.items]
  );
  useEffect(() => {
    setItems(adapter.items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adapterSignature]);

  // Sorting items by order just to be safe
  const sortedItems = useMemo(() => [...items].sort((a, b) => a.order - b.order), [items]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await adapter.saveItems(sortedItems);
    } finally {
      setIsSaving(false);
    }
  }, [adapter, sortedItems]);

  const handleDragStart = useCallback((event: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", index.toString());
    
    // Create drag image if needed, or rely on browser default
    const target = event.target as HTMLElement;
    target.style.opacity = "0.5";
  }, []);

  const handleDragEnd = useCallback((event: React.DragEvent) => {
    setDraggedItemIndex(null);
    const target = event.target as HTMLElement;
    target.style.opacity = "1";
  }, []);

  const handleDropOnArrow = useCallback(
    (event: React.DragEvent, afterItemId: string) => {
      event.preventDefault();
      
      const draggedPaletteKind = event.dataTransfer.getData("application/json");
      if (draggedPaletteKind) {
        // We dropped a new item from the palette
        try {
          const paletteData = JSON.parse(draggedPaletteKind) as { kind: QuestionKind; text: string };
          
          setItems((prev) => {
            const newItems = [...prev].sort((a, b) => a.order - b.order);
            const targetIndex = newItems.findIndex(i => i.id === afterItemId) + 1;
            
            const newItem: QuestionFlowItem = {
              id: createMockId("q"),
              order: 0, // will recompute
              text: paletteData.text,
              kind: paletteData.kind,
              required: false,
            };
            
            newItems.splice(targetIndex, 0, newItem);
            
            // Recompute order
            return newItems.map((item, idx) => ({ ...item, order: idx + 1 }));
          });
        } catch (e) {
          // ignore
        }
        return;
      }

      // Reordering existing item
      if (draggedItemIndex === null) return;

      setItems((prev) => {
        const newItems = [...prev].sort((a, b) => a.order - b.order);
        const targetIndex = newItems.findIndex(i => i.id === afterItemId);
        
        // If dropping exactly where it already is, do nothing
        if (draggedItemIndex === targetIndex || draggedItemIndex === targetIndex + 1) {
          return prev;
        }

        const [draggedItem] = newItems.splice(draggedItemIndex, 1);
        
        // Find new index after removal
        const newTargetIndex = newItems.findIndex(i => i.id === afterItemId) + 1;
        
        newItems.splice(newTargetIndex, 0, draggedItem);

        // Recompute order
        return newItems.map((item, idx) => ({ ...item, order: idx + 1 }));
      });
      setDraggedItemIndex(null);
    },
    [draggedItemIndex]
  );

  const handleCanvasDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    // Drop at the end of the canvas
    const draggedPaletteKind = event.dataTransfer.getData("application/json");
    if (draggedPaletteKind) {
      try {
        const paletteData = JSON.parse(draggedPaletteKind) as { kind: QuestionKind; text: string };
        setItems((prev) => {
          const newItems = [...prev].sort((a, b) => a.order - b.order);
          const newItem: QuestionFlowItem = {
            id: createMockId("q"),
            order: newItems.length + 1,
            text: paletteData.text,
            kind: paletteData.kind,
            required: false,
          };
          newItems.push(newItem);
          return newItems;
        });
      } catch(e) {}
    }
  }, []);

  const handleAddItem = useCallback((kind: QuestionKind, text: string) => {
    setItems((prev) => {
      const newItems = [...prev].sort((a, b) => a.order - b.order);
      const newItem: QuestionFlowItem = {
        id: createMockId("q"),
        order: newItems.length + 1,
        text,
        kind,
        required: false,
      };
      newItems.push(newItem);
      return newItems;
    });
  }, []);

  const handleDeleteItem = useCallback((id: string) => {
    setItems((prev) => {
      const filtered = prev.filter(i => i.id !== id);
      return filtered.map((item, idx) => ({ ...item, order: idx + 1 }));
    });
  }, []);

  return {
    items: sortedItems,
    isSaving,
    handleSave,
    handleDragStart,
    handleDragEnd,
    handleDropOnArrow,
    handleCanvasDrop,
    handleAddItem,
    handleDeleteItem,
  };
}
