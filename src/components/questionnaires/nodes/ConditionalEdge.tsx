import { memo } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';
import { useFlowStore } from '@/store/useFlowStore';

export const ConditionalEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}: EdgeProps) => {
  const showEdgeLabels = useFlowStore((state) => state.showEdgeLabels);
  const viewMode = useFlowStore((state) => state.viewMode);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const label = data?.label || data?.condition?.value;
  const isDisqualify = data?.condition?.operator === 'disqualify' || label === 'Disqualify';
  const shouldShowLabel =
    Boolean(label) && (viewMode !== 'overview' || showEdgeLabels || selected);

  // Determine edge styling based on type
  const edgeStyle = isDisqualify
    ? {
        stroke: '#ef4444',
        strokeWidth: 2,
      }
    : {
        stroke: '#60a5fa',
        strokeWidth: 2,
      };

  // Determine label styling based on type
  const labelClasses = isDisqualify
    ? 'bg-red-50 border border-red-200 text-red-700'
    : 'bg-blue-50 border border-blue-200 text-blue-700';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...edgeStyle,
          ...style,
        }}
      />
      {shouldShowLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div className={`${labelClasses} rounded px-2 py-0.5 text-xs font-medium shadow-sm`}>
              {label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

ConditionalEdge.displayName = 'ConditionalEdge';
