import { MarkerType } from "reactflow";
import type { Node } from "reactflow";
import type { Program, ProgramQuestion } from "../../../types";
import type { ProgramCheckoutProduct } from "../../../types/checkout";
import {
  BASE_HEIGHTS,
  BRANCH_GAP_Y,
  MAX_BRANCH_DEPTH,
  PRODUCT_GAP_Y,
  RETURN_LANE_GAP_X,
  ROW_GAP_Y,
  SPINE_GAP_Y,
  SPINE_X,
  TOP_PADDING,
  branchCenterX,
  centerToPosition,
  choiceOffsetY,
  collectVisibilityRules,
  getProductSource,
  hasVisibilityRules,
  nextSpineNodeId,
  nodeHeight,
  productCenterX,
  triggerHandleId,
} from "./flowLayoutHelpers";
import { normalizeProgramFlowData, type FlowNormalizationIssue } from "./flowNormalizer";
import type { FlowEdgeKind, LayoutBox, LayoutType, ProgramFlowEdge } from "./flowTypes";
import { traceActivePath } from "./flowPathTracing";
import { hasPatientAuthentication } from "../../programSystemBoundary";

export interface GraphData {
  nodes: Node[];
  edges: ProgramFlowEdge[];
  diagnostics?: FlowNormalizationIssue[];
}

type TempEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  kind: FlowEdgeKind;
  label?: string;
  sourceAnswerValue?: string;
  routeLane?: number;
};

type BranchItem = { node: ProgramQuestion; triggerValue: string; choiceIndex: number };

const markerFor = (kind: FlowEdgeKind, active: boolean, dimmed: boolean) => {
  const color = dimmed
    ? "#e2e8f0"
    : active
      ? kind === "product"
        ? "#16a34a"
        : kind === "conditional"
          ? "#2563eb"
          : kind === "return"
            ? "#64748b"
            : "#cbd5e1"
      : kind === "product"
        ? "#16a34a"
        : kind === "conditional"
          ? "#3b82f6"
          : kind === "return"
            ? "#64748b"
            : "#cbd5e1";

  return {
    type: MarkerType.ArrowClosed,
    color,
    width: kind === "return" ? 10 : kind === "sequential" ? 14 : 16,
    height: kind === "return" ? 10 : kind === "sequential" ? 14 : 16,
  };
};

const sortByChoice = (items: BranchItem[]) =>
  [...items].sort((a, b) => {
    const ai = a.choiceIndex < 0 ? Number.MAX_SAFE_INTEGER : a.choiceIndex;
    const bi = b.choiceIndex < 0 ? Number.MAX_SAFE_INTEGER : b.choiceIndex;
    if (ai !== bi) return ai - bi;
    return 0;
  });

const depthForReturn = (questionId: string, parentOf: Map<string, string>): number => {
  let depth = 0;
  let parentId = parentOf.get(questionId);
  let guard = 0;

  while (parentId && guard < 25) {
    depth += 1;
    parentId = parentOf.get(parentId);
    guard += 1;
  }

  return depth;
};

