import assert from "node:assert/strict";
import type { Product } from "../src/api/products.js";
import {
  categoriesWithProducts,
  dosesForProducts,
  productsForCategory,
  productsForDose,
  productsForRegimen,
  regimensForProducts,
  selectableCatalogProducts,
} from "../src/features/treatments/programs/checkout-question/utils/catalogOptions.js";
import { checkoutQuestionFromRecord } from "../src/features/treatments/api/mappers.js";

const product = (overrides: Partial<Product>): Product => ({
  id: 1,
  name: "Product",
  product_type: "single",
  purchase_type: "one_time",
  treatment: "general",
  is_active: true,
  created_at: "2026-07-17T00:00:00Z",
  ...overrides,
});

const products = selectableCatalogProducts([
  product({ id: 1, name: "Weight Starter", category: 10, titration_category: 100, dose_mapping: 1000, treatment_type_id: "tt-weight", treatment_type_key: "weight" }),
  product({ id: 2, name: "Weight Maintenance", category: 10, titration_category: 101, dose_mapping: 1001, treatment_type_id: "tt-weight", treatment_type_key: "weight" }),
  product({ id: 3, name: "Hair Daily", category: 20, titration_category: 200, dose_mapping: 2000, treatment_type_id: "tt-hair", treatment_type_key: "hair" }),
  product({ id: 4, name: "Inactive", category: 20, titration_category: 200, dose_mapping: 2000, is_active: false, treatment_type_id: "tt-hair", treatment_type_key: "hair" }),
  product({ id: 5, name: "Incomplete", category: 30, titration_category: undefined, dose_mapping: 3000, treatment_type_id: "tt-other", treatment_type_key: "other" }),
]);

assert.deepEqual(products.map((item) => item.id), [1, 2, 3]);
assert.deepEqual(
  selectableCatalogProducts([
    product({ id: 1, name: "Weight Starter", category: 10, titration_category: 100, dose_mapping: 1000, treatment_type_id: "tt-weight", treatment_type_key: "weight" }),
    product({ id: 2, name: "Missing Treatment Type", category: 10, titration_category: 100, dose_mapping: 1000 }),
    product({ id: 3, name: "Hair Daily", category: 20, titration_category: 200, dose_mapping: 2000, treatment_type_id: "tt-hair", treatment_type_key: "hair" }),
  ], "weight").map((item) => item.id),
  [1]
);
assert.deepEqual(
  categoriesWithProducts(
    [
      { id: 10, name: "Weight", created_at: "", updated_at: "" },
      { id: 20, name: "Hair", created_at: "", updated_at: "" },
      { id: 30, name: "Incomplete", created_at: "", updated_at: "" },
    ],
    products
  ).map((item) => item.id),
  [10, 20]
);

const hairProducts = productsForCategory(products, 20);
assert.deepEqual(hairProducts.map((item) => item.id), [3]);
assert.deepEqual(
  regimensForProducts(
    [
      { id: 100, name: "Starter", code: "starter", display_order: 1, is_active: true, created_at: "", updated_at: "" },
      { id: 200, name: "Daily", code: "daily", display_order: 2, is_active: true, created_at: "", updated_at: "" },
    ],
    hairProducts
  ).map((item) => item.id),
  [200]
);
const dailyProducts = productsForRegimen(hairProducts, 200);
assert.deepEqual(
  dosesForProducts(
    [
      { id: 1000, category: 10, category_name: "Weight", name: "Starter", patient_label: "0.25 mg", display_order: 1, product_count: 1, created_at: "", updated_at: "" },
      { id: 2000, category: 20, category_name: "Hair", name: "Daily", patient_label: "2.5 mg", display_order: 1, product_count: 1, created_at: "", updated_at: "" },
    ],
    dailyProducts,
    20
  ).map((item) => item.id),
  [2000]
);
assert.deepEqual(productsForDose(dailyProducts, 2000).map((item) => item.id), [3]);

const persistedQuestion = checkoutQuestionFromRecord(
  {
    id: "checkout-1",
    question_text: "Choose treatment",
    answer_choices: [
      {
        option_id: "option-1",
        category_name: "Hair",
        titration_category: "Daily",
        dose_label: "2.5 mg",
        product_id: 3,
        final_price: "79.00",
      },
    ],
    visibility_rules: { mode: "simple", rules: [] },
  },
  0
);
assert.equal(persistedQuestion.text, "Choose treatment");
assert.deepEqual(persistedQuestion.products[0], {
  id: "option-1",
  categoryId: undefined,
  category: "Hair",
  regimenId: undefined,
  regimen: "Daily",
  doseMappingId: undefined,
  doseLabel: "2.5 mg",
  productId: "3",
  sourceProductId: undefined,
  price: 79,
  productRole: "primary_choice",
  choiceGroup: undefined,
  visibilityRules: undefined,
});

const persistedQuestionWithSourceProduct = checkoutQuestionFromRecord(
  {
    id: "checkout-2",
    question_text: "Choose source treatment",
    answer_choices: [
      {
        option_id: "option-2",
        category_name: "Weight",
        titration_category: "Starter",
        dose_label: "0.25 mg",
        product_id: 33,
        source_product_id: 1,
      },
    ],
  },
  1
);
assert.equal(persistedQuestionWithSourceProduct.products[0].productId, "33");
assert.equal(persistedQuestionWithSourceProduct.products[0].sourceProductId, "1");

console.log("checkout question catalog dependency tests passed");
