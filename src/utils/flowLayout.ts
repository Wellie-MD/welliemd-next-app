import dagre from 'dagre';
import { Node, Edge, Position } from 'reactflow';

const nodeWidth = 400;
const nodeHeight = 180;
const quickLayoutXGap = 520;
const quickLayoutYGap = 150;
const quickLayoutStartX = 120;
const quickLayoutStartY = 100;

export const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'LR'  // Changed default to 'LR' for horizontal layout
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 150,  // Increased horizontal spacing to prevent overlap
    ranksep: 250,  // Increased spacing between ranks for better separation
    marginx: 100,  // Increased margins
    marginy: 100,
    align: 'UL',   // Align nodes to upper-left for consistent positioning
  });

  nodes.forEach((node) => {
    // Calculate dynamic height based on node type and content
    let height = nodeHeight;
    
    if (node.type === 'questionNode' && node.data.question?.answer_choices) {
      // Expand height for nodes with answer choices
      const choiceCount = node.data.question.answer_choices.length;
      height = Math.max(nodeHeight, 140 + (choiceCount * 45));
    } else if (node.type === 'disqualifyNode') {
      height = 100; // Smaller for disqualify nodes
    }
    
    dagreGraph.setNode(node.id, { width: nodeWidth, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    // Get the actual height used for this node
    let height = nodeHeight;
    if (node.type === 'questionNode' && node.data.question?.answer_choices) {
      const choiceCount = node.data.question.answer_choices.length;
      height = Math.max(nodeHeight, 140 + (choiceCount * 45));
    } else if (node.type === 'disqualifyNode') {
      height = 100;
    }
    
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export const getQuickStructuredLayout = (
  nodes: Node[],
  edges: Edge[]
) => {
  if (nodes.length === 0) return nodes;

  const nodeIds = new Set(nodes.map((node) => node.id));
  const orderIndexByNodeId = new Map<string, number>();
  nodes.forEach((node) => {
    orderIndexByNodeId.set(
      node.id,
      node.data?.question?.order_index ?? Number.MAX_SAFE_INTEGER
    );
  });
  const questionNodeIds = new Set(
    nodes
      .filter((node) => node.type === 'questionNode')
      .map((node) => node.id)
  );

  const adjacency = new Map<string, Set<string>>();
  const indegree = new Map<string, number>();
  const depth = new Map<string, number>();

  nodes.forEach((node) => {
    adjacency.set(node.id, new Set());
    indegree.set(node.id, 0);
    depth.set(node.id, 0);
  });

  const dedupEdgeKeys = new Set<string>();
  edges.forEach((edge) => {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) return;
    if (edge.source === 'disqualify-node') return;

    const key = `${edge.source}->${edge.target}`;
    if (dedupEdgeKeys.has(key)) return;
    dedupEdgeKeys.add(key);

    adjacency.get(edge.source)!.add(edge.target);
    indegree.set(edge.target, (indegree.get(edge.target) || 0) + 1);
  });

  const sortByQuestionOrder = (aId: string, bId: string) => {
    const aOrder = orderIndexByNodeId.get(aId) ?? Number.MAX_SAFE_INTEGER;
    const bOrder = orderIndexByNodeId.get(bId) ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return aId.localeCompare(bId);
  };

  const queue = Array.from(nodeIds)
    .filter((nodeId) => nodeId !== 'disqualify-node' && (indegree.get(nodeId) || 0) === 0)
    .sort(sortByQuestionOrder);

  let cursor = 0;
  while (cursor < queue.length) {
    const currentId = queue[cursor];
    cursor += 1;

    const currentDepth = depth.get(currentId) || 0;
    const targets = Array.from(adjacency.get(currentId) || []).sort(sortByQuestionOrder);

    targets.forEach((targetId) => {
      const nextDepth = currentDepth + 1;
      if ((depth.get(targetId) || 0) < nextDepth) {
        depth.set(targetId, nextDepth);
      }

      indegree.set(targetId, (indegree.get(targetId) || 0) - 1);
      if ((indegree.get(targetId) || 0) === 0) {
        queue.push(targetId);
      }
    });
  }

  // Fallback for cyclic/disconnected leftovers to keep deterministic ordering.
  const maxKnownDepth = Math.max(...Array.from(depth.values()));
  Array.from(nodeIds)
    .filter((nodeId) => nodeId !== 'disqualify-node')
    .sort(sortByQuestionOrder)
    .forEach((nodeId, index) => {
      if ((indegree.get(nodeId) || 0) > 0 && (depth.get(nodeId) || 0) === 0) {
        depth.set(nodeId, Math.max(0, maxKnownDepth - 1 + (index % 2)));
      }
    });

  const buckets = new Map<number, string[]>();
  Array.from(nodeIds)
    .filter((nodeId) => nodeId !== 'disqualify-node')
    .forEach((nodeId) => {
      const bucketDepth = depth.get(nodeId) || 0;
      if (!buckets.has(bucketDepth)) {
        buckets.set(bucketDepth, []);
      }
      buckets.get(bucketDepth)!.push(nodeId);
    });

  buckets.forEach((bucket) => bucket.sort(sortByQuestionOrder));

  const positionedById = new Map<string, { x: number; y: number }>();
  let maxDepth = 0;

  Array.from(buckets.keys())
    .sort((a, b) => a - b)
    .forEach((bucketDepth) => {
      const bucket = buckets.get(bucketDepth)!;
      maxDepth = Math.max(maxDepth, bucketDepth);
      bucket.forEach((nodeId, index) => {
        const x = quickLayoutStartX + bucketDepth * quickLayoutXGap;
        const y = quickLayoutStartY + index * quickLayoutYGap + (bucketDepth % 2) * 20;
        positionedById.set(nodeId, { x, y });
      });
    });

  // Place disqualify node to the far right, centered around linked source nodes if possible.
  const disqualifySourcesY = edges
    .filter((edge) => edge.target === 'disqualify-node' && questionNodeIds.has(edge.source))
    .map((edge) => positionedById.get(edge.source)?.y)
    .filter((y): y is number => typeof y === 'number');

  if (nodeIds.has('disqualify-node')) {
    const yFallback = quickLayoutStartY + Math.max(0, nodes.length - 1) * 60;
    const yAverage =
      disqualifySourcesY.length > 0
        ? Math.round(disqualifySourcesY.reduce((sum, y) => sum + y, 0) / disqualifySourcesY.length)
        : yFallback;
    positionedById.set('disqualify-node', {
      x: quickLayoutStartX + (maxDepth + 1) * quickLayoutXGap,
      y: yAverage,
    });
  }

  return nodes.map((node) => {
    const nextPosition = positionedById.get(node.id);
    if (!nextPosition) return node;

    return {
      ...node,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      position: nextPosition,
    };
  });
};

export const validateFlow = (nodes: Node[], edges: Edge[]) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for disconnected nodes (except start node)
  const connectedNodes = new Set<string>();
  edges.forEach(edge => {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  });

  const disconnectedNodes = nodes.filter(
    node => node.type !== 'startNode' && !connectedNodes.has(node.id)
  );

  if (disconnectedNodes.length > 0) {
    warnings.push(`${disconnectedNodes.length} disconnected question(s) found`);
  }

  // Check for cycles
  const hasCycle = detectCycle(nodes, edges);
  if (hasCycle) {
    errors.push('Circular dependency detected in flow');
  }

  // Check for missing question text
  const emptyQuestions = nodes.filter(
    node => node.type === 'questionNode' && !node.data.question?.question_text
  );

  if (emptyQuestions.length > 0) {
    warnings.push(`${emptyQuestions.length} question(s) missing text`);
  }

  // Check for choice questions without choices
  const choiceTypes = ['single_choice', 'multiple_choice'];
  const questionsWithoutChoices = nodes.filter(
    node => 
      node.type === 'questionNode' &&
      choiceTypes.includes(node.data.question?.question_type) &&
      (!node.data.question?.answer_choices || node.data.question.answer_choices.length === 0)
  );

  if (questionsWithoutChoices.length > 0) {
    errors.push(`${questionsWithoutChoices.length} choice question(s) missing answer options`);
  }

  return { errors, warnings, isValid: errors.length === 0 };
};

function detectCycle(nodes: Node[], edges: Edge[]): boolean {
  const graph = new Map<string, string[]>();
  
  // Build adjacency list
  nodes.forEach(node => graph.set(node.id, []));
  edges.forEach(edge => {
    const neighbors = graph.get(edge.source) || [];
    neighbors.push(edge.target);
    graph.set(edge.source, neighbors);
  });

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        return true; // Cycle detected
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const nodeId of graph.keys()) {
    if (!visited.has(nodeId)) {
      if (dfs(nodeId)) return true;
    }
  }

  return false;
}
