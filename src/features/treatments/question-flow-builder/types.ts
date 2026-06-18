import type { QuestionKind } from "@/features/treatments/types";

export type QuestionFlowEntityType = "program" | "section";

export interface QuestionFlowItem {
  id: string;
  order: number;
  text: string;
  kind: QuestionKind;
  required: boolean;
  metadata?: Record<string, unknown>;
}

export interface QuestionFlowAdapter {
  entityType: QuestionFlowEntityType;
  entityId: string;
  title: string;
  subtitle: string;
  items: QuestionFlowItem[];
  saveItems: (items: QuestionFlowItem[]) => Promise<void>;
}
