/**
 * Flow Generator Service
 *
 * Parses questionnaire template API responses and generates React-Flow compatible
 * nodes and edges for visual flow representation. Handles conditional logic,
 * follow-up questions, and disqualification paths.
 */

import { Node, Edge, MarkerType } from "reactflow";
import { Question, QuestionnaireTemplate } from "@/api/questionnaires";
import { getLayoutedElements } from "@/utils/flowLayout";

// ==================== TYPES ====================

export interface FlowGenerationResult {
  nodes: Node[];
  edges: Edge[];
  rootNodes: string[];
  stats: {
    totalQuestions: number;
    rootQuestions: number;
    conditionalQuestions: number;
    disqualifyNodes: number;
    totalEdges: number;
  };
}

interface ConditionalLogic {
  show_if?: {
    question_id: string;
    value: string;
    operator: string;
  };
  disqualify_if?:
    | Array<{
        value: string;
        operator?: string;
        reason?: string;
      }>
    | {
        value: string;
        operator?: string;
        reason?: string;
      };
}

// ==================== MAIN GENERATOR ====================

/**
 * Generate nodes and edges from a questionnaire template
 *
 * @param template - The questionnaire template with questions
 * @param autoLayout - Whether to apply automatic layout (default: true)
 * @returns FlowGenerationResult with nodes, edges, and metadata
 */
export function generateFlowFromTemplate(
  template: QuestionnaireTemplate,
  autoLayout: boolean = true
): FlowGenerationResult {
  const questions = template.questions || [];

  if (questions.length === 0) {
    return {
      nodes: [],
      edges: [],
      rootNodes: [],
      stats: {
        totalQuestions: 0,
        rootQuestions: 0,
        conditionalQuestions: 0,
        disqualifyNodes: 0,
        totalEdges: 0,
      },
    };
  }

  // Generate nodes and edges
  const { questionNodes, disqualifyNodes } = generateNodes(questions);
  const edges = generateEdges(questions, questionNodes);

  // Combine all nodes
  let allNodes = [...questionNodes, ...disqualifyNodes];
  let allEdges = edges;

  // Apply automatic layout if requested
  if (autoLayout) {
    const layouted = getLayoutedElements(allNodes, allEdges, "LR"); // Horizontal layout
    allNodes = layouted.nodes;
    allEdges = layouted.edges;
  }

  // Identify root nodes (questions with no incoming edges)
  const nodesWithIncoming = new Set(allEdges.map((e) => e.target));
  const rootNodes = questionNodes
    .filter((n) => !nodesWithIncoming.has(n.id))
    .map((n) => n.id);

  // Calculate stats
  const conditionalCount = questions.filter(
    (q) => q.conditional_logic?.show_if
  ).length;

  return {
    nodes: allNodes,
    edges: allEdges,
    rootNodes,
    stats: {
      totalQuestions: questions.length,
      rootQuestions: rootNodes.length,
      conditionalQuestions: conditionalCount,
      disqualifyNodes: disqualifyNodes.length,
      totalEdges: allEdges.length,
    },
  };
}

// ==================== NODE GENERATION ====================

/**
 * Generate question nodes and disqualify nodes from questions array
 */
function generateNodes(questions: Question[]): {
  questionNodes: Node[];
  disqualifyNodes: Node[];
} {
  const questionNodes: Node[] = [];
  const disqualifyNodes: Node[] = [];

  questions.forEach((question, index) => {
    // Create question node
    const questionNode: Node = {
      id: question.id,
      type: "questionNode",
      position: {
        x: 100 + (index % 3) * 400,
        y: 100 + Math.floor(index / 3) * 250,
      },
      data: {
        question,
        isLocked: !question.can_be_modified,
      },
    };

    questionNodes.push(questionNode);

    // Generate disqualify nodes if present
    const disqualifyNodesForQuestion = generateDisqualifyNodes(question, index);
    disqualifyNodes.push(...disqualifyNodesForQuestion);
  });

  return { questionNodes, disqualifyNodes };
}

