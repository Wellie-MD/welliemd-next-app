import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export const StartNode = memo(({ data }: NodeProps) => {
  return (
    <div className="px-6 py-4 rounded-full bg-primary text-primary-foreground font-semibold shadow-lg">
      🚀 Start
      <Handle type="source" position={Position.Bottom} className="!bg-primary-foreground" />
    </div>
  );
});

StartNode.displayName = 'StartNode';
