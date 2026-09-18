import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { QuestionPreviewTab } from "../src/features/treatments/question-editor/components/tabs/QuestionPreviewTab";

const html = renderToStaticMarkup(
  <QuestionPreviewTab
    text="Shipping Address"
    kind="shipping_address"
    choices={[]}
    dqChoices={[]}
    consentText=""
    order={4}
    totalQuestions={8}
  />,
);

assert.match(html, /Street Address/);
assert.match(html, /Apartment, Suite, or Unit/);
assert.match(html, /Optional/);
assert.match(html, /City/);
assert.match(html, /State/);
assert.match(html, /ZIP Code/);

console.log("Shipping Address patient preview render contract passed.");
