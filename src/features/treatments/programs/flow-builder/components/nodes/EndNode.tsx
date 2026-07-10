import { Handle, Position } from "reactflow";
import { CircleDot } from "lucide-react";

type EndNodeData = {
  label: string;
  subtitle?: string;
  hasActiveFocus?: boolean;
  isFocusedPath?: boolean;
  isFocused?: boolean;
};

export default function EndNode({ data }: { data: EndNodeData }) {
  const isDimmed = data.hasActiveFocus && !data.isFocusedPath;

  return (
    <div
      className={`w-[140px] rounded-lg px-3 py-2 text-left shadow-sm transition-all duration-200 ${
        isDimmed ? "opacity-35" : ""
      } ${
        data.isFocused
          ? "bg-slate-950 border-2 border-blue-500 ring-[3px] ring-blue-100 shadow-lg"
          : "bg-[#0f1825] border border-[#0f1825] hover:-translate-y-px hover:shadow-md"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-slate-800"
      />
      <span className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-[0.05em] text-white/55">
        <CircleDot className="h-2.5 w-2.5" />
        SYSTEM
      </span>
      <h4 className="mt-0.5 text-[12px] font-medium leading-tight text-white">
        {data.label}
      </h4>
      <span className="mt-0.5 block text-[10px] text-slate-400">
        {data.subtitle || "Intake finished"}
      </span>
    </div>
  );
}
