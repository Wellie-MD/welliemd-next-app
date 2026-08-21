import { strict as assert } from "node:assert";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { FlowBuilderListView } from "../src/features/treatments/flow-builder/components/canvas/FlowBuilderListView";
import type { CustomProgram } from "../src/features/treatments/types";

const customProgram: CustomProgram = {
  id: "custom-1",
  name: "Custom Program",
  description: "",
  status: "draft",
  audience: "all",
  minAge: 18,
  includedProgramIds: [],
  sectionIds: [],
  consentIds: [],
  checkoutOptions: [],
  flowItems: [
    {
      id: "question-1",
      sourceId: "question-1",
      kind: "routing_question",
      title: "What care do you need?",
      subtitle: "Single choice",
    },
  ],
  updatedAt: "2026-08-21",
  slug: "custom-program",
  programMatchingRules: {},
};

const html = renderToStaticMarkup(
  <StaticRouter location="/dashboard/treatments/custom-programs/custom-1/builder">
    <FlowBuilderListView
      customProgram={customProgram}
      programs={[]}
      sections={[]}
      consents={[]}
      onEditQuestion={() => undefined}
      onOpenPreview={() => undefined}
      onConfigureMatching={() => undefined}
    />
  </StaticRouter>,
);

assert.match(html, /What care do you need\?/);
assert.match(html, /Preview patient flow/);
console.log("PASS renders a routing row with its preview action");
