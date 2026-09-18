import type { Edge } from "reactflow";
import type { ProgramQuestion } from "../../../types";
import type { ProgramCheckoutProduct } from "../../../types/checkout";
import { getProductSource } from "./flowLayoutHelpers";
import type { ProgramFlowEdge } from "./flowTypes";

export interface TracedPath {
  activeNodeIds: Set<string>;
  activeEdgeIds: Set<string>;
  activeChoices: Map<string, Set<string>>;
  activeChoiceKinds: Map<string, Map<string, string>>;
}

export function traceActivePath(
  focusedNodeId: string | null | undefined,
  edges: Array<Edge | ProgramFlowEdge>,
  questionIds: Set<string>,
  questionsById: Map<string, ProgramQuestion>,
  allProducts: ProgramCheckoutProduct[],
  focusedChoice?: { nodeId: string; value: string } | null
): TracedPath {
  const activeNodeIds = new Set<string>();
  const activeEdgeIds = new Set<string>();
  const activeChoices = new Map<string, Set<string>>();
  const activeChoiceKinds = new Map<string, Map<string, string>>();

  const markChoice = (nodeId: string, value: string, kind = "conditional") => {
    if (!value) return;
    let choicesSet = activeChoices.get(nodeId);
    if (!choicesSet) {
      choicesSet = new Set<string>();
      activeChoices.set(nodeId, choicesSet);
    }
    choicesSet.add(value);

    let kindMap = activeChoiceKinds.get(nodeId);
    if (!kindMap) {
      kindMap = new Map<string, string>();
      activeChoiceKinds.set(nodeId, kindMap);
    }
    kindMap.set(value, kind);
  };

  const choiceValueForEdge = (edge: Edge | ProgramFlowEdge) =>
    edge.data?.sourceAnswerValue ||
    (edge.sourceHandle && edge.sourceHandle.startsWith("choice-")
      ? decodeURIComponent(edge.sourceHandle.slice("choice-".length))
      : "");

  if (focusedChoice) {
    activeNodeIds.add(focusedChoice.nodeId);
    markChoice(focusedChoice.nodeId, focusedChoice.value);

    edges.forEach((edge) => {
      const choiceVal = choiceValueForEdge(edge);
      if (edge.source === focusedChoice.nodeId && choiceVal === focusedChoice.value) {
        activeEdgeIds.add(edge.id);
        activeNodeIds.add(edge.source);
        activeNodeIds.add(edge.target);
        const choiceKind = edge.data?.kind === "sequential" && choiceVal ? "conditional" : edge.data?.kind || "conditional";
        markChoice(edge.source, choiceVal, choiceKind);
      }
    });

    return { activeNodeIds, activeEdgeIds, activeChoices, activeChoiceKinds };
  }

  if (!focusedNodeId) {
    return { activeNodeIds, activeEdgeIds, activeChoices, activeChoiceKinds };
  }

  activeNodeIds.add(focusedNodeId);

  // Prototype behavior: node focus highlights the node and its direct route
  // lines, but answer rows are only highlighted during exact answer hover.
  // This avoids showing every possible answer as selected when a question node
  // itself is focused.
  edges.forEach((edge) => {
    if (edge.data?.kind !== "sequential" && (edge.target === focusedNodeId || edge.source === focusedNodeId)) {
      activeEdgeIds.add(edge.id);
      activeNodeIds.add(edge.source);
      activeNodeIds.add(edge.target);
    }
  });

  // 3. Special handling for Products:
  // If the focused node is a product card, ensure its source eligibility route is trace-highlighted.
  // The recursive inbound trace already covers this because there is an edge from the source question (or Checkout) to the product.
  // However, if the source question is highlighted, we want to make sure the specific choice that causes the product eligibility is marked in activeChoices!
  if (focusedNodeId.startsWith("product-card-")) {
    const prodId = focusedNodeId.slice("product-card-".length);
    const product = allProducts.find((p) => String(p.id) === prodId);
    if (product) {
      const source = getProductSource(product, questionsById);
      if (source && questionIds.has(source.questionId)) {
        let choicesSet = activeChoices.get(source.questionId);
        if (!choicesSet) {
          choicesSet = new Set<string>();
          activeChoices.set(source.questionId, choicesSet);
        }
        choicesSet.add(source.value);
        markChoice(source.questionId, source.value, "product");
      }
    }
  }

  return { activeNodeIds, activeEdgeIds, activeChoices, activeChoiceKinds };
}
