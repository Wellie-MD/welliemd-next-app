import { Edge, Node } from "reactflow";

export interface HubNode {
  questionId: string;
  orderIndex: number;
  fanOut: number;
  questionText: string;
}

interface GraphIndex {
  outgoing: Map<string, Set<string>>;
  incoming: Map<string, Set<string>>;
}

export function getHubNodes(
  nodes: Node[],
  edges: Edge[],
  minFanOut: number = 8,
  limit: number = 8
): HubNode[] {
  const questionNodes = nodes.filter((node) => node.type === "questionNode");
  const outDegree = new Map<string, number>();

  edges.forEach((edge) => {
    outDegree.set(edge.source, (outDegree.get(edge.source) || 0) + 1);
  });

  return questionNodes
    .map((node) => {
      const question = node.data?.question;
      return {
        questionId: node.id,
        orderIndex: question?.order_index ?? 0,
        fanOut: outDegree.get(node.id) || 0,
        questionText: question?.question_text || "Untitled Question",
      };
    })
    .filter((entry) => entry.fanOut >= minFanOut)
    .sort((a, b) => b.fanOut - a.fanOut)
    .slice(0, limit);
}

export function getFocusVisibleNodeIds(
  nodes: Node[],
  edges: Edge[],
  centerNodeId: string,
  depth: number
): Set<string> {
  const nodeIds = new Set(nodes.map((node) => node.id));
  if (!nodeIds.has(centerNodeId)) return new Set();

  const safeDepth = Math.max(1, depth);
  const graph = buildGraphIndex(nodes, edges);
  const visibleIds = new Set<string>([centerNodeId]);

  bfsExpand(centerNodeId, safeDepth, graph.outgoing, visibleIds);
  bfsExpand(centerNodeId, safeDepth, graph.incoming, visibleIds);

  // Always keep disqualify node visible if connected to visible set.
  edges.forEach((edge) => {
    if (!visibleIds.has(edge.source) && !visibleIds.has(edge.target)) return;
    if (edge.source === "disqualify-node") visibleIds.add(edge.source);
    if (edge.target === "disqualify-node") visibleIds.add(edge.target);
  });

  return visibleIds;
}

export function getDescendantDepthMap(
  nodes: Node[],
  edges: Edge[],
  centerNodeId: string,
  maxDepth: number
): Map<string, number> {
  const nodeIds = new Set(nodes.map((node) => node.id));
  if (!nodeIds.has(centerNodeId)) return new Map();

  const safeDepth = Math.max(1, maxDepth);
  const graph = buildGraphIndex(nodes, edges);
  const depthMap = new Map<string, number>([[centerNodeId, 0]]);
  const queue: Array<{ nodeId: string; depth: number }> = [
    { nodeId: centerNodeId, depth: 0 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.depth >= safeDepth) continue;

    const neighbors = graph.outgoing.get(current.nodeId);
    if (!neighbors || neighbors.size === 0) continue;

    neighbors.forEach((neighborId) => {
      const nextDepth = current.depth + 1;
      const existingDepth = depthMap.get(neighborId);
      if (existingDepth === undefined || nextDepth < existingDepth) {
        depthMap.set(neighborId, nextDepth);
        queue.push({ nodeId: neighborId, depth: nextDepth });
      }
    });
  }

  return depthMap;
}

function buildGraphIndex(nodes: Node[], edges: Edge[]): GraphIndex {
  const outgoing = new Map<string, Set<string>>();
  const incoming = new Map<string, Set<string>>();

  nodes.forEach((node) => {
    outgoing.set(node.id, new Set());
    incoming.set(node.id, new Set());
  });

  edges.forEach((edge) => {
    if (!outgoing.has(edge.source) || !incoming.has(edge.target)) return;
    outgoing.get(edge.source)!.add(edge.target);
    incoming.get(edge.target)!.add(edge.source);
  });

  return { outgoing, incoming };
}

function bfsExpand(
  startNodeId: string,
  maxDepth: number,
  adjacency: Map<string, Set<string>>,
  visited: Set<string>
): void {
  const queue: Array<{ nodeId: string; depth: number }> = [
    { nodeId: startNodeId, depth: 0 },
  ];
  const queued = new Set<string>([startNodeId]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.depth >= maxDepth) continue;

    const neighbors = adjacency.get(current.nodeId);
    if (!neighbors || neighbors.size === 0) continue;

    neighbors.forEach((neighborId) => {
      visited.add(neighborId);
      if (!queued.has(neighborId)) {
        queued.add(neighborId);
        queue.push({ nodeId: neighborId, depth: current.depth + 1 });
      }
    });
  }
}
