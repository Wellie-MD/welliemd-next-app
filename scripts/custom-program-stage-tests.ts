import { strict as assert } from "assert";
import type {
  CommonSection,
  ConsentForm,
  CustomProgram,
  CustomProgramFlowItem,
  Program,
} from "../src/features/treatments/types/index";
import {
  buildAdminCustomProgramStages,
  canonicalizeCustomProgramFlowItems,
  getCustomProgramConsentSubtitle,
  describeCustomProgramReorderBlock,
  reorderCustomProgramItemWithinStage,
  synchronizeCustomProgramStructure,
} from "../src/features/treatments/flow-builder/utils/customProgramStages.ts";
import {
  customProgramMutationErrorMessage,
  isCustomProgramRevisionConflict,
} from "../src/features/treatments/api/customProgramErrors.ts";

const item = (
  id: string,
  kind: CustomProgramFlowItem["kind"],
  sourceId?: string,
  locked = false
): CustomProgramFlowItem => ({ id, kind, sourceId, locked, title: id, subtitle: `${kind} item` });

const customProgram = (flowItems: CustomProgramFlowItem[]): CustomProgram => ({
  id: "custom-1",
  name: "Custom",
  description: "",
  status: "draft",
  audience: "all",
  minAge: 18,
  includedProgramIds: ["stale-program"],
  sectionIds: [],
  consentIds: [],
  checkoutOptions: [],
  flowItems,
  updatedAt: "2026-07-20",
  slug: "custom",
  programMatchingRules: {
    "program-1": { enabled: true, rule: {} },
    "stale-program": { enabled: true, rule: {} },
  },
});

const program = (id: string, consentIds: string[] = []): Program => ({
  id,
  name: id,
  stage: "intake",
  treatmentTypeKey: "weightloss",
  visitType: "weightloss",
  questionCount: 3,
  checkoutQuestionCount: 2,
  status: "published",
  updatedAt: "2026-07-20",
  slug: id,
  consentIds,
});

const section: CommonSection = {
  id: "section-1",
  name: "Medical Baseline",
  scope: "global",
  visitTypeKeys: [],
  fieldCount: 5,
  updatedAt: "2026-07-20",
};

const consent = (id: string, name = id): ConsentForm => ({
  id,
  name,
  scope: "visit_type",
  isArchived: false,
  visitTypeKeys: ["weightloss"],
  updatedAt: "2026-07-20",
});

const test = (name: string, run: () => void) => {
  run();
  console.log(`PASS ${name}`);
};

test("shows a clear message for every stale builder error shape", () => {
  const errors = [
    { response: { data: { error: "stale_builder_revision" } } },
    { response: { data: { detail: "stale_builder_revision" } } },
    { response: { data: { detail: { detail: "stale_builder_revision" } } } },
  ];
  errors.forEach((error) => assert.equal(isCustomProgramRevisionConflict(error), true));
  assert.match(customProgramMutationErrorMessage(errors[0], "fallback"), /Refresh/);
  assert.equal(customProgramMutationErrorMessage(new Error("network"), "fallback"), "fallback");
});

test("canonicalizes every item into a fixed stage and removes duplicate system rows", () => {
  const result = canonicalizeCustomProgramFlowItems([
    item("consent-1", "consent", "consent-1"),
    item("checkout-duplicate", "checkout", undefined, true),
    item("program-1", "program", "program-1"),
    item("auth-1", "authentication", undefined, true),
    item("question-1", "routing_question"),
    item("auth-duplicate", "authentication", undefined, true),
    item("checkout-override", "checkout"),
    item("checkout-second", "checkout", undefined, true),
  ]);

  assert.deepEqual(result.map((candidate) => candidate.id), [
    "auth-1",
    "question-1",
    "program-1",
    "consent-1",
    "checkout-override",
    "checkout-duplicate",
  ]);
  assert.equal(
    result.find((candidate) => candidate.id === "question-1")?.sourceId,
    "question-1",
  );
});

test("materializes safe system rows for legacy flows", () => {
  const result = canonicalizeCustomProgramFlowItems([item("program-1", "program", "program-1")]);
  assert.equal(result[0].kind, "authentication");
  assert.equal(result[0].locked, true);
  assert.equal(result[result.length - 1]?.kind, "checkout");
  assert.equal(result[result.length - 1]?.locked, true);
});

test("synchronizes relation mirrors and drops matching rules for detached Programs", () => {
  const synced = synchronizeCustomProgramStructure(customProgram([]), [
    item("program-row", "program", "program-1"),
    item("section-row", "section", "section-1"),
    item("consent-row", "consent", "consent-1"),
  ]);
  assert.deepEqual(synced.includedProgramIds, ["program-1"]);
  assert.deepEqual(synced.sectionIds, ["section-1"]);
  assert.deepEqual(synced.consentIds, ["consent-1"]);
  assert.deepEqual(Object.keys(synced.programMatchingRules), ["program-1"]);
});

test("keeps a parent section when only reusable fields are selected", () => {
  const synced = synchronizeCustomProgramStructure(customProgram([]), [
    { ...item("field-row", "section_field", "section-1"), mappedField: "field-1" },
  ]);

  assert.deepEqual(synced.sectionIds, ["section-1"]);
  assert.equal(synced.flowItems.find((candidate) => candidate.id === "field-row")?.kind, "section_field");
});

