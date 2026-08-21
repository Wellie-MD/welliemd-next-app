import { strict as assert } from "node:assert";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { ProgramMatchingRuleEditor } from "../src/features/treatments/flow-builder/components/modals/ProgramMatchingRuleEditor";
import type { CustomProgram, Program } from "../src/features/treatments/types";

const program: Program = {
  id: "program-1",
  name: "GLP Weight Loss Intake",
  description: "Clinical GLP intake",
  stage: "intake",
  treatmentTypeKey: "weight-loss",
  visitType: "weight-loss",
  questionCount: 12,
  checkoutQuestionCount: 2,
  status: "published",
  updatedAt: "2026-08-21",
  slug: "glp-weight-loss-intake",
};

const customProgram: CustomProgram = {
  id: "custom-1",
  name: "WellieMD Initial Assessment",
  description: "",
  status: "draft",
  audience: "all",
  minAge: 18,
  includedProgramIds: [program.id],
  sectionIds: [],
  consentIds: [],
  checkoutOptions: [],
  flowItems: [
    { id: "auth", kind: "authentication", title: "Patient Authentication", subtitle: "Required", locked: true },
    { id: "question-1", kind: "routing_question", sourceId: "question-1", title: "What would you love to change?", subtitle: "Single choice" },
    { id: "program-row", kind: "program", sourceId: program.id, title: program.name, subtitle: "Treatment option" },
  ],
  updatedAt: "2026-08-21",
  slug: "welliemd-initial-assessment",
  programMatchingRules: {},
};

const html = renderToStaticMarkup(
  <StaticRouter location="/dashboard/treatments/custom-programs/custom-1/builder">
    <ProgramMatchingRuleEditor
      open
      onOpenChange={() => undefined}
      customProgram={customProgram}
      programId={program.id}
      programs={[program]}
      sources={[{ id: "question-1", label: "What would you love to change?", group: "Custom Program questions", kind: "single", choices: ["Weight"] }]}
      onSave={() => undefined}
      onOpenPreview={() => undefined}
    />
  </StaticRouter>,
);

assert.match(html, /WellieMD Initial Assessment/);
assert.match(html, /Eligibility · GLP Weight Loss Intake/);
assert.match(html, /Search the flow/);
assert.match(html, /What would you love to change\?/);
assert.match(html, /Visibility Rules/);
assert.match(html, /Patient Preview/);
assert.match(html, /Treatment match/i);
assert.match(html, /Test Patient Flow/);
assert.match(html, /Changes save automatically/);
console.log("PASS renders the prototype-faithful Program visibility-rule workspace");
