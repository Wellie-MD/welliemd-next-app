import { createMockId } from "@/features/treatments/common/data/factories";
import type { CustomProgramFlowItem } from "@/features/treatments/types";
import type { FlowLibraryItem } from "@/features/treatments/flow-builder/hooks/useCustomProgramFlowBuilder";

export interface SidebarDragPayload {
  isNewItem: true;
  kind: FlowLibraryItem["kind"];
  title: string;
  visitTypeKey?: string;
  sourceId: string;
}

export interface ExistingDragPayload {
  draggedIndex: number;
}

export function isSidebarDragPayload(value: unknown): value is SidebarDragPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  return (
    payload.isNewItem === true &&
    typeof payload.kind === "string" &&
    ["program", "section", "consent"].includes(payload.kind) &&
    typeof payload.title === "string" &&
    typeof payload.sourceId === "string"
  );
}

export function isExistingDragPayload(value: unknown): value is ExistingDragPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  return typeof payload.draggedIndex === "number";
}

export function parseDragPayload(rawData: string): SidebarDragPayload | ExistingDragPayload | null {
  try {
    const parsed: unknown = JSON.parse(rawData);
    if (isSidebarDragPayload(parsed) || isExistingDragPayload(parsed)) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function buildFlowItem(item: FlowLibraryItem): CustomProgramFlowItem {
  return {
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
}

export function findDefaultInsertIndex(items: CustomProgramFlowItem[]) {
  let insertIndex = items.length;
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (items[index].kind === "checkout" || items[index].kind === "consent") insertIndex = index;
    else break;
  }
  return insertIndex;
}
