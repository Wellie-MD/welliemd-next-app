import { Edge } from "reactflow";
import { Question, QuestionnaireTemplate } from "@/api/questionnaires";

const DEFAULT_HUB_THRESHOLD = 8;
const MAX_TOP_HUBS = 5;

export interface FlowMetrics {
  templateId: string;
  templateName: string;
  questionCount: number;
  renderedNodeCount: number;
  renderedEdgeCount: number;
  rootQuestionCount: number;
  conditionalQuestionCount: number;
  disqualifyingQuestionCount: number;
  multiParentQuestionCount: number;
  maxParentsOnQuestion: number;
  hubThreshold: number;
  hubCount: number;
  maxFanOut: number;
  estimatedDepth: number | null;
  hasCycle: boolean;
  complexityScore: number;
  topHubs: Array<{
    questionId: string;
    orderIndex: number;
    fanOut: number;
    questionText: string;
  }>;
}

interface FlowMetricsInput {
  nodeCount: number;
  edges: Edge[];
  rootNodeIds: string[];
  hubThreshold?: number;
}

export function buildFlowMetrics(
  template: QuestionnaireTemplate,
  input: FlowMetricsInput
): FlowMetrics {
  const questions = Array.isArray(template.questions) ? template.questions : [];
  const hubThreshold = input.hubThreshold ?? DEFAULT_HUB_THRESHOLD;

  const questionIds = new Set(questions.map((q) => q.id));
  const outDegree = new Map<string, number>();

  input.edges.forEach((edge) => {
    if (!questionIds.has(edge.source)) return;
    outDegree.set(edge.source, (outDegree.get(edge.source) || 0) + 1);
  });

  const hubs = questions
    .map((question) => {
      const fanOut = outDegree.get(question.id) || 0;
      return {
        questionId: question.id,
        orderIndex: question.order_index,
        fanOut,
        questionText: question.question_text,
      };
    })
    .filter((entry) => entry.fanOut >= hubThreshold)
    .sort((a, b) => b.fanOut - a.fanOut);

  const maxFanOut = hubs.length > 0 ? hubs[0].fanOut : 0;

  const conditionalQuestionCount = questions.filter((question) => {
    const showIf = (question.conditional_logic as { show_if?: unknown })?.show_if;
    return Boolean(showIf);
  }).length;

  const disqualifyingQuestionCount = questions.filter((question) => {
    const rules = question.validation_rules as {
      disqualifying_answer?: unknown;
      disqualifying_answers?: unknown;
    };

    if (rules?.disqualifying_answer) return true;
    return Array.isArray(rules?.disqualifying_answers) && rules.disqualifying_answers.length > 0;
  }).length;

  const parentCounts = questions.map(getParentCount);
  const multiParentQuestionCount = parentCounts.filter((count) => count > 1).length;
  const maxParentsOnQuestion = parentCounts.length > 0 ? Math.max(...parentCounts) : 0;

  const depthEstimate = estimateDepth(questions, input.edges);
  const complexityScore =
    questions.length +
    input.edges.length * 1.5 +
    hubs.length * 8 +
    multiParentQuestionCount * 3;

  return {
    templateId: template.id,
    templateName: template.name,
    questionCount: questions.length,
    renderedNodeCount: input.nodeCount,
    renderedEdgeCount: input.edges.length,
    rootQuestionCount: input.rootNodeIds.length,
    conditionalQuestionCount,
    disqualifyingQuestionCount,
    multiParentQuestionCount,
    maxParentsOnQuestion,
    hubThreshold,
    hubCount: hubs.length,
    maxFanOut,
    estimatedDepth: depthEstimate.depth,
    hasCycle: depthEstimate.hasCycle,
    complexityScore: Math.round(complexityScore),
    topHubs: hubs.slice(0, MAX_TOP_HUBS),
  };
}

function getParentCount(question: Question): number {
  const showIf = (question.conditional_logic as { show_if?: unknown })?.show_if;
  if (!showIf) return 0;
  if (Array.isArray(showIf)) return showIf.length;
  return typeof showIf === "object" ? 1 : 0;
}

function estimateDepth(questions: Question[], edges: Edge[]): {
  depth: number | null;
  hasCycle: boolean;
} {
  const questionIds = new Set(questions.map((question) => question.id));

  const adjacency = new Map<string, string[]>();
  const indegree = new Map<string, number>();
  const depthMap = new Map<string, number>();

  questions.forEach((question) => {
    adjacency.set(question.id, []);
    indegree.set(question.id, 0);
    depthMap.set(question.id, 0);
  });

  edges.forEach((edge) => {
    if (!questionIds.has(edge.source) || !questionIds.has(edge.target)) return;
    adjacency.get(edge.source)!.push(edge.target);
    indegree.set(edge.target, (indegree.get(edge.target) || 0) + 1);
  });

  const queue: string[] = [];
  indegree.forEach((value, key) => {
    if (value === 0) queue.push(key);
  });

  let visited = 0;
  let maxDepth = 0;

  while (queue.length > 0) {
    const current = queue.shift()!;
    visited += 1;
    const currentDepth = depthMap.get(current) || 0;
    maxDepth = Math.max(maxDepth, currentDepth);

    const neighbors = adjacency.get(current) || [];
    neighbors.forEach((target) => {
      const nextDepth = currentDepth + 1;
      depthMap.set(target, Math.max(depthMap.get(target) || 0, nextDepth));
      indegree.set(target, (indegree.get(target) || 0) - 1);
      if ((indegree.get(target) || 0) === 0) {
        queue.push(target);
      }
    });
  }

  const hasCycle = visited !== questions.length;
  return {
    depth: hasCycle ? null : maxDepth,
    hasCycle,
  };
}
