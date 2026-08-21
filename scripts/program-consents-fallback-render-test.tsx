import { strict as assert } from "node:assert";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { ProgramConsents } from "../src/features/treatments/programs/components/ProgramConsents";

const html = renderToStaticMarkup(
  <StaticRouter location="/dashboard/treatments/programs/program-1/questions">
    <ProgramConsents
      visitType="weightloss"
      consents={[
        { id: "global-1", name: "Telehealth Consent", scope: "global" },
        { id: "visit-1", name: "Weight Loss Consent", scope: "visit_type", visitTypeKeys: ["weightloss"] },
        { id: "visit-2", name: "Unrelated Consent", scope: "visit_type", visitTypeKeys: ["hrt"] },
        { id: "program-1", name: "Program Consent", scope: "program" },
      ]}
      attachedConsentIds={["program-1"]}
      onAddConsent={() => undefined}
    />
  </StaticRouter>,
);

assert.match(html, /3 Total/);
assert.match(html, /Telehealth Consent/);
assert.match(html, /Weight Loss Consent/);
assert.match(html, /Program Consent/);
assert.doesNotMatch(html, /Unrelated Consent/);
console.log("PASS renders effective consent fallback groups consistently");
