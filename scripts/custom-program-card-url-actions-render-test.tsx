import { strict as assert } from "node:assert";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CustomProgramCard } from "../src/features/treatments/custom-programs/components/CustomProgramCard";

const html = renderToStaticMarkup(
  <CustomProgramCard
    customProgram={{
      id: "custom-program-1",
      name: "Weight loss intake",
      description: "",
      status: "published",
      audience: "all",
      minAge: 18,
      includedProgramIds: [],
      sectionIds: [],
      consentIds: [],
      checkoutOptions: [],
      flowItems: [],
      updatedAt: "2026-09-15",
      slug: "weight-loss-intake",
    }}
    onOpenBuilder={() => undefined}
    onPreview={() => undefined}
    onViewStartUrl={() => undefined}
    onCopyStartUrl={() => undefined}
  />,
);

assert.match(html, /data-testid="custom-program-url-actions"/);
assert.match(html, /Custom program URL actions for Weight loss intake/);
console.log("PASS exposes URL actions on custom-program cards");
