import { Handle, Position } from "reactflow";
import { ShieldCheck } from "lucide-react";

type ConsentNodeData = {
  label: string;
  consentProvenance?: "library" | "inline";
  consentScopeLabel?: string;
  hasActiveFocus?: boolean;
  isFocusedPath?: boolean;
  isFocused?: boolean;
};

export default function ConsentNode({ data }: { data: ConsentNodeData }) {
  const isDimmed = data.hasActiveFocus && !data.isFocusedPath;

  return (
    <div
      className={`w-[300px] overflow-hidden rounded-[10px] bg-white text-left shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 ${
        isDimmed ? "opacity-35" : ""
      } ${
        data.isFocused
          ? "border-2 border-blue-500 ring-[3px] ring-blue-100 shadow-lg"
          : "border border-[#c7d2fe] hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)]"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2.5 !h-2.5 !bg-blue-500 !border-2 !border-white !top-[28px]"
      />

      <div className="border-b border-slate-200 bg-[#eef2ff] px-3 py-[5px]">
        <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.05em] text-[#4338ca]">
          <ShieldCheck className="h-2.5 w-2.5" />
          {data.consentProvenance === "library" ? "LIBRARY CONSENT" : "INLINE CONSENT"}
        </span>
      </div>

      <div className="px-3 pb-2 pt-2.5">
        <h4 className="text-[12.5px] font-semibold leading-[1.35] text-slate-900">
          {data.label}
        </h4>
        <p className="mt-1 text-[10px] font-medium text-slate-500">
          {data.consentProvenance === "library"
            ? `${data.consentScopeLabel || "Visit Type"} scope · Reusable legal document`
            : "Conditional · Defined in this Program"}
        </p>
      </div>

      <div className="space-y-[5px] px-2.5 pb-2.5">
        <div className="relative flex items-start gap-2 rounded-md border border-slate-200 bg-[#f7f9fc] px-2.5 py-1.5 text-[11px] text-slate-700">
          <span className="h-2.5 w-2.5 rounded-[3px] border border-slate-300 bg-white shrink-0 mt-0.5" />
          <span className="leading-snug">I acknowledge the consent terms and wish to continue</span>
          <Handle
            type="source"
            position={Position.Right}
            id="right"
            className="!w-2 !h-2 !bg-blue-500 !border !border-white !right-[-4px]"
            style={{ top: "50%", transform: "translateY(-50%)" }}
          />
        </div>
        <div className="flex items-start gap-2 rounded-md border border-[#fecaca] bg-[#fef2f2] px-2.5 py-1.5 text-[11px] text-red-700">
          <span className="h-2.5 w-2.5 rounded-[3px] border border-red-300 bg-white shrink-0 mt-0.5" />
          <span className="leading-snug">I do not wish to continue</span>
        </div>
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
