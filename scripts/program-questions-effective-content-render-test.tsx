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
        { source_id: "field-ref", label: "Referenced Clinical Section", kind: "section", required: true, order: 3, configuration: { sourceSectionId: "section-2" } },
        { source_id: "field-checkout", label: "Product Options — NAD+", kind: "checkout", required: true, order: 4 },
        { source_id: "field-consent", label: "NAD+ Consent", kind: "consent", required: true, order: 5 },
      ],
    }, {
      id: "section-2",
      source_id: "section-2",
      source_type: "global",
      scope: "common",
      name: "Referenced Clinical Section",
      version: 1,
      fields: [
        { source_id: "field-3", label: "Date of Birth", kind: "date", required: true, order: 1 },
      ],
    }],
    inherited_visit_type: [{
      id: "section-visit-1",
      source_id: "section-visit-1",
      source_type: "visit_type",
      scope: "common",
      name: "Weight Management History",
      version: 4,
      fields: [
        // Canonical field identity is scoped by its parent Section/version.
        // Reusing a field ID in another Section must not hide this row.
        { source_id: "field-1", label: "Weight management goal", kind: "text", required: true, order: 1 },
      ],
    }],
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
assert.match(html, /Inherited — Global · Medical Baseline/);
assert.match(html, /Weight management goal/);
assert.match(html, /Inherited — Visit Type · weightloss · Weight Management History/);
assert.match(html, /Medical Conditions/);
assert.match(html, /Self Reported Meds/);
assert.match(html, /Optional/);
assert.match(html, /System/);
assert.doesNotMatch(html, />Medical Baseline</);
assert.doesNotMatch(html, />Referenced Clinical Section</);
const clinicalIndex = html.indexOf("Date of Birth");
const sectionConsentIndex = html.indexOf("NAD+ Consent");
const effectiveConsentIndex = html.indexOf("Truthfulness Consent");
const checkoutIndex = html.indexOf("Product Options — NAD+");
assert.ok(clinicalIndex > 0);
assert.ok(sectionConsentIndex > clinicalIndex);
assert.ok(effectiveConsentIndex > sectionConsentIndex);
assert.ok(checkoutIndex > effectiveConsentIndex);
console.log("PASS Program questions page projects inherited effective content");
