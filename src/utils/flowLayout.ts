import dagre from 'dagre';
import { Node, Edge, Position } from 'reactflow';

const nodeWidth = 400;
const nodeHeight = 180;

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
