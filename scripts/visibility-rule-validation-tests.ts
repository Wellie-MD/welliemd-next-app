import { strict as assert } from "assert";

import type { VisibilityGroup } from "../src/components/questionnaires/VisibilityRuleBuilder.tsx";
import {
  validateVisibilityGroup,
  normalizeVisibilityQuestionId,
  visibilityPathLabel,
} from "../src/components/questionnaires/visibilityRuleValidation.ts";
import { resolveChoiceValue } from "../src/utils/choiceValue.ts";
import {
  toBuilderGroup,
  fromBuilderGroup,
  PATIENT_PROFILE_SEX_ID,
  PATIENT_PROFILE_AGE_ID,
} from "../src/features/treatments/utils/visibilityBuilderAdapters.ts";
import { buildCustomProgramVisibilityQuestions } from "../src/features/treatments/flow-builder/utils/customProgramVisibilityQuestions.ts";
import type { CustomProgramFlowItem } from "../src/features/treatments/types/index.ts";

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

test("is_empty and is_not_empty operators require no value", () => {
  assert.deepEqual(validateVisibilityGroup(group([{
    type: "condition",
    question_id: "question-1",
    operator: "is_empty",
    value: "",
  }])), []);

  assert.deepEqual(validateVisibilityGroup(group([{
    type: "condition",
    question_id: "question-1",
    operator: "is_not_empty",
    value: "",
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

test("long choice labels remain selectable as-is", () => {
  const value = "Increase the dose if a higher one is available, or continue with my current dose if it's already at the maximum";
  assert.equal(resolveChoiceValue([value, "Decrease dose"], value), value);
});

test("legacy snake_case question ids are normalized before rendering", () => {
  assert.equal(normalizeVisibilityQuestionId({ question_id: "question-legacy" }), "question-legacy");
  assert.equal(normalizeVisibilityQuestionId({ questionId: "question-camel" }), "question-camel");
  assert.equal(normalizeVisibilityQuestionId({ question_id: undefined }), "");
});

test("buildCustomProgramVisibilityQuestions only returns routing_question items", () => {
  const flowItems: CustomProgramFlowItem[] = [
    { id: "auth1", kind: "authentication", title: "Auth" },
    { id: "q1", kind: "routing_question", sourceId: "source-q1", title: "Q1", questionKind: "single_choice", choices: ["Yes", "No"] },
    { id: "sec1", kind: "section", sourceId: "sec-1", title: "Medical Section" },
    { id: "consent1", kind: "consent", sourceId: "c-1", title: "Consent Form" },
    { id: "q2", kind: "routing_question", sourceId: "source-q2", title: "Q2", questionKind: "text" },
    { id: "prog1", kind: "program", sourceId: "prog-1", title: "Program 1" },
    { id: "chk1", kind: "checkout", title: "Checkout" },
  ];

  const questions = buildCustomProgramVisibilityQuestions({ flowItems });
  assert.equal(questions.length, 2);
  assert.equal(questions[0].id, "source-q1");
  assert.equal(questions[0].text, "Q1");
  assert.equal(questions[1].id, "source-q2");
  assert.equal(questions[1].text, "Q2");
});

test("fromBuilderGroup emits canonical operators and source answer", () => {
  const builderGroup: VisibilityGroup = {
    type: "group",
    operator: "AND",
    children: [
      {
        type: "condition",
        question_id: "source-q1",
        operator: "equals",
        value: "Yes",
      },
      {
        type: "condition",
        question_id: "source-q2",
        operator: "is_not_empty",
        value: "",
      },
    ],
  };

  const domainGroup = fromBuilderGroup(builderGroup);
  assert.equal(domainGroup.mode, "nested");
  assert.equal(domainGroup.rules.length, 2);
  assert.equal(domainGroup.rules[0].operator, "eq");
  assert.equal(domainGroup.rules[0].source, "answer");
  assert.equal(domainGroup.rules[0].value, "Yes");
  assert.equal(domainGroup.rules[1].operator, "is_not_empty");
  assert.equal(domainGroup.rules[1].source, "answer");
  assert.equal(domainGroup.rules[1].value, undefined);
});

test("toBuilderGroup and fromBuilderGroup round-trip preserved", () => {
  const original = {
    mode: "nested" as const,
    rules: [
      {
        questionId: "source-q1",
        operator: "eq" as const,
        value: "Option A",
        source: "answer" as const,
      },
    ],
    subgroups: [
      {
        mode: "simple" as const,
        rules: [
          {
            questionId: "source-q2",
            operator: "gt" as const,
            value: "25",
            source: "answer" as const,
          },
        ],
        subgroups: [],
      },
    ],
  };

  const builderShape = toBuilderGroup(original);
  const convertedBack = fromBuilderGroup(builderShape);
  assert.deepEqual(convertedBack, original);
});

console.log("All visibility-rule validation tests passed.");
