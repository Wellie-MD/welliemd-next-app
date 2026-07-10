import { Handle, Position } from "reactflow";
import { ShoppingCart } from "lucide-react";
import type { ProgramCheckoutProduct } from "../../../../types";

type ProductNodeData = {
  product: ProgramCheckoutProduct;
  hasActiveFocus?: boolean;
  isFocusedPath?: boolean;
  isFocused?: boolean;
};

export default function ProductNode({ data }: { data: ProductNodeData }) {
  const isDimmed = data.hasActiveFocus && !data.isFocusedPath;
  const p = data.product;

  return (
    <div
      className={`w-[200px] overflow-hidden rounded-lg bg-[#f0fdf4] text-left shadow-sm transition-all duration-200 ${
        isDimmed ? "opacity-35" : ""
      } ${
        data.isFocused
          ? "border-2 border-blue-500 ring-[3px] ring-blue-100 shadow-lg bg-white"
          : "border border-[#bbf7d0] hover:-translate-y-px hover:shadow-md"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2.5 !h-2.5 !bg-emerald-500 !border-2 !border-white"
      />

      <div className="flex items-center justify-between border-b border-emerald-100 bg-[#f0fdf4] px-3 py-1.5">
        <span className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-[0.05em] text-[#15803d]">
          <ShoppingCart className="h-2.5 w-2.5" />
          PRODUCT
        </span>
        <span className="text-[10px] font-extrabold text-[#15803d]">
          ${p.price || 0}/mo
        </span>
      </div>

      <div className="px-3 py-2">
        <h4 className="line-clamp-2 text-[12px] font-medium leading-tight text-slate-800">
          {p.doseLabel || p.category}
        </h4>
        <div className="mt-0.5 text-[10px] text-slate-400">{p.category}</div>
      </div>
    </div>
  );
}
