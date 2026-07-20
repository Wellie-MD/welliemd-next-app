export const TREATMENT_PRODUCT_API = Object.freeze({
  treatmentTypeConfiguration: (productId: string | number) =>
    `products/configuration/${productId}/treatment-type/`,
});
