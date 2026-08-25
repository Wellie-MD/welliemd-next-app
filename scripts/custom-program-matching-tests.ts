import { strict as assert } from "assert";

import type {
  ProgramMatchingConfig,
  ProgramMatchingGroup,
} from "../src/features/treatments/types/customPrograms.ts";
import {
  addCondition,
  addSubgroup,
  countConditions,
  describeRule,
  emptyGroup,
  getNodeAtPath,
  isGroup,
  matchingStatus,
  matchingStatusLabel,
  normalizeRule,
  operatorNeedsSecondValue,
  operatorNeedsValue,
  operatorsForKind,
  removeNode,
  serializeRule,
  updateNode,
  validateRule,
  buildMatchingSources,
  type MatchingSourceField,
} from "../src/features/treatments/flow-builder/utils/programMatchingRules.ts";

const test = (name: string, run: () => void) => {
  run();
  console.log(`PASS ${name}`);
};

const sources: MatchingSourceField[] = [
  {
    id: "primary_concern",
    label: "Primary concern",
    kind: "single",
    group: "Custom Program questions",
    choices: ["Weight loss", "Hormone health", "Both"],
  },
  {
    id: "health_goals",
    label: "Health goals",
    kind: "multiple",
    group: "Custom Program questions",
    choices: ["branded-glp", "trt"],
  },
  { id: "sec-bmi", label: "BMI", kind: "number", group: "Medical Baseline" },
  { id: "profile:age", label: "Age", kind: "number", group: "Patient Profile" },
  { id: "profile:state", label: "State of residence", kind: "text", group: "Patient Profile" },
];

// --- grammar ---------------------------------------------------------------

test("an empty rule normalizes to an empty root group", () => {
  assert.deepEqual(normalizeRule({}), { combinator: "and", rules: [] });
  assert.deepEqual(normalizeRule(undefined), { combinator: "and", rules: [] });
});

test("a bare legacy condition normalizes into a root group", () => {
  const normalized = normalizeRule({ field: "sec-bmi", operator: "gte", value: 27 });
  assert.equal(normalized.combinator, "and");
  assert.equal(normalized.rules.length, 1);
  assert.deepEqual(normalized.rules[0], { field: "sec-bmi", operator: "gte", value: 27 });
});

test("nested groups survive normalization", () => {
  const nested: ProgramMatchingGroup = {
    combinator: "and",
    rules: [
      { field: "primary_concern", operator: "eq", value: "Weight loss" },
      {
        combinator: "or",
        rules: [
          { field: "sec-bmi", operator: "gte", value: 27 },
          { field: "profile:age", operator: "gte", value: 40 },
        ],
      },
    ],
  };
  assert.deepEqual(normalizeRule(nested), nested);
  assert.equal(countConditions(nested), 3);
});

test("an empty tree serializes back to an empty rule, meaning always offered", () => {
  assert.deepEqual(serializeRule(emptyGroup()), {});
  assert.deepEqual(serializeRule({ combinator: "and", rules: [{ combinator: "or", rules: [] }] }), {
    combinator: "and",
    rules: [{ combinator: "or", rules: [] }],
  });
});

// --- recursive editing -----------------------------------------------------

test("a subgroup is added with the opposite combinator and a starter condition", () => {
  const root = addSubgroup(emptyGroup("and"), []);
  const child = root.rules[0];
  assert.ok(isGroup(child));
  assert.equal((child as ProgramMatchingGroup).combinator, "or");
  assert.equal(countConditions(child), 1);
});

test("conditions can be added to an arbitrarily nested group", () => {
  let root = addSubgroup(emptyGroup("and"), []);
  root = addSubgroup(root, [0]);
  root = addCondition(root, [0, 1], "profile:age");
  const deep = getNodeAtPath(root, [0, 1]);
  assert.ok(isGroup(deep));
  assert.equal((deep as ProgramMatchingGroup).rules.length, 2);
  assert.equal(countConditions(root), 3);
});

test("updating a nested condition leaves its siblings untouched", () => {
  let root = addCondition(addCondition(emptyGroup(), [], "sec-bmi"), [], "profile:age");
  root = updateNode(root, [0], { operator: "gte", value: 27 });
  assert.deepEqual(root.rules[0], { field: "sec-bmi", operator: "gte", value: 27 });
  assert.deepEqual(root.rules[1], { field: "profile:age", operator: "eq", value: "" });
});

test("removing a nested node removes only that node", () => {
  let root = addSubgroup(emptyGroup("and"), []);
  root = addCondition(root, [], "sec-bmi");
  assert.equal(root.rules.length, 2);
  root = removeNode(root, [0]);
  assert.equal(root.rules.length, 1);
  assert.deepEqual(root.rules[0], { field: "sec-bmi", operator: "eq", value: "" });
});

// --- typed operators -------------------------------------------------------

