import type { Product } from "@/api/products";
import type { ProgramCheckoutProduct } from "@/features/treatments/types";

const sameId = (left?: string | number, right?: string | number) =>
  left !== undefined && right !== undefined && String(left) === String(right);

export const catalogProductForCheckout = (
  checkoutProduct: ProgramCheckoutProduct,
  catalogProducts: Product[],
): Product | undefined => {
  const identifiers = [checkoutProduct.productId, checkoutProduct.sourceProductId].filter(Boolean);
  return catalogProducts.find((catalogProduct) =>
    identifiers.some((identifier) =>
      sameId(catalogProduct.id, identifier) || sameId(catalogProduct.source_product_id, identifier),
    ),
  );
};

export const checkoutPatientPreviewTitle = (
  checkoutProduct: ProgramCheckoutProduct,
  catalogProducts: Product[],
): string => {
  const patientLabel = checkoutProduct.patientLabel?.trim();
  if (patientLabel) return patientLabel;

  const catalogName = catalogProductForCheckout(checkoutProduct, catalogProducts)?.name?.trim();
  return catalogName || checkoutProduct.doseLabel || "Selected Product";
};
