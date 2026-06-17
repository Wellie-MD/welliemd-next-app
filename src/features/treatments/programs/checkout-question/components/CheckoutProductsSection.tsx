import { ChevronDown, Info, Plus, Trash2 } from "lucide-react";
import type { ProgramCheckoutProduct } from "@/features/treatments/types";
import { DOSE_MAPPINGS, PRODUCT_CATEGORIES, TITRATION_CATEGORIES } from "@/features/treatments/programs/checkout-question/utils/checkoutQuestionConstants";

interface CheckoutProductsSectionProps {
  products: ProgramCheckoutProduct[];
  onAddProduct: () => void;
  onRemoveProduct: (index: number) => void;
  onProductFieldChange: (index: number, field: keyof ProgramCheckoutProduct, value: string) => void;
}

export function CheckoutProductsSection({ products, onAddProduct, onRemoveProduct, onProductFieldChange }: CheckoutProductsSectionProps) {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[13px] font-bold text-slate-900">
          Products to Display
          <Info className="h-3.5 w-3.5 cursor-pointer text-slate-400" />
        </div>
        <span className="text-[11.5px] font-medium text-slate-400">{products.length} {products.length === 1 ? "product" : "products"}</span>
      </div>
      <div className="text-[11.5px] leading-normal text-slate-400">
        Add one or more products the patient can choose from. Each product is a structured Category / Regimen / Dose combination — matching uses the structured fields, not the official product name.
      </div>

      <div className="space-y-4">
        {products.map((product, index) => {
          const categoryDoses = DOSE_MAPPINGS.filter((dose) => dose.category === product.category);
          return (
            <div key={product.id} className="relative space-y-3.5 rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[12px] font-bold text-slate-700">Product {index + 1}</span>
                {products.length > 1 && (
                  <button type="button" onClick={() => onRemoveProduct(index)} className="flex items-center gap-1 text-[11.5px] font-semibold text-slate-400 transition-colors hover:text-red-500" data-testid={`remove-checkout-product-${index}`}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <SelectField label="Category" value={product.category} onChange={(value) => onProductFieldChange(index, "category", value)} options={PRODUCT_CATEGORIES} placeholder="— Select category —" testId={`checkout-product-category-${index}`} />
                <SelectField label="Titration / Regimen" value={product.regimen} onChange={(value) => onProductFieldChange(index, "regimen", value)} options={TITRATION_CATEGORIES} placeholder="— Select regimen —" testId={`checkout-product-regimen-${index}`} />
                <SelectField label="Dose Level" value={product.doseLabel} onChange={(value) => onProductFieldChange(index, "doseLabel", value)} options={categoryDoses.map((dose) => dose.label)} placeholder={product.category ? "— Select dose level —" : "— Select category first —"} disabled={!product.category} testId={`checkout-product-dose-${index}`} />
              </div>

              {product.category && product.regimen && product.doseLabel && (
                <div className="mt-3 rounded-lg border border-[#b2ebd5] bg-[#d1f4e0]/40 px-3 py-2 text-[11.5px] font-medium leading-relaxed text-[#1e8a4a]">
                  {product.doseLabel} · {product.category} · {product.regimen} regimen
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button type="button" onClick={onAddProduct} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 py-3 text-[12px] font-bold text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50" data-testid="add-checkout-product">
        <Plus className="h-4 w-4" />
        Add another product
      </button>
    </div>
  );
}

function SelectField({ label, value, options, placeholder, disabled, testId, onChange }: { label: string; value: string; options: string[]; placeholder: string; disabled?: boolean; testId: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11.5px] font-bold text-slate-600">{label} <span className="text-red-500">*</span></label>
      <div className="relative">
        <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-700 shadow-sm outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400" data-testid={testId}>
          <option value="">{placeholder}</option>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
      </div>
    </div>
  );
}
