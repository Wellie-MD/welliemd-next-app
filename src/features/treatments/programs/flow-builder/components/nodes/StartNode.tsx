import { Handle, Position } from "reactflow";
import { Play } from "lucide-react";

type StartNodeData = {
  label: string;
  subtitle?: string;
  hasActiveFocus?: boolean;
  isFocusedPath?: boolean;
  isFocused?: boolean;
};

export default function StartNode({ data }: { data: StartNodeData }) {
  const isDimmed = data.hasActiveFocus && !data.isFocusedPath;

  return (
    <div
      className={`rounded-lg px-3 py-2 w-[140px] text-left transition-all duration-200 shadow-sm ${
        isDimmed ? "opacity-35" : ""
      } ${
        data.isFocused
          ? "bg-[#0f1825] border-2 border-blue-500 ring-[3px] ring-blue-100 shadow-lg"
          : "bg-[#0f1825] border border-[#0f1825] hover:-translate-y-px hover:shadow-md"
      }`}
    >
      <span className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-[0.05em] text-white/55">
        <Play className="h-2.5 w-2.5 fill-slate-400" />
        SYSTEM
      </span>
      <h4 className="mt-0.5 text-[12px] font-medium leading-tight text-white">
        {data.label}
      </h4>
      <span className="mt-0.5 block text-[10px] text-slate-400">
        {data.subtitle || "Patient enters"}
      </span>
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-slate-800"
      />
    </div>
  );
}
