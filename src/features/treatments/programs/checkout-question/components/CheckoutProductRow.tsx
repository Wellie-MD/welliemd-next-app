import { ChevronDown, Package, Trash2 } from "lucide-react";
import type { ProductCategory } from "@/api/productCategories";
import type { ProductDoseMapping } from "@/api/productDoseMappings";
import type { TitrationCategory } from "@/api/titrationCategories";
import type { Product } from "@/api/products";
import type {
  ProgramCheckoutProduct,
  VisibilityRuleGroup,
} from "@/features/treatments/types";
import {
  categoriesWithProducts,
  dosesForProducts,
  productsForCategory,
  productsForDose,
  productsForRegimen,
  regimensForProducts,
} from "../utils/catalogOptions";
interface CheckoutProductRowProps {
  product: ProgramCheckoutProduct;
  index: number;
  productCount: number;
  visibilityQuestions: unknown[];
  categories: ProductCategory[];
  titrationCategories: TitrationCategory[];
  doseMappings: ProductDoseMapping[];
  catalogProducts: Product[];
  onRemoveProduct: (index: number) => void;
  onProductFieldChange: (
    index: number,
    field: keyof ProgramCheckoutProduct,
    value: ProgramCheckoutProduct[keyof ProgramCheckoutProduct]
  ) => void;
  onProductPriceChange: (index: number, value: string) => void;
  onProductVisibilityChange: (index: number, group: VisibilityRuleGroup | undefined) => void;
}

const createEmptyGroup = (): VisibilityRuleGroup => ({
  mode: "nested",
  rules: [{ questionId: "", operator: "equals", value: "" }],
  subgroups: [],
});

export const matchingProductsCountClassName =
  "!border-0 !outline-none !ring-0 text-[12px] font-bold text-slate-900";

const sameCatalogName = (left?: string, right?: string) =>
  Boolean(left && right && left.trim().toLowerCase() === right.trim().toLowerCase());

export function CheckoutProductRow({
  product,
  index,
  productCount,
  visibilityQuestions,
  categories,
  titrationCategories,
  doseMappings,
  catalogProducts,
  onRemoveProduct,
  onProductFieldChange,
  onProductPriceChange,
  onProductVisibilityChange,
}: CheckoutProductRowProps) {
  const selectedCategoryId =
    product.categoryId ||
    categories.find((category) => sameCatalogName(category.name, product.category))?.id;
  const selectedRegimenId =
    product.regimenId ||
    titrationCategories.find((category) => sameCatalogName(category.name, product.regimen))?.id;
  const selectedDoseMappingId =
    product.doseMappingId ||
    doseMappings.find(
      (mapping) =>
        sameCatalogName(mapping.patient_label || mapping.name, product.doseLabel) &&
        (!selectedCategoryId || mapping.category === selectedCategoryId)
    )?.id;
  const categoryProducts = productsForCategory(catalogProducts, selectedCategoryId);
  const availableCategories = categoriesWithProducts(categories, catalogProducts);
  const availableRegimens = regimensForProducts(titrationCategories, categoryProducts);
  const regimenProducts = productsForRegimen(categoryProducts, selectedRegimenId);
  const categoryDoses = dosesForProducts(doseMappings, regimenProducts, selectedCategoryId);
  const matchingProducts = productsForDose(regimenProducts, selectedDoseMappingId);
  const handleCategoryChange = (value: string) => {
    const category = categories.find((item) => String(item.id) === value);
    onProductFieldChange(index, "categoryId", category?.id);
    onProductFieldChange(index, "category", category?.name || "");
    onProductFieldChange(index, "regimenId", undefined);
    onProductFieldChange(index, "regimen", "");
    onProductFieldChange(index, "doseMappingId", undefined);
    onProductFieldChange(index, "doseLabel", "");
    onProductFieldChange(index, "productId", undefined);
    onProductFieldChange(index, "sourceProductId", undefined);
    onProductFieldChange(index, "price", undefined);
    onProductFieldChange(index, "rxDaysSupply", undefined);
  };

  const handleRegimenChange = (value: string) => {
    const regimen = titrationCategories.find((item) => String(item.id) === value);
    onProductFieldChange(index, "regimenId", regimen?.id);
    onProductFieldChange(index, "regimen", regimen?.name || "");
    onProductFieldChange(index, "doseMappingId", undefined);
    onProductFieldChange(index, "doseLabel", "");
    onProductFieldChange(index, "productId", undefined);
    onProductFieldChange(index, "sourceProductId", undefined);
    onProductFieldChange(index, "price", undefined);
    onProductFieldChange(index, "rxDaysSupply", undefined);
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
          <label className="flex items-center gap-2 text-[12px] font-bold text-slate-700">
          Product {index + 1}
        </label>
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
        {product.choiceGroup && product.patientLabel && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wide text-blue-600">
              Grouped supply option
            </div>
            <div className="mt-0.5 text-[12px] font-semibold text-slate-800">
              {product.patientLabel}
            </div>
          </div>
        )}
        <SelectField
          label="Checkout role"
          value={product.productRole || "primary_choice"}
          onChange={(value) => onProductFieldChange(index, "productRole", value as ProgramCheckoutProduct["productRole"])}
          options={[
            { value: "required_companion", label: "Required" },
            { value: "optional_addon", label: "Optional" },
          ]}
          placeholder="— Select role —"
          testId={`checkout-product-role-${index}`}
        />
        <SelectField
          label="Category"
          value={selectedCategoryId ? String(selectedCategoryId) : ""}
          onChange={handleCategoryChange}
          options={availableCategories.map((category) => ({ value: String(category.id), label: category.name }))}
          placeholder="— Select category —"
          testId={`checkout-product-category-${index}`}
        />
        <SelectField
          label="Titration / Regimen"
          value={selectedRegimenId ? String(selectedRegimenId) : ""}
          onChange={handleRegimenChange}
          options={availableRegimens.map((category) => ({ value: String(category.id), label: category.name }))}
          placeholder="— Select regimen —"
          disabled={!selectedCategoryId}
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
          placeholder={selectedRegimenId ? "— Select dose level —" : "— Select regimen first —"}
          disabled={!selectedRegimenId}
          testId={`checkout-product-dose-${index}`}
        />
      </div>

      {product.category && product.regimen && product.doseLabel && (
        <div className="mt-3 space-y-2 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-3">
          <div className="text-[11.5px] font-semibold leading-relaxed text-emerald-800">
            {product.doseLabel} · {product.category} · {product.regimen} regimen
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-emerald-700" />
                All matching active Products will be resolved; supply variants for the same medication will be grouped for the patient.
            </span>
          </div>
        </div>
      )}
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
