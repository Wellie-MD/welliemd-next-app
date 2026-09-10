import { strict as assert } from "assert";

import { isDuplicateSlugError } from "../src/features/treatments/common/utils/duplicateSlugError.ts";
import {
  applyPersistedSectionField,
  buildSectionFieldConfiguration,
  sectionEditorChoices,
  sectionEditorDqChoices,
} from "../src/features/treatments/common/utils/sectionFieldConfiguration.ts";
import {
  programFromRecord,
  programToRecord,
  questionFromRecord,
  questionToRecord,
} from "../src/features/treatments/api/mappers.ts";
import { applyQuestionSave } from "../src/features/treatments/programs/utils/programQuestionSave.ts";
import { getQuestionVisibilityDependents } from "../src/features/treatments/programs/utils/programQuestionVisibilityDependencies.ts";

const test = (name: string, run: () => void) => {
  run();
  console.log(`PASS ${name}`);
};

test("question editability survives API mapping in both directions", () => {
  const editable = questionFromRecord({
    id: "admin-question",
    question_text: "Editable inherited question",
    question_type: "text",
    can_be_modified: true,
    is_read_only: false,
    is_from_admin: true,
    locked: false,
  });
  assert.equal(editable.lockClientChanges, false);

  const persisted = questionToRecord({
    ...editable,
    lockClientChanges: true,
  });
  assert.equal(persisted.can_be_modified, false);
  assert.equal(persisted.is_read_only, true);
  assert.equal(persisted.is_from_admin, true);
  assert.equal(persisted.locked, true);
});

test("saving a question selected from the editor sidebar replaces that question", () => {
  const questionA = {
    id: "question-a",
    order: 1,
    text: "First question",
    kind: "number" as const,
    section: "General Intake",
    required: true,
  };
  const questionB = {
    id: "question-b",
    order: 2,
    text: "Second question",
    kind: "number" as const,
    section: "General Intake",
    required: true,
  };

  const result = applyQuestionSave([questionA, questionB], {
    ...questionB,
    kind: "text",
  });

  assert.deepEqual(result.map((question) => question.id), ["question-a", "question-b"]);
  assert.equal(result[0].kind, "number");
  assert.equal(result[1].kind, "text");
});

test("visibility dependency notice includes questions, products, and lab requirements", () => {
  const dependents = getQuestionVisibilityDependents(
    "age",
    [{
      id: "follow-up",
      order: 2,
      text: "Adult follow-up",
      kind: "text",
      section: "General Intake",
      required: true,
      visibilityRuleGroup: {
        mode: "nested",
        rules: [],
        subgroups: [{ mode: "simple", rules: [{ questionId: "age", operator: "gte", value: "18" }] }],
      },
    }],
    [{
      id: "checkout",
      text: "Medication selection",
      visibilityRules: { mode: "simple", rules: [] },
      products: [{
        id: "product-1",
        category: "Weight",
        regimen: "Starter",
        doseLabel: "10 mg",
        productRole: "primary_choice",
        visibilityRules: { mode: "simple", rules: [{ questionId: "age", operator: "gte", value: "18" }] },
      }],
    }],
    [{
      id: "lab-1",
      requirementKind: "single",
      panelName: "CBC",
      displayOrder: 1,
      isRequired: true,
      isActive: true,
      visibilityRuleGroup: { mode: "simple", rules: [{ questionId: "age", operator: "gte", value: "18" }] },
    }],
  );

  assert.deepEqual(dependents.map((dependent) => dependent.label), [
    "Question \"Adult follow-up\"",
    "Product \"10 mg\" in \"Medication selection\"",
    "Lab requirement \"CBC\"",
  ]);
});

test("a generic Program-save 400 is not presented as a duplicate slug", () => {
  assert.equal(
    isDuplicateSlugError({
      response: {
        status: 400,
        data: { error: "Invalid request. Please check your input." },
      },
      config: {
        data: JSON.stringify({ slug: "sqa23" }),
      },
    }),
    false,
  );
});

test("a Product route mismatch is not presented as a duplicate slug", () => {
  assert.equal(
    isDuplicateSlugError({
      response: {
        status: 400,
        data: {
          error_code: "product_treatment_type_mismatch",
          error: "The Product Treatment Type does not match the Program.",
        },
      },
    }),
    false,
  );
});

test("an explicit slug field error is presented as a duplicate slug", () => {
  assert.equal(
    isDuplicateSlugError({
      response: {
        status: 400,
        data: { slug: ["Please enter a unique slug."] },
      },
    }),
    true,
  );
});

test("the stable duplicate slug code is supported", () => {
  assert.equal(
    isDuplicateSlugError({
      response: {
        status: 400,
        data: { error_code: "duplicate_slug" },
      },
    }),
    true,
  );
});

