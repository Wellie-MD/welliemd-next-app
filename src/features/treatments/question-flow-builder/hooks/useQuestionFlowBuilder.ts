import { useState, useCallback, useMemo, useEffect } from "react";
import type { QuestionFlowAdapter, QuestionFlowItem } from "../types";
import { createMockId } from "@/features/treatments/common/data/factories";
import type { QuestionKind } from "@/features/treatments/types";

export type QuestionFlowViewMode = "list" | "flow";
export type QuestionTypePaletteFilter = "all" | "basic" | "medical";

const QUESTION_KINDS: readonly QuestionKind[] = [
  "text",
  "textarea",
  "number",
  "date",
  "email",
  "phone",
  "zip",
  "single_choice",
  "multiple_choice",
  "yes_no",
  "height_weight",
  "consent",
  "file_upload",
  "state_routing",
  "medication_dose",
  "pharmacy",
  "personal_details",
  "shipping_address",
  "sex",
  "medical_conditions",
  "self_reported_meds",
  "allergies",
  "labs_preference",
  "checkout",
];

interface PaletteDragPayload {
  kind: QuestionKind;
  text: string;
}

const QUESTION_KIND_SET = new Set<string>(QUESTION_KINDS);

const isQuestionKind = (value: unknown): value is QuestionKind =>
  typeof value === "string" && QUESTION_KIND_SET.has(value);

const isPaletteDragPayload = (value: unknown): value is PaletteDragPayload => {
  if (!value || typeof value !== "object") return false;
  if (!("kind" in value) || !("text" in value)) return false;
  return isQuestionKind(value.kind) && typeof value.text === "string";
};

const parsePalettePayload = (raw: string): PaletteDragPayload | null => {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isPaletteDragPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const createFlowItem = (
  payload: PaletteDragPayload,
  order: number
): QuestionFlowItem => ({
  id: createMockId("q"),
  order,
  text: payload.text,
  kind: payload.kind,
  required: false,
});

const normalizeOrder = (items: QuestionFlowItem[]): QuestionFlowItem[] =>
  items.map((item, idx) => ({ ...item, order: idx + 1 }));

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
  }, [adapter.items, adapterSignature]);

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
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItemIndex(null);
  }, []);

  const handleDropOnArrow = useCallback(
    (event: React.DragEvent, afterItemId: string) => {
      event.preventDefault();

      const paletteData = parsePalettePayload(event.dataTransfer.getData("application/json"));
      if (paletteData) {
          setItems((prev) => {
            const newItems = [...prev].sort((a, b) => a.order - b.order);
            const targetIndex = newItems.findIndex(i => i.id === afterItemId) + 1;
            if (targetIndex === 0) return prev;

            newItems.splice(targetIndex, 0, createFlowItem(paletteData, targetIndex + 1));
            return normalizeOrder(newItems);
          });
        return;
      }

      // Reordering existing item
      if (draggedItemIndex === null) return;

      setItems((prev) => {
        const newItems = [...prev].sort((a, b) => a.order - b.order);
        const targetIndex = newItems.findIndex(i => i.id === afterItemId);
        if (targetIndex === -1) return prev;

        // If dropping exactly where it already is, do nothing
        if (draggedItemIndex === targetIndex || draggedItemIndex === targetIndex + 1) {
          return prev;
        }

        const [draggedItem] = newItems.splice(draggedItemIndex, 1);
        if (!draggedItem) return prev;

        // Find new index after removal
        const newTargetIndex = newItems.findIndex(i => i.id === afterItemId) + 1;
        if (newTargetIndex === 0) return prev;

        newItems.splice(newTargetIndex, 0, draggedItem);
        return normalizeOrder(newItems);
      });
      setDraggedItemIndex(null);
    },
    [draggedItemIndex]
  );

  const handleCanvasDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    // Drop at the end of the canvas
    const paletteData = parsePalettePayload(event.dataTransfer.getData("application/json"));
    if (paletteData) {
        setItems((prev) => {
          const newItems = [...prev].sort((a, b) => a.order - b.order);
          newItems.push(createFlowItem(paletteData, newItems.length + 1));
          return newItems;
        });
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