test("operators are filtered by field type", () => {
  const numeric = operatorsForKind("number").map((item) => item.value);
  assert.ok(numeric.includes("gte"));
  assert.ok(numeric.includes("between"));
  assert.ok(!numeric.includes("contains"));

  const single = operatorsForKind("single").map((item) => item.value);
  assert.ok(single.includes("eq"));
  assert.ok(single.includes("in"));
  assert.ok(!single.includes("gt"));

  const multiple = operatorsForKind("multiple").map((item) => item.value);
  assert.ok(multiple.includes("contains"));
  assert.ok(!multiple.includes("gt"));

  const text = operatorsForKind("text").map((item) => item.value);
  assert.ok(text.includes("contains"));
  assert.ok(!text.includes("between"));
});

test("value controls follow the operator", () => {
  assert.equal(operatorNeedsValue("eq"), true);
  assert.equal(operatorNeedsValue("is_empty"), false);
  assert.equal(operatorNeedsValue("is_not_empty"), false);
  assert.equal(operatorNeedsSecondValue("between"), true);
  assert.equal(operatorNeedsSecondValue("eq"), false);
});

// --- validation ------------------------------------------------------------

test("a complete nested rule validates clean", () => {
  const rule: ProgramMatchingGroup = {
    combinator: "and",
    rules: [
      { field: "primary_concern", operator: "eq", value: "Weight loss" },
      {
        combinator: "or",
        rules: [
          { field: "sec-bmi", operator: "gte", value: 27 },
          { field: "health_goals", operator: "contains", value: "branded-glp" },
        ],
      },
    ],
  };
  assert.deepEqual(validateRule(rule, sources), []);
});

test("a field that is not available before Stage 2 is rejected with its exact path", () => {
  const rule: ProgramMatchingGroup = {
    combinator: "and",
    rules: [
      { field: "primary_concern", operator: "eq", value: "Weight loss" },
      { combinator: "or", rules: [{ field: "branded-clinical-q", operator: "eq", value: "Yes" }] },
    ],
  };
  const issues = validateRule(rule, sources);
  assert.equal(issues.length, 1);
  assert.deepEqual(issues[0].path, [1, 0]);
  assert.equal(issues[0].field, "field");
  assert.match(issues[0].message, /not available before treatment options/);
});

test("an operator that does not suit the field type is rejected", () => {
  const issues = validateRule(
    { combinator: "and", rules: [{ field: "sec-bmi", operator: "contains", value: "x" }] },
    sources,
  );
  assert.equal(issues.length, 1);
  assert.equal(issues[0].field, "operator");
});

test("a between condition requires both ends", () => {
  const issues = validateRule(
    { combinator: "and", rules: [{ field: "profile:age", operator: "between", value: 30 }] },
    sources,
  );
  assert.equal(issues.length, 1);
  assert.equal(issues[0].field, "value");
  assert.match(issues[0].message, /both ends/);
});

test("valueless operators do not demand a value", () => {
  assert.deepEqual(
    validateRule(
      { combinator: "and", rules: [{ field: "profile:state", operator: "is_empty" }] },
      sources,
    ),
    [],
  );
});

// --- row status ------------------------------------------------------------

test("an empty rule reads as Always offered", () => {
  const config: ProgramMatchingConfig = { enabled: true, rule: {} };
  assert.equal(matchingStatus(config), "always");
  assert.equal(matchingStatusLabel(config), "Always offered");
});

test("a nested rule reads as Conditional with the total condition count", () => {
  const config: ProgramMatchingConfig = {
    enabled: true,
    rule: {
      combinator: "and",
      rules: [
        { field: "primary_concern", operator: "eq", value: "Weight loss" },
        {
          combinator: "or",
          rules: [
            { field: "sec-bmi", operator: "gte", value: 27 },
            { field: "profile:age", operator: "gte", value: 40 },
          ],
        },
      ],
    },
  };
  assert.equal(matchingStatus(config), "conditional");
  assert.equal(matchingStatusLabel(config), "Conditional · 3 rules");
});

test("one condition is singular", () => {
  assert.equal(
    matchingStatusLabel({
      enabled: true,
      rule: { combinator: "and", rules: [{ field: "sec-bmi", operator: "gte", value: 27 }] },
    }),
    "Conditional · 1 rule",
  );
});

test("withheld is distinct from an empty rule and preserves the authored rule", () => {
  const config: ProgramMatchingConfig = {
    enabled: false,
    rule: { combinator: "and", rules: [{ field: "sec-bmi", operator: "gte", value: 27 }] },
  };
  assert.equal(matchingStatus(config), "withheld");
  assert.equal(matchingStatusLabel(config), "Not offered");
  // The rule survives so re-enabling restores it.
  assert.equal(countConditions(normalizeRule(config.rule)), 1);
});

// --- summaries -------------------------------------------------------------

test("a nested rule summarises with explicit grouping", () => {
  const summary = describeRule(
    {
      combinator: "and",
      rules: [
        { field: "primary_concern", operator: "eq", value: "Weight loss" },
        {
          combinator: "or",
          rules: [
            { field: "sec-bmi", operator: "gte", value: 27 },
            { field: "profile:age", operator: "gte", value: 40 },
          ],
        },
      ],
    },
    sources,
  );
  assert.equal(
    summary,
    "(Primary concern equals Weight loss AND (BMI greater than or equal 27 OR Age greater than or equal 40))",
  );
});

