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
  const questionNodes = generateQuestionNodes(questions);
  
  // Check if any question has disqualifying logic
  const hasDisqualifyingQuestions = questions.some((q) => {
    const validationRules = q.validation_rules as unknown;
    return validationRules?.disqualifying_answer || validationRules?.disqualifying_answers;
  });
  
  // Create single shared disqualify node if needed
  const disqualifyNode = hasDisqualifyingQuestions ? generateSharedDisqualifyNode() : null;
  
  const edges = generateEdges(questions, questionNodes, disqualifyNode);

  // Combine all nodes
  let allNodes = disqualifyNode ? [...questionNodes, disqualifyNode] : questionNodes;
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
      disqualifyNodes: disqualifyNode ? 1 : 0,
      totalEdges: allEdges.length,
    },
  };
}

// ==================== NODE GENERATION ====================

/**
 * Generate question nodes from questions array
 */
function generateQuestionNodes(questions: Question[]): Node[] {
  const questionNodes: Node[] = [];

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
  });

  return questionNodes;
}

/**
 * Generate a single shared disqualification node
 */
function generateSharedDisqualifyNode(): Node {
  return {
    id: "disqualify-node",
    type: "disqualifyNode",
    position: {
      x: 800, // Will be repositioned by layout
      y: 400,
    },
    data: {
      reason: "Visit Disqualified",
      sourceQuestion: "multiple",
      triggerValue: "various",
    },
  };
}

// ==================== EDGE GENERATION ====================

/**
 * Generate edges representing follow-up relationships and disqualification paths
 */
