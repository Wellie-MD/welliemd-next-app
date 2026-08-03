import { strict as assert } from "assert";

import { isDuplicateSlugError } from "../src/features/treatments/common/utils/duplicateSlugError.ts";
import {
  applyPersistedSectionField,
  buildSectionFieldConfiguration,
  sectionEditorChoices,
  sectionEditorDqChoices,
} from "../src/features/treatments/common/utils/sectionFieldConfiguration.ts";

const test = (name: string, run: () => void) => {
  run();
  console.log(`PASS ${name}`);
};

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
