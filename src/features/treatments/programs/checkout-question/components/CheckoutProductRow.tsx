import { ChevronDown, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VisibilityRuleBuilder } from "@/components/questionnaires/VisibilityRuleBuilder";
import type { ProductCategory } from "@/api/productCategories";
import type { ProductDoseMapping } from "@/api/productDoseMappings";
import type { TitrationCategory } from "@/api/titrationCategories";
import {
  fromBuilderGroup,
  toBuilderGroup,
} from "@/features/treatments/utils/visibilityBuilderAdapters";
import { hasActiveVisibilityRules } from "@/features/treatments/utils/visibilityEvaluation";
import type {
  ProgramCheckoutProduct,
  ProgramQuestion,
  VisibilityRuleGroup,
} from "@/features/treatments/types";

interface CheckoutProductRowProps {
  product: ProgramCheckoutProduct;
  index: number;
  productCount: number;
  eligibleQuestions: ProgramQuestion[];
  categories: ProductCategory[];
  titrationCategories: TitrationCategory[];
  doseMappings: ProductDoseMapping[];
  onRemoveProduct: (index: number) => void;
  onProductFieldChange: (
    index: number,
    field: keyof ProgramCheckoutProduct,
    value: ProgramCheckoutProduct[keyof ProgramCheckoutProduct]
  ) => void;
  onProductVisibilityChange: (index: number, group: VisibilityRuleGroup | undefined) => void;
}

const createEmptyGroup = (): VisibilityRuleGroup => ({
  mode: "nested",
  rules: [{ questionId: "", operator: "equals", value: "" }],
  subgroups: [],
});

export function CheckoutProductRow({
  product,
  index,
  productCount,
  eligibleQuestions,
  categories,
  titrationCategories,
  doseMappings,
  onRemoveProduct,
  onProductFieldChange,
  onProductVisibilityChange,
}: CheckoutProductRowProps) {
  const selectedCategoryId =
    product.categoryId ||
    categories.find((category) => category.name === product.category)?.id;
  const selectedRegimenId =
    product.regimenId ||
    titrationCategories.find((category) => category.name === product.regimen)?.id;
  const selectedDoseMappingId =
    product.doseMappingId ||
    doseMappings.find(
      (mapping) =>
        mapping.patient_label === product.doseLabel &&
        (!selectedCategoryId || mapping.category === selectedCategoryId)
    )?.id;
  const categoryDoses = selectedCategoryId
    ? doseMappings.filter((dose) => dose.category === selectedCategoryId)
    : [];
  const hasRules = hasActiveVisibilityRules(product.visibilityRules);

  const handleCategoryChange = (value: string) => {
    const category = categories.find((item) => String(item.id) === value);
    onProductFieldChange(index, "categoryId", category?.id);
    onProductFieldChange(index, "category", category?.name || "");
    onProductFieldChange(index, "doseMappingId", undefined);
    onProductFieldChange(index, "doseLabel", "");
  };

  const handleRegimenChange = (value: string) => {
    const regimen = titrationCategories.find((item) => String(item.id) === value);
    onProductFieldChange(index, "regimenId", regimen?.id);
    onProductFieldChange(index, "regimen", regimen?.name || "");
  };

  const handleDoseChange = (value: string) => {
    const doseMapping = doseMappings.find((item) => String(item.id) === value);
    onProductFieldChange(index, "doseMappingId", doseMapping?.id);
    onProductFieldChange(index, "doseLabel", doseMapping?.patient_label || doseMapping?.name || "");
    if (doseMapping && !product.categoryId) {
      onProductFieldChange(index, "categoryId", doseMapping.category);
      onProductFieldChange(index, "category", doseMapping.category_name);
    }
  };

  return (
    <div className="relative space-y-3.5 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <span className="text-[12px] font-bold text-slate-700">Product {index + 1}</span>
        {productCount > 1 && (
          <button
            type="button"
            onClick={() => onRemoveProduct(index)}
            className="flex items-center gap-1 text-[11.5px] font-semibold text-slate-400 transition-colors hover:text-red-500"
            data-testid={`remove-checkout-product-${index}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        )}
      </div>

      <div className="space-y-3">
        <SelectField
          label="Category"
          value={selectedCategoryId ? String(selectedCategoryId) : ""}
          onChange={handleCategoryChange}
          options={categories.map((category) => ({ value: String(category.id), label: category.name }))}
          placeholder="— Select category —"
          testId={`checkout-product-category-${index}`}
        />
        <SelectField
          label="Titration / Regimen"
          value={selectedRegimenId ? String(selectedRegimenId) : ""}
          onChange={handleRegimenChange}
          options={titrationCategories.map((category) => ({ value: String(category.id), label: category.name }))}
          placeholder="— Select regimen —"
          testId={`checkout-product-regimen-${index}`}
        />
        <SelectField
          label="Dose Level"
          value={selectedDoseMappingId ? String(selectedDoseMappingId) : ""}
          onChange={handleDoseChange}
          options={categoryDoses.map((dose) => ({
            value: String(dose.id),
            label: dose.patient_label || dose.name,
          }))}
          placeholder={product.category ? "— Select dose level —" : "— Select category first —"}
          disabled={!selectedCategoryId}
          testId={`checkout-product-dose-${index}`}
        />
      </div>

      {product.category && product.regimen && product.doseLabel && (
        <div className="mt-3 rounded-lg border border-[#b2ebd5] bg-[#d1f4e0]/40 px-3 py-2 text-[11.5px] font-medium leading-relaxed text-[#1e8a4a]">
          {product.doseLabel} · {product.category} · {product.regimen} regimen
        </div>
      )}

      {/* Per-product conditional visibility */}
      <div className="rounded-lg border border-slate-150 bg-slate-50/60 p-3">
        <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-slate-600">
          <Eye className="h-3.5 w-3.5 text-slate-400" />
          Show this product only when…
        </div>
        <p className="mt-1 text-[11px] leading-normal text-slate-400">
          Leave empty to always offer this product at checkout. Add a rule to show it only for matching answers (e.g. medication preference).
        </p>

        {!hasRules ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onProductVisibilityChange(index, createEmptyGroup())}
            className="mt-2 h-8 border-slate-200 bg-white text-[11px] font-semibold text-slate-600 shadow-sm"
            data-testid={`checkout-product-${index}-add-visibility`}
          >
            + Add visibility rule
          </Button>
        ) : (
          <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <VisibilityRuleBuilder
              value={toBuilderGroup(product.visibilityRules)}
              onChange={(nextGroup) => onProductVisibilityChange(index, fromBuilderGroup(nextGroup))}
              questions={eligibleQuestions.map((question) => ({
                id: question.id,
                question_text: question.text,
                order_index: question.order,
                answer_choices: question.choices,
              }))}
            />
            <div className="mt-2 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onProductVisibilityChange(index, undefined)}
                className="text-[11px] font-semibold text-red-500 hover:text-red-700"
                data-testid={`checkout-product-${index}-clear-visibility`}
              >
                Remove rules
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  placeholder,
  disabled,
  testId,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  disabled?: boolean;
  testId: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11.5px] font-bold text-slate-600">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-700 shadow-sm outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
          data-testid={testId}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
      </div>
    </div>
  );
}
