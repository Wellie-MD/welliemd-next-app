import { strict as assert } from "node:assert";
import type { ProgramEffectiveContent } from "../src/features/treatments/api/programsApi";
import type { ProgramQuestion } from "../src/features/treatments/types";
import { projectEffectiveProgramFlow } from "../src/features/treatments/programs/programEffectiveFlow";

const item = (id: string, kind: ProgramQuestion["kind"], labCheckout = false): ProgramQuestion => ({
  id,
  order: 1,
  text: id,
  kind,
  section: "Intake",
  required: true,
  ...(labCheckout ? { elementConfig: { labCheckout: true } } : {}),
});

const authored = [
  item("screening", "text"),
  item("shipping", "shipping_address"),
  item("lab", "checkout", true),
  item("consent", "consent"),
  item("product", "checkout"),
];

const effective: ProgramEffectiveContent = {
  visit_type: "weightloss",
  sections: { inherited_global: [], inherited_visit_type: [], explicit_program: [] },
  consents: {
    inherited_global: [],
    inherited_visit_type: [],
    explicit_program: [],
    inline_conditional: [],
  },
  blockers: [],
};

for (const content of [undefined, effective]) {
  const flow = projectEffectiveProgramFlow(authored, content);
  assert.deepEqual(
    flow.map((question) => question.id),
    ["screening", "lab", "consent", "shipping", "product"],
    "Shipping Address must appear directly before product selection, after labs and consents",
  );
}

console.log("PASS Program list places Shipping Address immediately before product selection");