function generateEdges(questions: Question[], questionNodes: Node[], disqualifyNode: Node | null): Edge[] {
  const edges: Edge[] = [];

  // Sort questions by order_index for sequential edges
  const sortedQuestions = [...questions].sort(
    (a, b) => (a.order_index || 0) - (b.order_index || 0)
  );

  // First pass: Identify questions that have outgoing conditional logic
  // These questions should NOT have sequential edges because they branch conditionally
  const questionsWithConditionalBranching = new Set<string>();
  
  questions.forEach((question) => {
    const validationRules = question.validation_rules as unknown;
    
    // Check if this question has disqualifying answers (creates branching)
    if (validationRules?.disqualifying_answer || validationRules?.disqualifying_answers) {
      questionsWithConditionalBranching.add(question.id);
    }
    
    // Check if OTHER questions have conditional logic that depends on THIS question
    // If so, this question has conditional branching
    const hasConditionalChildren = questions.some((otherQ) => {
      const logic = otherQ.conditional_logic as ConditionalLogic;
      if (!logic?.show_if) return false;
      
      // Check if the show_if references this question (by ID or legacy order_index)
      if (logic.show_if.question_id === question.id) return true;
      
      // Check legacy format (q_4 -> order_index 4)
      if (logic.show_if.question_id.startsWith("q_")) {
        const orderIndex = parseInt(logic.show_if.question_id.substring(2), 10);
        if (!isNaN(orderIndex) && question.order_index === orderIndex) return true;
      }
      
      return false;
    });
    
    if (hasConditionalChildren) {
      questionsWithConditionalBranching.add(question.id);
    }
  });

  // Group questions by their show_if condition to handle duplicates
  // Key: "parentQuestionId|value", Value: array of questions with that condition
  const conditionalGroups = new Map<string, Question[]>();
  
  questions.forEach((question) => {
    const logic = question.conditional_logic as ConditionalLogic;
    if (logic?.show_if) {
      const key = `${logic.show_if.question_id}|${logic.show_if.value}`;
      if (!conditionalGroups.has(key)) {
        conditionalGroups.set(key, []);
      }
      conditionalGroups.get(key)!.push(question);
    }
  });

  // Identify questions that should receive conditional edges (only the FIRST in each group)
  // and questions that should be chained sequentially (the REST in each group)
  const questionsWithIncomingConditional = new Set<string>();
  const questionsInConditionalChain = new Set<string>();
  
  conditionalGroups.forEach((groupQuestions) => {
    // Sort by order_index to get the correct sequence
    const sorted = groupQuestions.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    
    // First question gets the conditional edge
    if (sorted.length > 0) {
      questionsWithIncomingConditional.add(sorted[0].id);
    }
    
    // Rest are part of the sequential chain (should not have incoming sequential from previous questions)
    for (let i = 1; i < sorted.length; i++) {
      questionsInConditionalChain.add(sorted[i].id);
    }
  });

  // Build a map of which choices have conditional/disqualify rules
  // Key: "questionId|choiceValue", Value: true if this choice has a rule
  const choicesWithRules = new Map<string, boolean>();
  
  console.log('=== Building choicesWithRules map ===');
  questions.forEach((question) => {
    // Check for disqualifying answers
    const validationRules = question.validation_rules as unknown;
    if (validationRules?.disqualifying_answer) {
      choicesWithRules.set(`${question.id}|${validationRules.disqualifying_answer}`, true);
    }
    if (validationRules?.disqualifying_answers && Array.isArray(validationRules.disqualifying_answers)) {
      validationRules.disqualifying_answers.forEach((answer: string) => {
        choicesWithRules.set(`${question.id}|${answer}`, true);
      });
    }
    
    // Check for conditional children (other questions that depend on this question's choices)
    questions.forEach((otherQ) => {
      const logic = otherQ.conditional_logic as ConditionalLogic;
      if (!logic?.show_if) return;
      
      // Check if this is the parent question
      let isParent = logic.show_if.question_id === question.id;
      
      // Check legacy format
      if (!isParent && logic.show_if.question_id.startsWith("q_")) {
        const orderIndex = parseInt(logic.show_if.question_id.substring(2), 10);
        if (!isNaN(orderIndex) && question.order_index === orderIndex) {
          isParent = true;
        }
      }
      
      if (isParent) {
        const key = `${question.id}|${logic.show_if.value}`;
        console.log(`  Conditional rule: Q${question.order_index} choice "${logic.show_if.value}" triggers Q${otherQ.order_index}`);
        choicesWithRules.set(key, true);
      }
    });
  });
  
  console.log(`Total choices with rules: ${choicesWithRules.size}`);

  // Generate order-based edges (sequential flow)
  for (let i = 0; i < sortedQuestions.length - 1; i++) {
    const currentQuestion = sortedQuestions[i];
    const nextQuestion = sortedQuestions[i + 1];

    // Check if next question is the FIRST in a conditional group
    const nextIsFirstConditional = questionsWithIncomingConditional.has(nextQuestion.id) && 
                                   !questionsInConditionalChain.has(nextQuestion.id);

    // Check if current question has multiple choices
    const hasChoices = currentQuestion.answer_choices && currentQuestion.answer_choices.length > 0;
    const isConsentQuestion = currentQuestion.question_type === 'consent';
    
    if (hasChoices || isConsentQuestion) {
      // For questions with choices, we need to find the ACTUAL next sequential question
      // If nextQuestion is conditional, we need to skip to the question after it
      let targetQuestion = nextQuestion;
      let targetIndex = i + 1;
      
      // If next question is conditional, find the next non-conditional question
      if (nextIsFirstConditional) {
        // Find the next question that is NOT a first conditional
        for (let j = i + 2; j < sortedQuestions.length; j++) {
          const candidateQuestion = sortedQuestions[j];
          const isFirstConditional = questionsWithIncomingConditional.has(candidateQuestion.id) && 
                                    !questionsInConditionalChain.has(candidateQuestion.id);
          
          if (!isFirstConditional) {
            targetQuestion = candidateQuestion;
            targetIndex = j;
            break;
          }
        }
      }
      
      // Create edges from choices that DON'T have conditional/disqualify rules
      const choices = currentQuestion.answer_choices;
      
      choices.forEach((choice, choiceIndex) => {
        const choiceKey = `${currentQuestion.id}|${choice}`;
        const hasRule = choicesWithRules.has(choiceKey);
        
        // Only create sequential edge if this choice doesn't have a rule
        if (!hasRule) {
          console.log(`Creating sequential edge: Q${currentQuestion.order_index} choice "${choice}" -> Q${targetQuestion.order_index}`);
          edges.push({
            id: `e-order-${currentQuestion.id}-choice-${choiceIndex}-${targetQuestion.id}`,
            source: currentQuestion.id,
            sourceHandle: `choice-${choiceIndex}`,
            target: targetQuestion.id,
            type: "default",
            animated: false,
            style: { stroke: "#94a3b8", strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#94a3b8",
            },
          });
        } else {
          console.log(`Skipping sequential edge for Q${currentQuestion.order_index} choice "${choice}" (has rule)`);
        }
      });
    } else {
      // For non-choice questions, skip if next is conditional
      if (nextIsFirstConditional) {
        console.log(`Skipping sequential edge from Q${currentQuestion.order_index} to Q${nextQuestion.order_index} (next is first conditional)`);
        continue;
      }
      
      // Single edge for non-choice questions (text, textarea, number, etc.)
      edges.push({
        id: `e-order-${currentQuestion.id}-${nextQuestion.id}`,
        source: currentQuestion.id,
        target: nextQuestion.id,
        type: "default",
        animated: false,
        style: { stroke: "#94a3b8", strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#94a3b8",
        },
      });
    }
  }

  // Generate conditional logic edges (only to FIRST question in each group)
  const processedConditionalGroups = new Set<string>();
  
  questions.forEach((question) => {
    const logic = question.conditional_logic as ConditionalLogic;

    // Generate follow-up edges (show_if) - but only for the FIRST question in each group
    if (logic?.show_if) {
      const groupKey = `${logic.show_if.question_id}|${logic.show_if.value}`;
      
      // Only create edge if this is the first question in this conditional group
      if (!processedConditionalGroups.has(groupKey)) {
        processedConditionalGroups.add(groupKey);
        
        const followUpEdges = generateFollowUpEdges(
          question,
          logic.show_if,
          questions
        );
        edges.push(...followUpEdges);
      }
    }

    // Generate disqualify edges from validation_rules
    if (disqualifyNode) {
      const disqualifyEdges = generateDisqualifyEdgesFromValidation(
        question,
        disqualifyNode.id
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
 * Generate edges for disqualification paths from validation_rules
 */
function generateDisqualifyEdgesFromValidation(
  question: Question,
  disqualifyNodeId: string
): Edge[] {
  const edges: Edge[] = [];
  const validationRules = question.validation_rules as unknown;

  if (!validationRules) return edges;

  // Get disqualifying answers from validation_rules
  const disqualifyingAnswers: string[] = [];
  
  if (validationRules.disqualifying_answer) {
    disqualifyingAnswers.push(validationRules.disqualifying_answer);
  }
  
  if (validationRules.disqualifying_answers && Array.isArray(validationRules.disqualifying_answers)) {
    disqualifyingAnswers.push(...validationRules.disqualifying_answers);
  }

  if (disqualifyingAnswers.length === 0) return edges;

  // Create edges for each disqualifying answer
  disqualifyingAnswers.forEach((answer) => {
    if (!question.answer_choices) return;

    const choiceIndex = question.answer_choices.indexOf(answer);

    if (choiceIndex === -1) {
      console.warn(
        `Disqualifying answer "${answer}" not found in choices for question ${question.id}`
      );
      return;
    }

    edges.push({
      id: `e-${question.id}-choice-${choiceIndex}-disqualify`,
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
        label: "Disqualifies",
        condition: {
          value: answer,
          operator: "disqualify",
        },
      },
      label: "Disqualifies",
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
        strokeDasharray: "5,5",
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