test("Program lab sharing and release-gate settings survive an Admin save", () => {
  const program = programFromRecord({
    id: "program-1",
    name: "Hair and weight",
    slug: "hair-and-weight",
    lab_requirements: [{
      id: "requirement-1",
      panel_id: "panel-cbc",
      display_order: 1,
      is_required: true,
      is_release_required: false,
      sharing_policy: "explicit_group",
      sharing_group_key: "baseline-cbc",
      is_active: true,
    }],
  });

  const requirement = program.labRequirements?.[0];
  assert.equal(requirement?.isReleaseRequired, false);
  assert.equal(requirement?.sharingPolicy, "explicit_group");
  assert.equal(requirement?.sharingGroupKey, "baseline-cbc");

  const payload = programToRecord(program, []);
  assert.deepEqual(payload.lab_requirements, [{
    requirement_kind: "single",
    panel_id: "panel-cbc",
    combined_panel_id: null,
    display_order: 1,
    is_required: true,
    is_release_required: false,
    sharing_policy: "explicit_group",
    sharing_group_key: "baseline-cbc",
    is_active: true,
    instructions: "",
    visibility_rule: null,
  }]);
});

test("current Section editor values override stale element configuration", () => {
  const configuration = buildSectionFieldConfiguration({
    id: "field-1",
    order: 1,
    text: "Are you at least 18?",
    kind: "single_choice",
    section: "Age Screening",
    required: true,
    choices: ["above 18", "below 18"],
    dqChoices: ["below 18"],
    visibilityRuleGroup: {
      mode: "simple",
      rules: [{ questionId: "country", operator: "equals", value: "US" }],
    },
    includeInQa: true,
    hiddenFromPatient: false,
    prefillFromPrevious: true,
    elementConfig: {
      choices: ["stale choice"],
      dqChoices: ["stale choice"],
      visibilityRuleGroup: { mode: "simple", rules: [] },
      includeInQa: false,
      hiddenFromPatient: true,
      prefillFromPrevious: false,
      serverOwnedMetadata: "preserved",
    },
  });

  assert.deepEqual(configuration.choices, ["above 18", "below 18"]);
  assert.deepEqual(configuration.dqChoices, ["below 18"]);
  assert.deepEqual(configuration.visibilityRuleGroup, {
    mode: "simple",
    rules: [{ questionId: "country", operator: "equals", value: "US" }],
  });
  assert.equal(configuration.includeInQa, true);
  assert.equal(configuration.hiddenFromPatient, false);
  assert.equal(configuration.prefillFromPrevious, true);
  assert.equal(configuration.serverOwnedMetadata, "preserved");
});

test("cleared Section choices and disqualifiers replace stale values", () => {
  const configuration = buildSectionFieldConfiguration({
    id: "field-1",
    order: 1,
    text: "Are you at least 18?",
    kind: "single_choice",
    section: "Age Screening",
    required: true,
    choices: [],
    dqChoices: [],
    elementConfig: {
      choices: ["above 18", "below 18"],
      dqChoices: ["below 18"],
      validation_rules: { disqualifying_answer: "below 18" },
    },
  });

  assert.deepEqual(configuration.choices, []);
  assert.deepEqual(configuration.dqChoices, []);
  assert.deepEqual(configuration.validation_rules, {
    disqualifying_answer: "below 18",
  });
});

test("Section object choices keep canonical values through a real label edit", () => {
  const serverConfiguration = {
    choices: [
      { label: "above 18", value: "adult" },
      { label: "below 18", option_id: "minor" },
    ],
    dqChoices: ["minor"],
  };
  assert.deepEqual(sectionEditorChoices(serverConfiguration), [
    "above 18",
    "below 18",
  ]);
  assert.deepEqual(sectionEditorDqChoices(serverConfiguration), ["below 18"]);

  const configuration = buildSectionFieldConfiguration({
    id: "field-1",
    order: 1,
    text: "Are you at least 18?",
    kind: "single_choice",
    section: "Age Screening",
    required: true,
    choices: ["above 18", "under 18"],
    dqChoices: ["under 18"],
    elementConfig: serverConfiguration,
  });

  assert.deepEqual(configuration.choices, [
    { label: "above 18", value: "adult" },
    { label: "under 18", option_id: "minor" },
  ]);
  assert.deepEqual(configuration.dqChoices, ["under 18"]);
});

test("a newly saved Section field adopts its persisted UUID", () => {
  const question = {
    id: "q-temporary",
    order: 1,
    text: "Are you at least 18?",
    kind: "single_choice" as const,
    section: "Age Screening",
    required: true,
    choices: ["above 18", "below 18"],
  };
  const persisted = applyPersistedSectionField(question, {
    id: "c2eeb3f9-a408-430b-8d66-6e97470ee54b",
    sectionId: "section-1",
    order: 1,
    label: question.text,
    kind: question.kind,
    required: true,
    configuration: {
      choices: question.choices,
      validation_rules: { disqualifying_answer: "below 18" },
    },
  });

  assert.equal(persisted.id, "c2eeb3f9-a408-430b-8d66-6e97470ee54b");
  assert.deepEqual(persisted.elementConfig, {
    choices: question.choices,
    validation_rules: { disqualifying_answer: "below 18" },
  });
});

console.log("All Program edit-save tests passed.");