/**
 * Generate disqualify nodes for a question based on conditional_logic.disqualify_if
 */
function generateDisqualifyNodes(
  question: Question,
  questionIndex: number
): Node[] {
  const disqualifyNodes: Node[] = [];
  const logic = question.conditional_logic as ConditionalLogic;

  if (!logic?.disqualify_if) {
    return disqualifyNodes;
  }

  // Normalize to array
  const disqualifyConditions = Array.isArray(logic.disqualify_if)
    ? logic.disqualify_if
    : [logic.disqualify_if];

  disqualifyConditions.forEach((condition, condIdx) => {
    const disqualifyNodeId = `disqualify-${question.id}-${condIdx}`;

    disqualifyNodes.push({
      id: disqualifyNodeId,
      type: "disqualifyNode",
      position: {
        x: 100 + (questionIndex % 3) * 400 + 450,
        y: 100 + Math.floor(questionIndex / 3) * 250 + condIdx * 120,
      },
      data: {
        reason: condition.reason || "Visit disqualified",
        sourceQuestion: question.id,
        triggerValue: condition.value,
      },
    });
  });

  return disqualifyNodes;
}

// ==================== EDGE GENERATION ====================

/**
 * Generate edges representing follow-up relationships and disqualification paths
 */
function generateEdges(questions: Question[], questionNodes: Node[]): Edge[] {
  const edges: Edge[] = [];

  // Sort questions by order_index for sequential edges
  const sortedQuestions = [...questions].sort(
    (a, b) => (a.order_index || 0) - (b.order_index || 0)
  );

  // Generate order-based edges (sequential flow)
  for (let i = 0; i < sortedQuestions.length - 1; i++) {
    const currentQuestion = sortedQuestions[i];
    const nextQuestion = sortedQuestions[i + 1];

    // Only create order edge if next question doesn't have conditional logic
    // (conditional logic edges will be created separately)
    const nextLogic = nextQuestion.conditional_logic as ConditionalLogic;
    if (!nextLogic?.show_if) {
      edges.push({
        id: `e-order-${currentQuestion.id}-${nextQuestion.id}`,
        source: currentQuestion.id,
        target: nextQuestion.id,
        type: "default", // Simple solid arrow
        animated: false,
        style: { stroke: "#94a3b8", strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#94a3b8",
        },
      });
    }
  }

  // Generate conditional logic edges
  questions.forEach((question) => {
    const logic = question.conditional_logic as ConditionalLogic;

    // Generate follow-up edges (show_if)
    if (logic?.show_if) {
      const followUpEdges = generateFollowUpEdges(
        question,
        logic.show_if,
        questions
      );
      edges.push(...followUpEdges);
    }

    // Generate disqualify edges (disqualify_if)
    if (logic?.disqualify_if) {
      const disqualifyEdges = generateDisqualifyEdges(
        question,
        logic.disqualify_if
      );
      edges.push(...disqualifyEdges);
    }
  });

  return edges;
}

/**
 * Generate edges for follow-up questions (conditional_logic.show_if)
 */
