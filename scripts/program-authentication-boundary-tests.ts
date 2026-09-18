/**
 * Builder invariants for the locked Patient Authentication boundary.
 * Covers plan section A5 scenarios ADM-01 through ADM-04.
 */
import { strict as assert } from "assert";

import type { ProgramQuestion } from "../src/features/treatments/types/index";
import {
  PROGRAM_AUTHORING_COPY,
  PROGRAM_QUESTION_KIND_ORDER,
  PROGRAM_SYSTEM_NODE_KIND,
} from "../src/features/treatments/programs/programAuthoringConstants.ts";
import {
  hasPatientAuthentication,
  isDeletableElement,
  isDraggableElement,
  persistableQuestionIds,
  projectAuthoredFlow,
} from "../src/features/treatments/programs/programSystemBoundary.ts";

/** A Program whose author has added the Patient Authentication element. */
const program = { id: "program-1", authConfig: { email: true, enabled: true } };

/** A freshly created Program: nothing has been added yet. */
const emptyProgram = { id: "program-1", authConfig: { email: true } };

const question = (
  id: string,
  kind: ProgramQuestion["kind"] = "text"
): ProgramQuestion => ({
  id,
  order: 1,
  text: id,
  kind,
  section: "Screening",
  required: true,
});

const test = (name: string, run: () => void) => {
  run();
  console.log(`PASS ${name}`);
};

test("a newly created Program is completely empty", () => {
  assert.equal(hasPatientAuthentication(emptyProgram), false);
  assert.deepEqual(projectAuthoredFlow(emptyProgram, []), []);
});

test("adding Patient Authentication puts it first in the flow", () => {
  const flow = projectAuthoredFlow(program, [question("q-1")]);

  assert.equal(hasPatientAuthentication(program), true);
  assert.equal(flow.length, 2);
  assert.equal(flow[0].kind, PROGRAM_SYSTEM_NODE_KIND);
  assert.equal(flow[0].text, PROGRAM_AUTHORING_COPY.authTitle);
  assert.equal(flow[0].order, 1);
  assert.equal(flow[1].id, "q-1");
});

test("authored questions render without it until it is added", () => {
  const flow = projectAuthoredFlow(emptyProgram, [question("q-1")]);

  assert.deepEqual(flow.map((item) => item.id), ["q-1"]);
});

test("ADM-02 Personal Details is absent from the Program element types", () => {
  assert.equal(PROGRAM_QUESTION_KIND_ORDER.includes("personal_details"), false);
  assert.equal(
    PROGRAM_QUESTION_KIND_ORDER.includes(PROGRAM_SYSTEM_NODE_KIND),
    false
  );
});

test("ADM-04 authentication stays first and never reaches the reorder API", () => {
  const flow = projectAuthoredFlow(program, [question("q-1"), question("q-2")]);

  assert.deepEqual(
    flow.map((item) => item.id),
    ["program-auth-program-1", "q-1", "q-2"]
  );
  assert.deepEqual(persistableQuestionIds(flow), ["q-1", "q-2"]);
});

test("the boundary is pinned first but can be removed by whoever added it", () => {
  const [authentication, authored] = projectAuthoredFlow(program, [
    question("q-1"),
  ]);

  assert.equal(isDraggableElement(authentication), false);
  assert.equal(isDeletableElement(authentication), true);
  assert.equal(isDraggableElement(authored), true);
});

test("a stale authored Personal Details row remains visible for removal", () => {
  const flow = projectAuthoredFlow(program, [
    question("legacy-auth", "personal_details"),
    question("q-1"),
  ]);

  assert.equal(
    flow.filter((item) => item.kind === PROGRAM_SYSTEM_NODE_KIND).length,
    1
  );
  assert.equal(
    flow.some((item) => item.id === "legacy-auth"),
    true
  );
  assert.deepEqual(
    persistableQuestionIds(flow),
    ["legacy-auth", "q-1"]
  );
});

test("checkout questions stay out of the question reorder payload", () => {
  const flow = projectAuthoredFlow(program, [
    question("q-1"),
    question("checkout-1", "checkout"),
  ]);

  assert.deepEqual(persistableQuestionIds(flow), ["q-1"]);
});

console.log("All Patient Authentication boundary tests passed.");
