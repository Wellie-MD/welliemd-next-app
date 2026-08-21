import { strict as assert } from "node:assert";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StaticRouter } from "react-router-dom/server";
import { ProgramQuestionsList } from "../src/features/treatments/programs/components/ProgramQuestionsList";
import type { ProgramEffectiveContent } from "../src/features/treatments/api/programsApi";
import type { Program } from "../src/features/treatments/types";

const program: Program = {
  id: "68cf5389-1b7b-4fa2-943b-f65e7d693a4a",
  name: "10aug2026",
  stage: "intake",
  treatmentTypeKey: "trt",
  visitType: "weightloss",
  questionCount: 1,
  checkoutQuestionCount: 0,
  status: "published",
  updatedAt: "2026-08-21",
  slug: "10aug2026",
  authConfig: { email: true, phone: true, identity: true, account: true, enabled: true },
};

const effectiveContent: ProgramEffectiveContent = {
  visit_type: "weightloss",
  consents: {
    inherited_global: [{ id: "global-1", source_id: "global-1", source_type: "global", name: "Truthfulness Consent", required: true }],
    inherited_visit_type: [{ id: "visit-1", source_id: "visit-1", source_type: "visit_type", name: "GLP Consent", required: true }],
    explicit_program: [],
    inline_conditional: [],
  },
  sections: {
    inherited_global: [{
      id: "section-1",
      source_id: "section-1",
      source_type: "global",
      scope: "common",
      name: "Medical Baseline",
      version: 2,
      fields: [
        { source_id: "field-1", label: "Current medical conditions", kind: "medical_conditions", required: true, order: 1, mapped_field: "medicalConditions" },
        { source_id: "field-2", label: "Current medications", kind: "self_reported_meds", required: false, order: 2, mapped_field: "selfReportedMeds" },
      ],
    }],
    inherited_visit_type: [],
    explicit_program: [],
  },
  blockers: [],
};

const queryClient = new QueryClient({ defaultOptions: { queries: { enabled: false } } });
const html = renderToStaticMarkup(
  <QueryClientProvider client={queryClient}>
    <StaticRouter location={`/dashboard/treatments/programs/${program.id}/questions`}>
      <ProgramQuestionsList program={program} initialQuestions={[]} effectiveContent={effectiveContent} />
    </StaticRouter>
  </QueryClientProvider>,
);

assert.match(html, /Truthfulness Consent/);
assert.match(html, /GLP Consent/);
assert.match(html, /Inherited — Global/);
assert.match(html, /Inherited — Visit Type · weightloss/);
assert.match(html, /Current medical conditions/);
assert.match(html, /Current medications/);
assert.match(html, /Medical Conditions/);
assert.match(html, /Self Reported Meds/);
assert.match(html, /Optional/);
assert.match(html, /System/);
assert.doesNotMatch(html, />Medical Baseline</);
console.log("PASS Program questions page projects inherited effective content");
