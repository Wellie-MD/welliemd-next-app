import type { Product } from "@/api/products";
import type { ProductCategory } from "@/api/productCategories";
import type { ProductDoseMapping } from "@/api/productDoseMappings";
import type { TitrationCategory } from "@/api/titrationCategories";

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

// The product list already carries the catalog identities used by the
// checkout selectors. Build the selector metadata from that response instead
// of making three additional category/regimen/dose requests.
export const catalogMetadataFromProducts = (products: Product[]) => {
  const categories = new Map<number, ProductCategory>();
  const titrationCategories = new Map<number, TitrationCategory>();
  const doseMappings = new Map<number, ProductDoseMapping>();

  products.forEach((product) => {
    if (product.category) {
      const id = Number(product.category);
      categories.set(id, {
        id,
        name: product.category_name || product.treatment || `Category ${id}`,
        created_at: "",
        updated_at: "",
      });
    }

    if (product.titration_category) {
      const id = Number(product.titration_category);
      titrationCategories.set(id, {
        id,
        name: product.titration_category_name || `Regimen ${id}`,
        code: String(id),
        display_order: 0,
        is_active: true,
        created_at: "",
        updated_at: "",
      });
    }

    if (product.dose_mapping) {
      const id = Number(product.dose_mapping);
      doseMappings.set(id, {
        id,
        category: Number(product.category),
        category_name: product.category_name || product.treatment || "",
        name: product.dose_mapping_name || product.dose_mapping_label || `Dose ${id}`,
        patient_label: product.dose_mapping_label || product.dose_mapping_name || `Dose ${id}`,
        display_order: 0,
        product_count: 0,
        created_at: "",
        updated_at: "",
      });
    }
  });

  return {
    categories: [...categories.values()].sort((left, right) => left.name.localeCompare(right.name)),
    titrationCategories: [...titrationCategories.values()].sort((left, right) => left.name.localeCompare(right.name)),
    doseMappings: [...doseMappings.values()].sort((left, right) => left.patient_label.localeCompare(right.patient_label)),
  };
};

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
