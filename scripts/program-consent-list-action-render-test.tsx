import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { ProgramQuestionsListRow } from "../src/features/treatments/programs/components/ProgramQuestionsListRow";

const html = renderToStaticMarkup(
  <MemoryRouter>
    <ProgramQuestionsListRow
      question={{
        id: "program-consent-row",
        order: 3,
        text: "Pregnancy Consent",
        kind: "consent",
        section: "Consents",
        required: true,
        elementConfig: { sourceId: "shared-consent-id" },
      }}
      index={2}
      isReorderActive={false}
      onEdit={() => undefined}
      onDelete={() => undefined}
    />
  </MemoryRouter>,
);

assert.match(html, /Edit Program consent visibility/);
assert.doesNotMatch(html, /Go to Consent/);
console.log("PASS Program list opens the placement visibility editor for a linked Consent");
