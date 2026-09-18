import type { Product } from "@/api/products";
import type { ProductCategory } from "@/api/productCategories";
import type { ProductDoseMapping } from "@/api/productDoseMappings";
import type { TitrationCategory } from "@/api/titrationCategories";
import type { ProgramCheckoutProduct, ProgramCheckoutSelector } from "@/features/treatments/types";

export interface CheckoutProductSelector {
  categoryId?: number;
  regimenId?: number;
  doseMappingId?: number;
}

export const selectableCatalogProducts = (
  products: Product[],
  treatmentTypeKey?: string | null
): Product[] =>
  products.filter(
    (product) =>
      product.is_active &&
      product.category &&
      product.titration_category &&
      product.dose_mapping &&
      product.treatment_type_id &&
      (!treatmentTypeKey || product.treatment_type_key === treatmentTypeKey)
  );

/** Products that are safe to use for selector matching and its patient preview. */
export const catalogProductsForCheckoutPreview = (
  products: Product[],
  treatmentTypeKey?: string | null,
): Product[] => selectableCatalogProducts(products, treatmentTypeKey);

export const categoriesWithProducts = (
  categories: ProductCategory[],
  products: Product[]
): ProductCategory[] => {
  const ids = new Set(products.map((product) => Number(product.category)));
  return categories.filter((category) => ids.has(Number(category.id)));
};

export const productsForCategory = (products: Product[], categoryId?: number): Product[] =>
  categoryId
    ? products.filter((product) => Number(product.category) === Number(categoryId))
    : [];

export const regimensForProducts = (
  regimens: TitrationCategory[],
  products: Product[]
): TitrationCategory[] => {
  const ids = new Set(products.map((product) => Number(product.titration_category)));
  return regimens.filter((regimen) => ids.has(Number(regimen.id)));
};

export const productsForRegimen = (products: Product[], regimenId?: number): Product[] =>
  regimenId
    ? products.filter((product) => Number(product.titration_category) === Number(regimenId))
    : [];

export const dosesForProducts = (
  doses: ProductDoseMapping[],
  products: Product[],
  categoryId?: number
): ProductDoseMapping[] => {
  const ids = new Set(products.map((product) => Number(product.dose_mapping)));
  return doses.filter(
    (dose) => Number(dose.category) === Number(categoryId) && ids.has(Number(dose.id))
  );
};

export const productsForDose = (products: Product[], doseMappingId?: number): Product[] =>
  doseMappingId
    ? products.filter((product) => Number(product.dose_mapping) === Number(doseMappingId))
    : [];

/** Return every catalog Product represented by one Category/Regimen/Dose selector. */
export const productsForSelector = (
  products: Product[],
  selector: CheckoutProductSelector,
): Product[] => {
  if (!selector.categoryId || !selector.regimenId || !selector.doseMappingId) return [];
  return products.filter(
    (product) => Number(product.category) === Number(selector.categoryId)
      && Number(product.titration_category) === Number(selector.regimenId)
      && Number(product.dose_mapping) === Number(selector.doseMappingId),
  );
};

const slugPart = (value: unknown): string => String(value ?? "")
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const selectorSupplyGroup = (selector: ProgramCheckoutSelector, product: Product): string => {
  const explicitGroup = selector.choiceGroup?.trim();
  if (explicitGroup) return explicitGroup;
  const clinicalIdentity = [
    product.base_medication_name || product.name || selector.patientLabel || selector.doseLabel,
    product.category ?? selector.categoryId,
    product.dose_mapping ?? selector.doseMappingId,
  ].map(slugPart).filter(Boolean).join("-");
  return `supply-${(clinicalIdentity || slugPart(selector.id) || "product").slice(0, 73)}`;
};

const selectorPatientLabel = (selector: ProgramCheckoutSelector, product: Product): string => {
  const explicitLabel = selector.patientLabel?.trim();
  if (explicitLabel) return explicitLabel;
  const label = product.base_medication_name || product.name || selector.doseLabel || "Selected Product";
  const doseLabel = product.dose_mapping_label || product.dose_mapping_name || product.dose || selector.doseLabel || "";
  return doseLabel && !label.toLowerCase().includes(doseLabel.toLowerCase())
    ? `${label} ${doseLabel}`
    : label;
};

/** Use the same grouping key for legacy and selector-expanded preview rows. */
export const checkoutPreviewGroupKey = (product: ProgramCheckoutProduct): string =>
  product.choiceGroup?.trim() || `product-${product.id}`;

/** Collapse legacy exact-product rows into the selector rows used by authoring. */
export const checkoutSelectorsFromProducts = (
  products: ProgramCheckoutProduct[],
): ProgramCheckoutSelector[] => {
  const seen = new Set<string>();
  return products.reduce<ProgramCheckoutSelector[]>((selectors, product) => {
    const key = [product.categoryId, product.regimenId, product.doseMappingId].join(":");
    if (!product.categoryId || !product.regimenId || !product.doseMappingId || seen.has(key)) return selectors;
    seen.add(key);
    selectors.push({
      id: product.id,
      categoryId: product.categoryId,
      category: product.category,
      regimenId: product.regimenId,
      regimen: product.regimen,
      doseMappingId: product.doseMappingId,
      doseLabel: product.doseLabel,
      productRole: product.productRole,
      choiceGroup: product.choiceGroup,
      patientLabel: product.patientLabel,
      visibilityRules: product.visibilityRules,
    });
    return selectors;
  }, []);
};

/** Expand authoring selectors into exact rows for the live patient preview. */
export const expandCheckoutSelectorsForPreview = (
  selectors: ProgramCheckoutSelector[],
  products: Product[],
): ProgramCheckoutProduct[] => selectors.flatMap((selector) =>
  productsForSelector(products, selector).map((product) => {
    return {
      id: `${selector.id}-${product.id}`,
      categoryId: Number(product.category),
      category: product.category_name || product.treatment || selector.category || "",
      regimenId: Number(product.titration_category),
      regimen: product.titration_category_name || selector.regimen || "",
      doseMappingId: Number(product.dose_mapping),
      doseLabel: product.dose_mapping_label || product.dose_mapping_name || product.dose || selector.doseLabel || "",
      productId: String(product.id),
      sourceProductId: product.source_product_id ? String(product.source_product_id) : undefined,
      rxDaysSupply: product.rx_days_supply || undefined,
      price: product.base_price !== undefined ? Number(product.base_price) : undefined,
      productRole: selector.productRole || "primary_choice",
      choiceGroup: selectorSupplyGroup(selector, product),
      patientLabel: selectorPatientLabel(selector, product),
      visibilityRules: selector.visibilityRules,
    };
  }),
);
