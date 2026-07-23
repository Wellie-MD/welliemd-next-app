import { Layers3 } from "lucide-react";
import { Handle, Position } from "reactflow";
import type { ProgramQuestion } from "../../../../types";

type SectionNodeData = {
  question: ProgramQuestion;
  hasActiveFocus?: boolean;
  isFocusedPath?: boolean;
  isFocused?: boolean;
};

export default function SectionNode({ data }: { data: SectionNodeData }) {
  const isDimmed = data.hasActiveFocus && !data.isFocusedPath;
  const config = data.question.elementConfig || {};
  const fieldCount = Number(config.fieldCount || 0);
  const description = String(
    config.description ||
      `${fieldCount} field${fieldCount === 1 ? "" : "s"} · Reusable from library`
  );

  return (
    <div
      className={`relative w-[140px] rounded-lg border border-slate-200 border-l-[3px] border-l-violet-500 bg-white px-3 py-2 text-left shadow-sm transition-all duration-200 ${
        isDimmed ? "opacity-35" : ""
      } ${
        data.isFocused
          ? "ring-[3px] ring-violet-200 shadow-lg"
          : "hover:-translate-y-px hover:shadow-md"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!h-2.5 !w-2.5 !border-2 !border-white !bg-slate-400"
      />
      <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.05em] text-violet-600">
        <Layers3 className="h-2.5 w-2.5" />
        SECTION
      </span>
      <h4 className="mt-0.5 line-clamp-2 text-[12px] font-semibold leading-tight text-slate-900">
        {data.question.text || "Reusable Section"}
      </h4>
      <span className="mt-0.5 block truncate text-[10px] text-slate-400">
        {description}
      </span>
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!h-2.5 !w-2.5 !border-2 !border-white !bg-slate-400"
      />
    </div>
  );
}