function generateFollowUpEdges(
  targetQuestion: Question,
  showIf: { question_id: string; value: string; operator: string },
  allQuestions: Question[]
): Edge[] {
  const edges: Edge[] = [];

  // Try to find source question by ID or by legacy order_index (q_9 -> order_index 9)
  let sourceQuestion = allQuestions.find((q) => q.id === showIf.question_id);

  if (!sourceQuestion && showIf.question_id.startsWith("q_")) {
    // Extract order index from legacy ID (e.g., "q_9" -> 9)
    const orderIndex = parseInt(showIf.question_id.substring(2), 10);
    if (!isNaN(orderIndex)) {
      sourceQuestion = allQuestions.find((q) => q.order_index === orderIndex);
    }
  }

  if (!sourceQuestion) {
    console.warn(
      `Source question ${showIf.question_id} not found for follow-up to ${targetQuestion.id}`
    );
    return edges;
  }

  // Find the choice index for the trigger value
  let sourceHandle: string | undefined;

  if (
    sourceQuestion.answer_choices &&
    sourceQuestion.answer_choices.length > 0
  ) {
    const choiceIndex = sourceQuestion.answer_choices.indexOf(showIf.value);

    if (choiceIndex !== -1) {
      sourceHandle = `choice-${choiceIndex}`;
    } else {
      // Value not found in choices - might be a custom condition
      console.warn(
        `Value "${showIf.value}" not found in choices for question ${sourceQuestion.id}`
      );
    }
  }

  // Create edge with label
  const edgeLabel = formatConditionLabel(showIf.value, showIf.operator);

  edges.push({
    id: `e-conditional-${sourceQuestion.id}-${targetQuestion.id}`,
    source: sourceQuestion.id,
    sourceHandle,
    target: targetQuestion.id,
    type: "conditional",
    animated: true,
    style: { strokeDasharray: "5,5" }, // Dotted line
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#60a5fa",
    },
    data: {
      label: edgeLabel,
      condition: {
        value: showIf.value,
        operator: showIf.operator,
      },
    },
    label: edgeLabel,
    labelStyle: {
      fill: "#1e40af",
      fontWeight: 500,
      fontSize: 12,
    },
    labelBgStyle: {
      fill: "#eff6ff",
      fillOpacity: 0.9,
    },
    labelBgPadding: [8, 4] as [number, number],
    labelBgBorderRadius: 4,
  });

  return edges;
}

/**
 * Generate edges for disqualification paths
 */
function generateDisqualifyEdges(
  question: Question,
  disqualifyIf: ConditionalLogic["disqualify_if"]
): Edge[] {
  const edges: Edge[] = [];

  if (!disqualifyIf) return edges;

  // Normalize to array
  const disqualifyConditions = Array.isArray(disqualifyIf)
    ? disqualifyIf
    : [disqualifyIf];

  disqualifyConditions.forEach((condition, condIdx) => {
    if (!question.answer_choices) return;

    const choiceIndex = question.answer_choices.indexOf(condition.value);

    if (choiceIndex === -1) {
      console.warn(
        `Disqualify value "${condition.value}" not found in choices for question ${question.id}`
      );
      return;
    }

    const disqualifyNodeId = `disqualify-${question.id}-${condIdx}`;

    edges.push({
      id: `e-${question.id}-choice-${choiceIndex}-disqualify-${condIdx}`,
      source: question.id,
      sourceHandle: `choice-${choiceIndex}`,
      target: disqualifyNodeId,
      type: "conditional",
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#ef4444",
      },
      data: {
        label: "Disqualify",
        condition: {
          value: condition.value,
          operator: "disqualify",
        },
      },
      label: "Disqualify",
      labelStyle: {
        fill: "#991b1b",
        fontWeight: 600,
        fontSize: 12,
      },
      labelBgStyle: {
        fill: "#fee2e2",
        fillOpacity: 0.9,
      },
      labelBgPadding: [8, 4] as [number, number],
      labelBgBorderRadius: 4,
      style: {
        stroke: "#ef4444",
        strokeWidth: 2,
      },
    });
  });

  return edges;
}

// ==================== HELPERS ====================

/**
 * Format condition label for edge display
 */
function formatConditionLabel(value: string, operator: string): string {
  const operatorMap: Record<string, string> = {
    equals: "=",
    not_equals: "≠",
    contains: "⊃",
    greater_than: ">",
    less_than: "<",
    greater_than_or_equal: "≥",
    less_than_or_equal: "≤",
  };

  const operatorSymbol = operatorMap[operator] || operator;

  // Truncate long values
  const displayValue =
    value.length > 30 ? `${value.substring(0, 27)}...` : value;

  return `If "${displayValue}" ${operatorSymbol}`;
}

