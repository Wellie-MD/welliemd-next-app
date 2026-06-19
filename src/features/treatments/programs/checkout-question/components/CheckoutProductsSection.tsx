import { Info, Plus } from "lucide-react";
import type { ProgramCheckoutProduct, ProgramQuestion, VisibilityRuleGroup } from "@/features/treatments/types";
import { CheckoutProductRow } from "./CheckoutProductRow";

interface CheckoutProductsSectionProps {
  products: ProgramCheckoutProduct[];
  /** Earlier questions in the program, used as conditions for per-product visibility. */
  eligibleQuestions: ProgramQuestion[];
  onAddProduct: () => void;
  onRemoveProduct: (index: number) => void;
  onProductFieldChange: (index: number, field: keyof ProgramCheckoutProduct, value: string) => void;
  onProductPriceChange: (index: number, value: string) => void;
  onProductVisibilityChange: (index: number, group: VisibilityRuleGroup | undefined) => void;
}

export function CheckoutProductsSection({
  products,
  eligibleQuestions,
  onAddProduct,
  onRemoveProduct,
  onProductFieldChange,
  onProductPriceChange,
  onProductVisibilityChange,
}: CheckoutProductsSectionProps) {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[13px] font-bold text-slate-900">
          Products to Display
          <Info className="h-3.5 w-3.5 cursor-pointer text-slate-400" />
        </div>
        <span className="text-[11.5px] font-medium text-slate-400">
          {products.length} {products.length === 1 ? "product" : "products"}
        </span>
      </div>
      <div className="text-[11.5px] leading-normal text-slate-400">
        Add one or more products the patient can choose from. Each product is a structured Category / Regimen / Dose combination — matching uses the structured fields, not the official product name. Use per-product visibility rules to show different products based on the patient&apos;s earlier answers.
      </div>

      <div className="space-y-4">
        {products.map((product, index) => (
          <CheckoutProductRow
            key={product.id}
            product={product}
            index={index}
            productCount={products.length}
            eligibleQuestions={eligibleQuestions}
            onRemoveProduct={onRemoveProduct}
            onProductFieldChange={onProductFieldChange}
            onProductPriceChange={onProductPriceChange}
            onProductVisibilityChange={onProductVisibilityChange}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onAddProduct}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 py-3 text-[12px] font-bold text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50"
        data-testid="add-checkout-product"
      >
        <Plus className="h-4 w-4" />
        Add another product
      </button>
    </div>
  );
}
