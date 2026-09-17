import { Handle, Position } from "reactflow";
import { LockKeyhole } from "lucide-react";

type AuthNodeData = {
  label: string;
  subtitle?: string;
  hasActiveFocus?: boolean;
  isFocusedPath?: boolean;
  isFocused?: boolean;
};

export default function AuthNode({ data }: { data: AuthNodeData }) {
  const isDimmed = data.hasActiveFocus && !data.isFocusedPath;

  return (
    <div
      className={`rounded-lg w-[140px] text-left transition-all duration-200 shadow-sm ${
        isDimmed ? "opacity-35" : ""
      } ${
        data.isFocused
          ? "bg-white border-2 border-blue-500 ring-[3px] ring-blue-100 shadow-lg"
          : "bg-white border border-dashed border-slate-300 hover:-translate-y-px hover:shadow-md"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white"
      />
      <div className="px-3 py-2.5">
        <span className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-[0.05em] text-slate-400">
          <LockKeyhole className="h-2.5 w-2.5 text-yellow-500" />
          SYSTEM
        </span>
        <h4 className="mt-0.5 text-[12px] font-semibold leading-tight text-slate-700">
          {data.label}
        </h4>
        <span className="mt-0.5 block text-[10px] text-slate-400">
          {data.subtitle || "Authentication"}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white"
      />
    </div>
  );
}
