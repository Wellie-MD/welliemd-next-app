import { ChevronDown, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VisibilityRuleBuilder } from "@/components/questionnaires/VisibilityRuleBuilder";
import type { ProductCategory } from "@/api/productCategories";
import type { ProductDoseMapping } from "@/api/productDoseMappings";
import type { TitrationCategory } from "@/api/titrationCategories";
import type { Product } from "@/api/products";
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
  eligibleQuestions: ProgramQuestion[];
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

const sameCatalogName = (left?: string, right?: string) =>
  Boolean(left && right && left.trim().toLowerCase() === right.trim().toLowerCase());

const normalizeCatalogName = (value?: string | number | null) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const catalogNamesMatch = (left?: string | number | null, right?: string | number | null) => {
  const normalizedLeft = normalizeCatalogName(left);
  const normalizedRight = normalizeCatalogName(right);
  if (!normalizedLeft || !normalizedRight) return false;
  return (
    normalizedLeft === normalizedRight ||
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  );
};

const idsMatch = (left?: string | number | null, right?: string | number | null) =>
  Boolean(left !== undefined && left !== null && right !== undefined && right !== null && String(left) === String(right));

const resolveCatalogProduct = (product: ProgramCheckoutProduct, catalogProducts: Product[]) => {
  const savedIds = [product.productId, product.sourceProductId].filter(Boolean);
  const byId = catalogProducts.find((item) =>
    savedIds.some((savedId) => idsMatch(item.id, savedId) || idsMatch(item.source_product_id, savedId))
  );
  if (byId) return byId;

  return catalogProducts.find((item) => {
    const categoryMatches = !product.category || catalogNamesMatch(item.category_name || item.treatment, product.category);
    const regimenMatches = !product.regimen || catalogNamesMatch(item.titration_category_name, product.regimen);
    const doseMatches = !product.doseLabel || catalogNamesMatch(item.dose_mapping_label || item.dose_mapping_name || item.dose, product.doseLabel);
    return categoryMatches && regimenMatches && doseMatches;
  });
};

export function CheckoutProductRow({
  product,
  index,
  productCount,
  eligibleQuestions,
  categories,
  titrationCategories,
  doseMappings,
  catalogProducts,
  onRemoveProduct,
  onProductFieldChange,
  onProductPriceChange,
  onProductVisibilityChange,
}: CheckoutProductRowProps) {
  const linkedCatalogProduct = resolveCatalogProduct(product, catalogProducts);
  const selectedProductId = linkedCatalogProduct?.id ? String(linkedCatalogProduct.id) : (product.productId ? String(product.productId) : "");
  const selectedCategoryId =
    product.categoryId ||
    linkedCatalogProduct?.category ||
    categories.find((category) => sameCatalogName(category.name, product.category))?.id;
  const selectedRegimenId =
    product.regimenId ||
    linkedCatalogProduct?.titration_category ||
    titrationCategories.find((category) => sameCatalogName(category.name, product.regimen))?.id;
  const selectedDoseMappingId =
    product.doseMappingId ||
    linkedCatalogProduct?.dose_mapping ||
    doseMappings.find(
      (mapping) =>
        sameCatalogName(mapping.patient_label || mapping.name, product.doseLabel || linkedCatalogProduct?.dose_mapping_label) &&
        (!selectedCategoryId || mapping.category === selectedCategoryId)
    )?.id;
  const categoryProducts = productsForCategory(catalogProducts, selectedCategoryId);
  const availableCategories = categoriesWithProducts(categories, catalogProducts);
  const availableRegimens = regimensForProducts(titrationCategories, categoryProducts);
  const regimenProducts = productsForRegimen(categoryProducts, selectedRegimenId);
  const categoryDoses = dosesForProducts(doseMappings, regimenProducts, selectedCategoryId);
  const matchingProducts = productsForDose(regimenProducts, selectedDoseMappingId);
  const hasRules = hasActiveVisibilityRules(product.visibilityRules);

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
  };

  const handleDoseChange = (value: string) => {
    const doseMapping = doseMappings.find((item) => String(item.id) === value);
    onProductFieldChange(index, "doseMappingId", doseMapping?.id);
    onProductFieldChange(index, "doseLabel", doseMapping?.patient_label || doseMapping?.name || "");
    const candidates = productsForDose(regimenProducts, doseMapping?.id);
    const onlyProduct = candidates.length === 1 ? candidates[0] : undefined;
    onProductFieldChange(index, "productId", onlyProduct ? String(onlyProduct.id) : undefined);
    onProductFieldChange(
      index,
      "sourceProductId",
      onlyProduct ? String(onlyProduct.source_product_id ?? onlyProduct.id) : undefined
    );
    onProductFieldChange(
      index,
      "price",
      onlyProduct?.base_price !== undefined ? Number(onlyProduct.base_price) : undefined
    );
    if (doseMapping && !product.categoryId) {
      onProductFieldChange(index, "categoryId", doseMapping.category);
      onProductFieldChange(index, "category", doseMapping.category_name);
    }
  };

  const handleCatalogProductChange = (value: string) => {
    const selectedProduct = matchingProducts.find((item) => String(item.id) === value);
    onProductFieldChange(index, "productId", selectedProduct ? String(selectedProduct.id) : undefined);
    onProductFieldChange(
      index,
      "sourceProductId",
      selectedProduct ? String(selectedProduct.source_product_id ?? selectedProduct.id) : undefined
    );
    onProductFieldChange(
      index,
      "price",
      selectedProduct?.base_price !== undefined ? Number(selectedProduct.base_price) : undefined
    );
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
        <SelectField
          label="Catalog Product"
          value={selectedProductId}
          onChange={handleCatalogProductChange}
          options={matchingProducts.map((item) => ({ value: String(item.id), label: item.name }))}
          placeholder={selectedDoseMappingId ? "— Select product —" : "— Select dose level first —"}
          disabled={!selectedDoseMappingId}
          testId={`checkout-product-catalog-product-${index}`}
        />

      </div>

      {product.category && product.regimen && product.doseLabel && product.productId && (
        <div className="mt-3 rounded-lg border border-[#b2ebd5] bg-[#d1f4e0]/40 px-3 py-2 text-[11.5px] font-medium leading-relaxed text-[#1e8a4a]">
          {product.doseLabel} · {product.category} · {product.regimen} regimen
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
