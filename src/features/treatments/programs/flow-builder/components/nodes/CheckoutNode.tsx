import { Handle, Position } from "reactflow";
import { ShoppingCart } from "lucide-react";
import type { ProgramCheckoutQuestion } from "../../../../types";

type CheckoutNodeData = {
  checkoutQuestions?: ProgramCheckoutQuestion[];
  hasActiveFocus?: boolean;
  isFocusedPath?: boolean;
  isFocused?: boolean;
};

export default function CheckoutNode({ data }: { data: CheckoutNodeData }) {
  const isDimmed = data.hasActiveFocus && !data.isFocusedPath;
  const productsCount = (data.checkoutQuestions || []).flatMap((question) => question.products || []).length;

  return (
    <div
      className={`w-[140px] rounded-lg px-3 py-2 text-left shadow-sm transition-all duration-200 ${
        isDimmed ? "opacity-35" : ""
      } ${
        data.isFocused
          ? "bg-slate-950 border-2 border-emerald-400 ring-[3px] ring-emerald-200 shadow-lg"
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
        <ShoppingCart className="h-2.5 w-2.5 fill-slate-400" />
        SYSTEM
      </span>
      <h4 className="mt-0.5 text-[12px] font-medium leading-tight text-white">
        Checkout
      </h4>
      <span className="mt-0.5 block text-[10px] text-slate-400">
        {productsCount} products
      </span>
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-slate-800"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2.5 !h-2.5 !bg-emerald-500 !border-2 !border-slate-800"
      />
    </div>
  );
}