test("an empty rule summarises as Always offered", () => {
  assert.equal(describeRule(emptyGroup(), sources), "Always offered");
});

// --- per-inclusion isolation ----------------------------------------------

test("the same Program can hold different rules in two Custom Programs", () => {
  const inclusionA: ProgramMatchingConfig = {
    enabled: true,
    rule: { combinator: "and", rules: [{ field: "primary_concern", operator: "eq", value: "Weight loss" }] },
  };
  const inclusionB: ProgramMatchingConfig = {
    enabled: true,
    rule: {
      combinator: "and",
      rules: [
        { field: "primary_concern", operator: "eq", value: "Weight loss" },
        { field: "sec-bmi", operator: "gte", value: 27 },
      ],
    },
  };
  assert.equal(matchingStatusLabel(inclusionA), "Conditional · 1 rule");
  assert.equal(matchingStatusLabel(inclusionB), "Conditional · 2 rules");
});

test("editing one inclusion never mutates a sibling inclusion", () => {
  const draft: Record<string, ProgramMatchingConfig> = {
    "program-a": { enabled: true, rule: { combinator: "and", rules: [{ field: "sec-bmi", operator: "gte", value: 27 }] } },
    "program-b": { enabled: true, rule: {} },
  };
  const beforeB = JSON.stringify(draft["program-b"]);

  const rootA = normalizeRule(draft["program-a"].rule);
  const nextA = addCondition(rootA, [], "profile:age");
  const updated = { ...draft, "program-a": { ...draft["program-a"], rule: serializeRule(nextA) } };

  assert.equal(countConditions(normalizeRule(updated["program-a"].rule)), 2);
  assert.equal(JSON.stringify(updated["program-b"]), beforeB);
  assert.equal(countConditions(normalizeRule(draft["program-a"].rule)), 1);
});

// --- source picker ---------------------------------------------------------

const builderInputs = {
  flowItems: [
    { id: "f1", kind: "authentication" },
    { id: "f2", kind: "routing_question", sourceId: "primary_concern", title: "Primary concern", questionKind: "single_choice", choices: ["Weight loss", "Both"] },
    { id: "f3", kind: "section", sourceId: "sec-baseline" },
    { id: "f4", kind: "program", sourceId: "program-branded" },
    { id: "f5", kind: "checkout" },
  ],
  sections: [{ id: "sec-baseline", name: "Medical Baseline" }],
  sectionFields: {
    "sec-baseline": [
      { id: "fld-bmi", sourceFieldId: "fld-bmi", label: "BMI", kind: "number" },
      { id: "fld-height", sourceFieldId: "fld-height", label: "Height", kind: "number" },
    ],
  },
};

test("the picker offers Custom Program questions, shared Section fields and profile fields", () => {
  const built = buildMatchingSources(builderInputs);
  const groups = new Set(built.map((item) => item.group));
  assert.ok(groups.has("Custom Program questions"));
  assert.ok(groups.has("Medical Baseline"));
  assert.ok(groups.has("Patient profile"));
  assert.ok(groups.has("Location"));

  const concern = built.find((item) => item.id === "primary_concern");
  assert.equal(concern?.kind, "single");
  assert.deepEqual(concern?.choices, ["Weight loss", "Both"]);

  // Shared Section fields are legal matching inputs and carry their type.
  assert.equal(built.find((item) => item.id === "fld-bmi")?.kind, "number");
});

test("the picker excludes Program clinical questions and non-question flow items", () => {
  const built = buildMatchingSources(builderInputs);
  const ids = built.map((item) => item.id);
  assert.ok(!ids.includes("program-branded"));
  assert.ok(!ids.includes("f1"));
  assert.ok(!ids.includes("f5"));
});

test("a rule referencing a later Program clinical question fails validation", () => {
  const built = buildMatchingSources(builderInputs);
  const issues = validateRule(
    { combinator: "and", rules: [{ field: "branded-pancreatitis-q", operator: "eq", value: "Yes" }] },
    built,
  );
  assert.equal(issues.length, 1);
  assert.equal(issues[0].field, "field");
});

test("location is present in the picker", () => {
  const built = buildMatchingSources(builderInputs);
  assert.ok(built.some((item) => item.id === "service_state"));
});

test("the picker includes fields from explicitly placed effective Stage-1 Sections", () => {
  const built = buildMatchingSources({
    flowItems: [], sections: [], sectionFields: {},
    effectiveSections: [{
      sourceId: "section-explicit", sourceVersion: 3, name: "Medical Baseline",
      applicableProgramIds: ["program-1"], resolvedFrom: [{ type: "custom_program" }],
      fields: [{ sourceId: "explicit-bmi", label: "BMI", kind: "number", order: 1 }],
    }],
  });
  const field = built.find((item) => item.id === "explicit-bmi");
  assert.equal(field?.group, "Section fields");
  assert.equal(field?.label, "Medical Baseline · BMI");
  assert.equal(field?.kind, "number");
});

console.log("\nAll Custom Program matching rule tests passed.");
