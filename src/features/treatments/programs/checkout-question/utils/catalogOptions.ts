import type { Product } from "@/api/products";
import type { ProductCategory } from "@/api/productCategories";
import type { ProductDoseMapping } from "@/api/productDoseMappings";
import type { TitrationCategory } from "@/api/titrationCategories";

export const selectableCatalogProducts = (products: Product[]): Product[] =>
  products.filter(
    (product) => product.is_active && product.category && product.titration_category && product.dose_mapping
  );

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
