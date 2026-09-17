import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from "reactflow";
import type { FlowEdgeData } from "../../utils/flowTypes";

const EDGE_COLORS = {
  sequential: "#cbd5e1",
  conditional: "#3b82f6",
  product: "#16a34a",
  return: "#64748b",
} as const;

const ACTIVE_EDGE_COLORS = {
  sequential: "#cbd5e1",
  conditional: "#2563eb",
  product: "#16a34a",
  return: "#64748b",
} as const;

function getEdgePath(props: EdgeProps<FlowEdgeData>) {
  const kind = props.data?.kind || "conditional";
  const lane = props.data?.routeLane || 0;

  if (kind === "sequential") {
    if (Math.abs(props.sourceX - props.targetX) < 6) {
      const midY = props.sourceY + (props.targetY - props.sourceY) / 2;
      return [`M ${props.sourceX} ${props.sourceY} L ${props.sourceX} ${midY} L ${props.targetX} ${props.targetY}`, props.sourceX, midY] as const;
    }

    return getSmoothStepPath({
      sourceX: props.sourceX,
      sourceY: props.sourceY,
      sourcePosition: props.sourcePosition,
      targetX: props.targetX,
      targetY: props.targetY,
      targetPosition: props.targetPosition,
      borderRadius: 8,
    });
  }

  if (kind === "return") {
    const routeX = Math.max(props.sourceX, props.targetX) + 120 + lane * 34;
    const midY = props.sourceY + (props.targetY - props.sourceY) / 2;
    const targetEntryY = props.sourceY < props.targetY ? props.targetY - 18 : props.targetY + 18;
    return [
      `M ${props.sourceX} ${props.sourceY} H ${routeX} V ${targetEntryY} H ${props.targetX} V ${props.targetY}`,
      routeX,
      midY,
    ] as const;
  }

  if (kind === "product") {
    const laneOffset = Math.min(lane * 3, 24);
    const curve = Math.max(56, Math.abs(props.targetX - props.sourceX) * 0.34);
    return [
      `M ${props.sourceX} ${props.sourceY} C ${props.sourceX + curve + laneOffset} ${props.sourceY}, ${props.targetX - curve} ${props.targetY}, ${props.targetX} ${props.targetY}`,
      props.sourceX + (props.targetX - props.sourceX) / 2,
      props.sourceY + (props.targetY - props.sourceY) / 2,
    ] as const;
  }

  if (kind === "conditional" && Math.abs(props.sourceX - props.targetX) < 90) {
    const routeX = Math.max(props.sourceX, props.targetX) + 70 + lane * 14;
    return [
      `M ${props.sourceX} ${props.sourceY} C ${routeX} ${props.sourceY}, ${routeX} ${props.targetY}, ${props.targetX} ${props.targetY}`,
      routeX,
      props.sourceY + (props.targetY - props.sourceY) / 2,
    ] as const;
  }

  const curve = Math.max(40, Math.abs(props.targetX - props.sourceX) / 2);
  return [
    `M ${props.sourceX} ${props.sourceY} C ${props.sourceX + curve} ${props.sourceY}, ${props.targetX - curve} ${props.targetY}, ${props.targetX} ${props.targetY}`,
    props.sourceX + (props.targetX - props.sourceX) / 2,
    props.sourceY + (props.targetY - props.sourceY) / 2,
  ] as const;
}

export default function SemanticFlowEdge(props: EdgeProps<FlowEdgeData>) {
  const kind = props.data?.kind || "conditional";
  const active = props.data?.active === true;
  const dimmed = props.data?.dimmed === true;
  const color = active ? ACTIVE_EDGE_COLORS[kind] : EDGE_COLORS[kind];
  const [edgePath, labelX, labelY] = getEdgePath(props);
  const strokeWidth =
    kind === "sequential" ? 1.6 : kind === "return" ? (active ? 1.9 : 1.45) : active ? 3 : 2.2;
  const opacity = dimmed ? 0.1 : kind === "return" ? (active ? 0.82 : 0.56) : 1;
  const dasharray = kind === "return" ? "5 4" : undefined;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={props.markerEnd}
        style={{
          stroke: dimmed ? "#e2e8f0" : color,
          strokeWidth,
          strokeDasharray: dasharray,
          opacity,
        }}
      />
      {(kind === "conditional" || kind === "product") && !dimmed && (
        <circle cx={props.sourceX} cy={props.sourceY} r={3.5} fill={color} />
      )}
      {props.data?.label && !dimmed && (
        <EdgeLabelRenderer>
          <div
            className="pointer-events-none absolute rounded-full border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[8.5px] font-bold text-sky-700 shadow-sm"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY - 14}px)`,
            }}
          >
            {props.data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