export function buildStaticProgramFlowGraph(
  program: Program,
  questions: ProgramQuestion[],
  allConsents: Array<{ id: string; name: string; scope?: string }>,
  _direction: "TB" | "LR" = "TB"
): GraphData {
  const nodes: Node[] = [];
  const edges: ProgramFlowEdge[] = [];
  const boxes = new Map<string, LayoutBox>();
  const tempEdges: TempEdge[] = [];

  const normalized = normalizeProgramFlowData(questions);
  const {
    sortedQuestions,
    questionIds,
    questionsById,
    branchChildren,
    spineQuestions,
    parentOf,
    triggerValueOf,
  } = normalized;

  const allProducts = (program.checkoutQuestions || []).flatMap((cq) => cq.products || []);
  const hasAuth = hasPatientAuthentication(program);
  const hasCheckout = (program.checkoutQuestions || []).length > 0;

  const place = (id: string, centerX: number, y: number, type: LayoutType, height = BASE_HEIGHTS[type]) => {
    boxes.set(id, { id, centerX, y, type, height });
  };

  const addEdge = (edge: TempEdge) => {
    tempEdges.push(edge);
  };

  const placedNodeIds = new Set<string>();
  const placedProductIds = new Set<string>();

  const layoutBranchGroup = (
    parentId: string,
    parentY: number,
    parentHeight: number,
    depth: number,
    visited: Set<string>
  ): number => {
    const parentQuestion = questionsById.get(parentId);
    const questionChildren = branchChildren.get(parentId) || [];
    if (!questionChildren.length) return parentY + parentHeight;

    const items: BranchItem[] = [];

    questionChildren.forEach((child) => {
      const triggerValue = triggerValueOf.get(child.id) || "";
      const choiceIndex = parentQuestion && triggerValue ? (parentQuestion.choices || []).indexOf(triggerValue) : -1;
      items.push({ node: child, triggerValue, choiceIndex });
    });

    const orderedItems = sortByChoice(items);
    let cursorY = parentY + 10;
    let bottom = parentY + parentHeight;
    const parentIsSpine = spineQuestions.some((question) => question.id === parentId);

    orderedItems.forEach((item) => {
      const triggerValue = item.triggerValue;
      const child = item.node;
      if (visited.has(child.id) || placedNodeIds.has(child.id)) return;

      const childType: LayoutType = child.kind === "consent"
        ? "consent"
        : child.kind === "section"
          ? "section"
          : "question";
      const childHeight = nodeHeight(child);
      const isAnswerTriggered = Boolean(parentQuestion && triggerValue);
      const shouldAnchorToAnswerRow = parentIsSpine || child.kind === "consent";
      const xDepth = Math.min(MAX_BRANCH_DEPTH, isAnswerTriggered ? depth : Math.max(1, depth));
      const x = branchCenterX(xDepth);

      const preferredY =
        shouldAnchorToAnswerRow && parentQuestion && triggerValue
          ? parentY + choiceOffsetY(parentQuestion, triggerValue) - 36
          : parentY + parentHeight + BRANCH_GAP_Y;
      const y = Math.max(cursorY, preferredY);

      placedNodeIds.add(child.id);
      place(child.id, x, y, childType, childHeight);

      const triggerRules = collectVisibilityRules(child.visibilityRuleGroup);
      addEdge({
        id: `edge-cond-${parentId}-${child.id}`,
        source: parentId,
        target: child.id,
        sourceHandle: isAnswerTriggered ? triggerHandleId(parentQuestion, triggerValue) : "bottom",
        targetHandle: isAnswerTriggered ? "left" : "top",
        sourceAnswerValue: triggerValue || undefined,
        label: triggerRules.length > 1 ? `+${triggerRules.length - 1} more` : undefined,
        kind: isAnswerTriggered ? "conditional" : "sequential",
      });

      // The prototype keeps follow-up questions in the same side column so the
      // clinical path reads as a compact vertical stack. Only consent/outcome
      // side-cards advance into the next lane.
      const nextDepth = child.kind === "consent" ? Math.min(MAX_BRANCH_DEPTH, xDepth + 1) : xDepth;
      const subtreeBottom = layoutBranchGroup(child.id, y, childHeight, nextDepth, new Set([...visited, child.id]));
      const itemBottom = Math.max(y + childHeight, subtreeBottom);
      cursorY = itemBottom + BRANCH_GAP_Y;
      bottom = Math.max(bottom, itemBottom);
    });

    return bottom;
  };

  const consentIds = program.consentIds || [];
  const programConsents = allConsents.filter((consent) => consentIds.includes(consent.id));
  const hasAuthoredFlow = (
    hasAuth
    || sortedQuestions.length > 0
    || programConsents.length > 0
    || hasCheckout
  );
  if (!hasAuthoredFlow) {
    return { nodes: [], edges: [], diagnostics: normalized.issues };
  }

  let y = TOP_PADDING;
  place("start", SPINE_X, y, "start");
  placedNodeIds.add("start");
  y += BASE_HEIGHTS.start + 28;

  if (hasAuth) {
    place("auth", SPINE_X, y, "auth");
    placedNodeIds.add("auth");
    y += BASE_HEIGHTS.auth + SPINE_GAP_Y;
  }

  const spineQuestionIds: string[] = [];
  spineQuestions.forEach((question) => {
    const type: LayoutType = question.kind === "consent"
      ? "consent"
      : question.kind === "section"
        ? "section"
        : "question";
    const height = nodeHeight(question);
    place(question.id, SPINE_X, y, type, height);
    placedNodeIds.add(question.id);
    spineQuestionIds.push(question.id);

    const branchBottom = layoutBranchGroup(question.id, y, height, 1, new Set([question.id]));
    y = Math.max(y + height, branchBottom) + ROW_GAP_Y;
  });

  const consentNodeIds: string[] = [];
  programConsents.forEach((consent) => {
    const id = `consent-form-${consent.id}`;
    place(id, SPINE_X, y, "consent", BASE_HEIGHTS.consent);
    placedNodeIds.add(id);
    consentNodeIds.push(id);
    y += BASE_HEIGHTS.consent + ROW_GAP_Y;
  });

  if (hasCheckout) {
    place("checkout", SPINE_X, y, "checkout");
    placedNodeIds.add("checkout");
  }

  const productStackX = productCenterX(2);
  let productY = y + BASE_HEIGHTS.checkout + 28;
  allProducts.forEach((product, index) => {
    const id = `product-card-${product.id}`;
    if (placedProductIds.has(product.id)) return;
    place(id, productStackX, productY, "product", BASE_HEIGHTS.product);
    placedProductIds.add(product.id);
    productY += BASE_HEIGHTS.product + PRODUCT_GAP_Y;

    const source = getProductSource(product, questionsById);
    if (source && questionIds.has(source.questionId)) {
      const sourceQuestion = questionsById.get(source.questionId);
      addEdge({
        id: `edge-product-${product.id}`,
        source: source.questionId,
        target: id,
        sourceHandle: triggerHandleId(sourceQuestion, source.value),
        targetHandle: "left",
        sourceAnswerValue: source.value || undefined,
        label: source.extra > 0 ? `+${source.extra} more` : undefined,
        routeLane: index,
        kind: "product",
      });
      return;
    }

    addEdge({
      id: `edge-product-${product.id}`,
      source: "checkout",
      target: id,
      sourceHandle: "right",
      targetHandle: "left",
      routeLane: index,
      kind: "product",
    });
  });

  y = hasCheckout
    ? Math.max(y + BASE_HEIGHTS.checkout, productY) + ROW_GAP_Y
    : y + ROW_GAP_Y;
  place("end", SPINE_X, y, "end");
  placedNodeIds.add("end");

  const spineNodeIds = [
    "start",
    ...(hasAuth ? ["auth"] : []),
    ...spineQuestionIds,
    ...consentNodeIds,
    ...(hasCheckout ? ["checkout"] : []),
    "end",
  ];
  for (let i = 0; i < spineNodeIds.length - 1; i += 1) {
    addEdge({
      id: `edge-seq-${spineNodeIds[i]}-${spineNodeIds[i + 1]}`,
      source: spineNodeIds[i],
      target: spineNodeIds[i + 1],
      sourceHandle: "bottom",
      targetHandle: "top",
      kind: "sequential",
    });
  }

  sortedQuestions.forEach((question) => {
    const parentId = parentOf.get(question.id);
    const isSpine = spineQuestionIds.includes(question.id);
    const hasChildBranches = Boolean((branchChildren.get(question.id) || []).length);
    if (!parentId || isSpine || hasChildBranches) return;

    let rootId = parentId;
    let rootGuard = 0;
    while (parentOf.has(rootId) && rootGuard <= parentOf.size) {
      rootId = parentOf.get(rootId) || rootId;
      rootGuard += 1;
    }
    const rejoinTarget = nextSpineNodeId(spineNodeIds, rootId);
    if (question.id === rejoinTarget) return;

    const passChoices = (question.choices || []).filter((choice) => !(question.dqChoices || []).includes(choice));
    const routeLane = depthForReturn(question.id, parentOf);

    if (passChoices.length === 1) {
      addEdge({
        id: `edge-return-${question.id}-${rejoinTarget}-${encodeURIComponent(passChoices[0])}`,
        source: question.id,
        target: rejoinTarget,
        sourceHandle: triggerHandleId(question, passChoices[0]),
        targetHandle: "top",
        sourceAnswerValue: passChoices[0],
        kind: "return",
        routeLane,
      });
      return;
    }

    addEdge({
      id: `edge-return-${question.id}-${rejoinTarget}`,
      source: question.id,
      target: rejoinTarget,
      sourceHandle: "bottom",
      targetHandle: "top",
      kind: "return",
      routeLane,
    });
  });

  const edgeKeys = new Set<string>();
  tempEdges.forEach((edge) => {
    if (edge.source === edge.target) return;
    const key = `${edge.source}->${edge.target}:${edge.sourceHandle}:${edge.targetHandle}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);

    const active = false;
    const dimmed = false;
    edges.push({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: "semantic",
      markerEnd: markerFor(edge.kind, active, dimmed),
      zIndex: edge.kind === "return" ? 0 : 1,
      data: {
        kind: edge.kind,
        sourceAnswerValue: edge.sourceAnswerValue,
        label: edge.label,
        routeLane: edge.routeLane,
        active,
        dimmed,
      },
    });
  });

  const pushNode = (id: string, type: LayoutType, data: Record<string, unknown>) => {
    const box = boxes.get(id) || { id, centerX: SPINE_X, y: 0, type, height: BASE_HEIGHTS[type] };

    nodes.push({
      id,
      type,
      data: {
        ...data,
        nodeHeight: box.height,
        isFocusedPath: false,
        hasActiveFocus: false,
        focusedChoices: [],
        focusedChoiceKinds: {},
      },
      position: centerToPosition(box.centerX, box.y, box.type),
      draggable: false,
      zIndex: 10,
    });
  };

  pushNode("start", "start", { label: "Start", subtitle: "Patient enters", isFocused: false });
  if (hasAuth) {
    pushNode("auth", "auth", {
      label: "Patient Authentication",
      subtitle: "Account entry",
      config: program.authConfig || {},
      isFocused: false,
    });
  }

  sortedQuestions.forEach((question) => {
    if (!boxes.has(question.id)) return;

    const branchChoices = new Set<string>();
    const children = branchChildren.get(question.id) || [];
    children.forEach((child) => {
      const triggerValue = triggerValueOf.get(child.id) || "";
      if (triggerValue) branchChoices.add(triggerValue);
      collectVisibilityRules(child.visibilityRuleGroup).forEach((rule) => {
        if (rule.value) branchChoices.add(rule.value);
      });
    });

    const productChoices = new Set<string>();
    allProducts.forEach((product) => {
      const source = getProductSource(product, questionsById);
      if (source && source.questionId === question.id && source.value) productChoices.add(source.value);
    });

    const returnChoices = new Set<string>();
    tempEdges.forEach((edge) => {
      if (edge.kind === "return" && edge.source === question.id && edge.sourceAnswerValue) {
        returnChoices.add(edge.sourceAnswerValue);
      }
    });

    pushNode(question.id, question.kind === "consent"
      ? "consent"
      : question.kind === "section"
        ? "section"
        : "question", {
      question,
      label: question.text,
      isConditional: hasVisibilityRules(question),
      triggerValue: triggerValueOf.get(question.id) || "",
      triggerRules: collectVisibilityRules(question.visibilityRuleGroup),
      childTriggerValues: Array.from(branchChoices),
      branchChoices: Array.from(branchChoices),
      productChoices: Array.from(productChoices),
      returnChoices: Array.from(returnChoices),
      isFocused: false,
      ...(question.kind === "consent"
        ? (() => {
            const sourceId = String(question.elementConfig?.sourceId || "").trim();
            const source = sourceId
              ? allConsents.find((consent) => consent.id === sourceId)
              : undefined;
            return {
              consentProvenance: sourceId ? "library" : "inline",
              consentScopeLabel: sourceId
                ? source?.scope === "global" ? "Global" : "Visit Type"
                : "Conditional",
            };
          })()
        : {}),
    });
  });

  programConsents.forEach((consent) => {
    const id = `consent-form-${consent.id}`;
    pushNode(id, "consent", {
      label: consent.name,
      consents: [consent],
      consentProvenance: "library",
      consentScopeLabel: consent.scope === "global" ? "Global" : "Visit Type",
      isFocused: false,
    });
  });

  if (hasCheckout) {
    pushNode("checkout", "checkout", {
      label: "Checkout",
      checkoutQuestions: program.checkoutQuestions || [],
      isFocused: false,
    });
  }

  allProducts.forEach((product) => {
    const id = `product-card-${product.id}`;
    if (!boxes.has(id)) return;
    pushNode(id, "product", { product, label: product.doseLabel || product.category, isFocused: false });
  });

  pushNode("end", "end", { label: "Complete", subtitle: "Intake finished", isFocused: false });

  return { nodes, edges, diagnostics: normalized.issues };
}

export function applyFocusToProgramFlowGraph(
  graph: GraphData,
  program: Program,
  questions: ProgramQuestion[],
  focusedNodeId?: string | null,
  focusedChoice?: { nodeId: string; value: string } | null
): GraphData {
  const questionIds = new Set(questions.map((question) => question.id));
  const questionsById = new Map(questions.map((question) => [question.id, question]));
  const allProducts = (program.checkoutQuestions || []).flatMap((question) => question.products || []);
  const tracedPath = traceActivePath(
    focusedNodeId,
    graph.edges,
    questionIds,
    questionsById,
    allProducts,
    focusedChoice
  );

  const nodes = graph.nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      isFocused: focusedNodeId === node.id,
      isFocusedPath: tracedPath.activeNodeIds.has(node.id),
      hasActiveFocus: Boolean(focusedChoice),
      focusedChoices: Array.from(tracedPath.activeChoices.get(node.id) || []),
      focusedChoiceKinds: Object.fromEntries(tracedPath.activeChoiceKinds.get(node.id) || []),
    },
  }));

  const edges = graph.edges.map((edge) => {
    const kind = edge.data?.kind || "sequential";
    const active = tracedPath.activeEdgeIds.has(edge.id);
    // Prototype behavior: any endpoint/answer hover puts the canvas into a
    // route-focus state. Every non-matching connector becomes secondary while
    // the exact inbound/outbound connector remains fully readable.
    const dimmed = Boolean(focusedNodeId || focusedChoice) && !active;

    return {
      ...edge,
      markerEnd: markerFor(kind, active, dimmed),
      zIndex: active ? 5 : kind === "return" ? 0 : 1,
      data: {
        ...edge.data,
        kind,
        active,
        dimmed,
      },
    } as ProgramFlowEdge;
  });

  return { nodes, edges, diagnostics: graph.diagnostics };
}

export function getProgramFlowGraph(
  program: Program,
  questions: ProgramQuestion[],
  allConsents: Array<{ id: string; name: string }>,
  direction: "TB" | "LR" = "TB",
  focusedNodeId?: string | null,
  focusedChoice?: { nodeId: string; value: string } | null
): GraphData {
  const staticGraph = buildStaticProgramFlowGraph(program, questions, allConsents, direction);
  return applyFocusToProgramFlowGraph(staticGraph, program, questions, focusedNodeId, focusedChoice);
}
