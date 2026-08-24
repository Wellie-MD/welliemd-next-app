import assert from "node:assert/strict";
import type { Product } from "../src/api/products.js";
import {
  catalogMetadataFromProducts,
  categoriesWithProducts,
  dosesForProducts,
  productsForCategory,
  productsForDose,
  productsForRegimen,
  regimensForProducts,
  selectableCatalogProducts,
} from "../src/features/treatments/programs/checkout-question/utils/catalogOptions.js";
import {
  checkoutQuestionFromRecord,
  programToRecord,
} from "../src/features/treatments/api/mappers.js";
import {
  isCheckoutQuestionRequired,
  productRoleForFlexibleSelection,
} from "../src/features/treatments/programs/checkout-question/constants.js";

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
const metadata = catalogMetadataFromProducts(products);
assert.deepEqual(metadata.categories.map((item) => item.id), [20, 10]);
assert.deepEqual(metadata.titrationCategories.map((item) => item.id), [100, 101, 200]);
assert.deepEqual(metadata.doseMappings.map((item) => item.id), [1000, 1001, 2000]);
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
  rxDaysSupply: undefined,
  price: 79,
  productRole: "primary_choice",
  choiceGroup: undefined,
  patientLabel: undefined,
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

const groupedQuestion = checkoutQuestionFromRecord(
  {
    id: "checkout-grouped",
    answer_choices: [
      {
        option_id: "option-30",
        product_id: 30,
        choice_group: "supply-group",
        patient_label: "Semaglutide 0.25 mg",
        rx_days_supply: 30,
      },
      {
        option_id: "option-60",
        product_id: 60,
        choice_group: "supply-group",
        patient_label: "Semaglutide 0.25 mg",
        rx_days_supply: 60,
      },
    ],
  },
  2,
);
assert.deepEqual(
  groupedQuestion.products.map((item) => ({
    group: item.choiceGroup,
    label: item.patientLabel,
    duration: item.rxDaysSupply,
  })),
  [
    { group: "supply-group", label: "Semaglutide 0.25 mg", duration: 30 },
    { group: "supply-group", label: "Semaglutide 0.25 mg", duration: 60 },
  ],
);

const multiSelectQuestion = checkoutQuestionFromRecord(
  {
    id: "checkout-multiple",
    selection_mode: "multiple",
    min_selections: 1,
    max_selections: null,
    is_required: false,
    answer_choices: [{
      option_id: "optional-1",
      product_id: 101,
      product_role: "optional_addon",
    }],
  },
  3,
);
assert.equal(multiSelectQuestion.selectionMode, "multiple");
assert.equal(multiSelectQuestion.minSelections, 1);
assert.equal(multiSelectQuestion.maxSelections, undefined);
// A multiple-selection checkout group with min_selections=1 is required at
// the group level even when each individual product is an optional add-on.
assert.equal(multiSelectQuestion.required, true);
assert.equal(isCheckoutQuestionRequired(multiSelectQuestion.products, multiSelectQuestion.minSelections), true);
assert.equal(multiSelectQuestion.products[0].productRole, "optional_addon");
assert.equal(productRoleForFlexibleSelection("primary_choice"), "optional_addon");
assert.equal(productRoleForFlexibleSelection("required_companion"), "required_companion");

const serializedProgram = programToRecord({
  id: "program-1",
  name: "Weight Loss",
  checkoutQuestions: [multiSelectQuestion],
} as never);
assert.deepEqual(serializedProgram.checkout_questions?.[0], {
  ...multiSelectQuestion,
  selection_mode: "multiple",
  min_selections: 1,
  max_selections: null,
  is_required: true,
});

console.log("checkout question catalog dependency tests passed");