/**
 * Update existing flow with new question
 * Useful for adding questions dynamically without regenerating entire flow
 */
export function addQuestionToFlow(
  currentNodes: Node[],
  currentEdges: Edge[],
  newQuestion: Question,
  autoLayout: boolean = false
): FlowGenerationResult {
  // Create new question node
  const newNode: Node = {
    id: newQuestion.id,
    type: "questionNode",
    position: {
      x: 100 + Math.random() * 400,
      y: 100 + Math.random() * 400,
    },
    data: {
      question: newQuestion,
      isLocked: !newQuestion.can_be_modified,
    },
  };

  let nodes = [...currentNodes, newNode];
  let edges = [...currentEdges];

  // Generate edges for the new question
  const logic = newQuestion.conditional_logic as ConditionalLogic;

  if (logic?.show_if) {
    const allQuestions = currentNodes
      .filter((n) => n.type === "questionNode")
      .map((n) => n.data.question);

    const newEdges = generateFollowUpEdges(newQuestion, logic.show_if, [
      ...allQuestions,
      newQuestion,
    ]);
    edges.push(...newEdges);
  }

  // Generate disqualify nodes and edges
  if (logic?.disqualify_if) {
    const disqualifyNodes = generateDisqualifyNodes(newQuestion, nodes.length);
    nodes.push(...disqualifyNodes);

    const disqualifyEdges = generateDisqualifyEdges(
      newQuestion,
      logic.disqualify_if
    );
    edges.push(...disqualifyEdges);
  }

  // Apply layout if requested
  if (autoLayout) {
    const layouted = getLayoutedElements(nodes, edges, "TB");
    nodes = layouted.nodes;
    edges = layouted.edges;
  }

  const nodesWithIncoming = new Set(edges.map((e) => e.target));
  const rootNodes = nodes
    .filter((n) => n.type === "questionNode" && !nodesWithIncoming.has(n.id))
    .map((n) => n.id);

  return {
    nodes,
    edges,
    rootNodes,
    stats: {
      totalQuestions: nodes.filter((n) => n.type === "questionNode").length,
      rootQuestions: rootNodes.length,
      conditionalQuestions: nodes.filter(
        (n) =>
          n.type === "questionNode" &&
          n.data.question?.conditional_logic?.show_if
      ).length,
      disqualifyNodes: nodes.filter((n) => n.type === "disqualifyNode").length,
      totalEdges: edges.length,
    },
  };
}

/**
 * Remove question from flow and clean up related edges
 */
export function removeQuestionFromFlow(
  currentNodes: Node[],
  currentEdges: Edge[],
  questionId: string
): FlowGenerationResult {
  // Remove the question node and any related disqualify nodes
  const nodes = currentNodes.filter(
    (n) => n.id !== questionId && !n.id.startsWith(`disqualify-${questionId}`)
  );

  // Remove edges connected to this question
  const edges = currentEdges.filter(
    (e) =>
      e.source !== questionId &&
      e.target !== questionId &&
      !e.target.startsWith(`disqualify-${questionId}`)
  );

  const nodesWithIncoming = new Set(edges.map((e) => e.target));
  const rootNodes = nodes
    .filter((n) => n.type === "questionNode" && !nodesWithIncoming.has(n.id))
    .map((n) => n.id);

  return {
    nodes,
    edges,
    rootNodes,
    stats: {
      totalQuestions: nodes.filter((n) => n.type === "questionNode").length,
      rootQuestions: rootNodes.length,
      conditionalQuestions: nodes.filter(
        (n) =>
          n.type === "questionNode" &&
          n.data.question?.conditional_logic?.show_if
      ).length,
      disqualifyNodes: nodes.filter((n) => n.type === "disqualifyNode").length,
      totalEdges: edges.length,
    },
  };
}
