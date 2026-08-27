import { strict as assert } from "assert";

import type { VisibilityGroup } from "../src/components/questionnaires/VisibilityRuleBuilder.tsx";
import {
  validateVisibilityGroup,
  normalizeVisibilityQuestionId,
  visibilityPathLabel,
} from "../src/components/questionnaires/visibilityRuleValidation.ts";
import { resolveChoiceValue } from "../src/utils/choiceValue.ts";
import {
  filterVisibilitySourceQuestions,
  isCheckoutVisibilitySource,
} from "../src/components/questionnaires/visibilitySourceFilter.ts";

const test = (name: string, run: () => void) => {
  run();
  console.log(`PASS ${name}`);
};

const group = (children: VisibilityGroup["children"]): VisibilityGroup => ({
  type: "group",
  operator: "AND",
  children,
});

test("an unconfigured root is valid", () => {
  assert.deepEqual(validateVisibilityGroup(group([])), []);
});

test("an incomplete condition identifies both exact fields", () => {
  const issues = validateVisibilityGroup(group([{
    type: "condition",
    question_id: "",
    operator: "equals",
    value: "",
  }]));

  assert.deepEqual(issues, [
    {
      path: [0],
      field: "question",
      message: "Select the question that controls this condition.",
    },
    {
      path: [0],
      field: "value",
      message: "Enter the value that triggers this condition.",
    },
  ]);
});

test("optional field can remain blank", () => {
  assert.deepEqual(validateVisibilityGroup(group([{
    type: "condition",
    question_id: "question-1",
    operator: "equals",
    value: "yes",
  }])), []);
});

test("nested condition paths point to the exact location", () => {
  const issues = validateVisibilityGroup(group([
    {
      type: "condition",
      question_id: "question-1",
      operator: "equals",
      value: "yes",
    },
    group([{
      type: "condition",
      question_id: "question-2",
      operator: "between",
      value: ["18", ""],
    }]),
  ]));

  assert.equal(visibilityPathLabel(issues[0].path), "2.1");
  assert.equal(issues[0].field, "value");
  assert.equal(issues[0].message, "Enter both the minimum and maximum values.");
});

test("empty nested groups are identified instead of reaching the API", () => {
  assert.deepEqual(validateVisibilityGroup(group([group([])])), [{
    path: [0],
    field: "group",
    message: "Add a condition to this group or remove the empty group.",
  }]);
});

test("multi-value operators require at least one value", () => {
  const issues = validateVisibilityGroup(group([{
    type: "condition",
    question_id: "question-1",
    operator: "in",
    value: [],
  }]));

  assert.equal(issues[0].message, "Enter at least one trigger value.");
});

test("legacy short choice values resolve to an unambiguous current label", () => {
  assert.equal(
    resolveChoiceValue(
      [
        "Semaglutide (Ozempic, Wegovy, Rybelsus)",
        "Tirzepatide (Zepbound, Mounjaro)",
        "None of these",
      ],
      "Semaglutide",
    ),
    "Semaglutide (Ozempic, Wegovy, Rybelsus)",
  );
});

test("ambiguous dose prefixes are left unchanged", () => {
  assert.equal(
    resolveChoiceValue(
      ["Semaglutide/Ozempic/Wegovy 0.25mg", "Semaglutide/Ozempic/Wegovy 0.5mg"],
      "Semaglutide",
    ),
    "Semaglutide",
  );
});

test("checkout and lab checkout nodes cannot be visibility sources", () => {
  assert.equal(isCheckoutVisibilitySource({ kind: "checkout" }), true);
  assert.equal(isCheckoutVisibilitySource({ question_type: "product_selection" }), true);
  assert.equal(isCheckoutVisibilitySource({ kind: "program-lab-checkout" }), true);
  assert.equal(isCheckoutVisibilitySource({ kind: "shipping_address" }), true);
  assert.equal(isCheckoutVisibilitySource({ elementConfig: { labCheckout: true } }), true);
  assert.equal(isCheckoutVisibilitySource({ kind: "text" }), false);
});

test("filter removes checkout variants while preserving screening questions", () => {
  const filtered = filterVisibilitySourceQuestions([
    { id: "screening-1", kind: "single_choice" },
    { id: "product-checkout", kind: "checkout" },
    { id: "lab-checkout", kind: "checkout", elementConfig: { labCheckout: true } },
    { id: "section-product", kind: "section", configuration: { questionType: "product_selection" } },
    { id: "shipping", question_type: "shipping_address" },
  ]);

  assert.deepEqual(filtered.map((question) => question.id), ["screening-1"]);
});

test("long choice labels remain selectable as-is", () => {
  const value = "Increase the dose if a higher one is available, or continue with my current dose if it's already at the maximum";
  assert.equal(resolveChoiceValue([value, "Decrease dose"], value), value);
});

test("legacy snake_case question ids are normalized before rendering", () => {
  assert.equal(normalizeVisibilityQuestionId({ question_id: "question-legacy" }), "question-legacy");
  assert.equal(normalizeVisibilityQuestionId({ questionId: "question-camel" }), "question-camel");
  assert.equal(normalizeVisibilityQuestionId({ question_id: undefined }), "");
});

console.log("All visibility-rule validation tests passed.");