test("reorders within a stage and rejects cross-stage movement", () => {
  const flow = canonicalizeCustomProgramFlowItems([
    item("q-1", "routing_question"),
    item("q-2", "routing_question"),
    item("program-1", "program", "program-1"),
  ]);
  const moved = reorderCustomProgramItemWithinStage(flow, "q-1", "q-2");
  assert.deepEqual(moved.filter((candidate) => candidate.kind === "routing_question").map((candidate) => candidate.id), ["q-2", "q-1"]);

  const rejected = reorderCustomProgramItemWithinStage(flow, "q-1", "program-1");
  assert.deepEqual(rejected.map((candidate) => candidate.id), flow.map((candidate) => candidate.id));
});

test("explains why a drag-and-drop reorder was rejected", () => {
  const flow = canonicalizeCustomProgramFlowItems([
    item("q-1", "routing_question"),
    item("q-2", "routing_question"),
    item("program-1", "program", "program-1"),
  ]);

  assert.equal(describeCustomProgramReorderBlock(flow, "q-1", "q-2"), null);

  const crossStage = describeCustomProgramReorderBlock(flow, "q-1", "program-1");
  assert.match(crossStage!, /only be reordered within their own stage/);

  const lockedTarget = describeCustomProgramReorderBlock(flow, "q-1", flow[0].id);
  assert.match(lockedTarget!, /locked system step/);
});

test("projects authoritative effective stages and never derives inheritance from Program consentIds", () => {
  const cp = customProgram([
    item("q-1", "routing_question"),
    item("section-row", "section", "section-1"),
    { ...item("section-field-row", "section_field", "section-1"), mappedField: "field-1" },
    item("program-row-1", "program", "program-1"),
    item("program-row-2", "program", "program-2"),
    item("explicit-consent", "consent", "consent-1"),
  ]);
  const projection = buildAdminCustomProgramStages(cp, {
    programs: [program("program-1", ["consent-1", "consent-2"]), program("program-2", ["consent-2"])],
    sections: [section],
    consents: [consent("consent-1"), consent("consent-2")],
    effectiveContent: {
      customProgramId: "custom-1",
      revision: "2026-07-20",
      systemSteps: { authentication: { count: 1, locked: true } },
      stages: {
        stage1: {
          questions: [{ id: "q-1", sourceId: "q-1", title: "q-1", displayOrder: 1 }],
          sections: [{ sourceId: "section-1", sourceVersion: 1, name: "Medical Baseline", applicableProgramIds: ["program-1", "program-2"], resolvedFrom: [{ type: "global" }] }],
        },
        stage2: { programs: [
          { inclusionId: "program-row-1", programId: "program-1", name: "program-1", displayOrder: 1, matchingEnabled: true, matchingRule: {}, matchingState: "always_offered", effectiveConsentCount: 2, effectiveSectionCount: 1, checkoutCount: 2 },
          { inclusionId: "program-row-2", programId: "program-2", name: "program-2", displayOrder: 2, matchingEnabled: true, matchingRule: {}, matchingState: "always_offered", effectiveConsentCount: 1, effectiveSectionCount: 1, checkoutCount: 2 },
        ] },
        stage3: { consents: [
          { sourceId: "consent-1", sourceVersion: 1, name: "consent-1", scope: "common", sourceType: "global", applicableProgramIds: ["program-1", "program-2"], resolvedFrom: [{ type: "global" }] },
          { sourceId: "consent-2", sourceVersion: 1, name: "consent-2", scope: "common", sourceType: "visit_type", applicableProgramIds: ["program-1", "program-2"], resolvedFrom: [{ type: "visit_type", key: "weightloss" }] },
        ] },
        stage4: { checkout: { count: 1, locked: true } },
      },
      blockers: [],
    },
  });

  assert.deepEqual(projection.stages.map((stage) => stage.items.length), [2, 2, 2]);
  assert.deepEqual(projection.stages[0].items.map((candidate) => candidate.kind), ["routing_question", "section"]);
  assert.equal(projection.checkoutStage.stageNumber, 4);
  assert.equal(projection.checkoutStage.title, "Checkout");
  const automatic = projection.stages[2].items.find((candidate) => candidate.derived);
  assert.equal(automatic?.title, "consent-2");
  assert.deepEqual(automatic?.matchedProgramNames, ["program-1", "program-2"]);
  const inheritedGlobal = projection.stages[2].items.find((candidate) => candidate.title === "consent-1");
  assert.equal(getCustomProgramConsentSubtitle(inheritedGlobal!), "Universal");
  assert.equal(getCustomProgramConsentSubtitle(automatic!), "Auto · for program-1, program-2");
  assert.equal(projection.totalItemCount, 8);
});

test("keeps empty stages visible", () => {
  const projection = buildAdminCustomProgramStages(customProgram([]), {
    programs: [],
    sections: [],
    consents: [],
  });
  assert.deepEqual(projection.stages.map((stage) => stage.items.length), [0, 0, 0]);
  assert.equal(projection.checkoutStage.stageNumber, 4);
  assert.equal(projection.totalItemCount, 2);
});

test("resolves blank block labels from catalogs instead of showing references", () => {
  const namedProgram = { ...program("program-1"), name: "Branded GLP" };
  const projection = buildAdminCustomProgramStages(
    customProgram([{ ...item("row-1", "program", "program-1"), title: "", subtitle: "" }]),
    { programs: [namedProgram], sections: [], consents: [] },
  );
  assert.equal(projection.stages[1].items[0]?.title, "Branded GLP");
  assert.notEqual(projection.stages[1].items[0]?.title, "program-1");
});

console.log("All Custom Program stage tests passed.");
