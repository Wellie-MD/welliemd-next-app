import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { X } from "lucide-react";

export const DisqualifyNode = memo(
  ({ data, selected }: NodeProps<{ reason?: string }>) => {
    return (
      <div
        className={`
        w-[200px] rounded-xl border-2 bg-red-50 shadow-md transition-all
        ${selected ? "border-red-500 shadow-lg" : "border-red-300"}
      `}
      >
        {/* Top Handle */}
        <Handle
          type="target"
          position={Position.Left}
          className="!w-4 !h-4 !bg-red-400 !border-2 !border-white !-left-2"
        />

        <div className="px-4 py-3 flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
            <X className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-red-900">
              Disqualified
            </div>
            {data.reason && (
              <div className="text-xs text-red-700 mt-1">{data.reason}</div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

DisqualifyNode.displayName = "DisqualifyNode";
