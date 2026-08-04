import { strict as assert } from "assert";

import type { VisibilityGroup } from "../src/components/questionnaires/VisibilityRuleBuilder.tsx";
import {
  validateVisibilityGroup,
  visibilityPathLabel,
} from "../src/components/questionnaires/visibilityRuleValidation.ts";

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

console.log("All visibility-rule validation tests passed.");
