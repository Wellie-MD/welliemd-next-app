import type { Edge } from "reactflow";

export type LayoutType = "start" | "auth" | "question" | "consent" | "checkout" | "product" | "end";

export type FlowEdgeKind = "sequential" | "conditional" | "return" | "product";

export type LayoutBox = {
  id: string;
  centerX: number;
  y: number;
  type: LayoutType;
  height: number;
};

export type FlowEdgeData = {
  kind: FlowEdgeKind;
  sourceAnswerValue?: string;
  label?: string;
  active?: boolean;
  dimmed?: boolean;
  routeLane?: number;
};

export type ProgramFlowEdge = Edge<FlowEdgeData>;

export type ProductSourceReason =
  | "new_patient_preference"
  | "recent_dose"
  | "first_meaningful_rule"
  | "checkout_default";

export type ProductSource = {
  questionId: string;
  value: string;
  extra: number;
  reason: Exclude<ProductSourceReason, "checkout_default">;
};
