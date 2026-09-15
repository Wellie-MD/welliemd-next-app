import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
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
  />,
);

assert.match(html, /data-testid="custom-program-url-action"/);
assert.match(html, /View and copy intake URL for Weight loss intake/);
assert.match(html, /View and copy intake URL/);
assert.doesNotMatch(html, /Copy intake URL/);

const cardSource = readFileSync("src/features/treatments/custom-programs/components/CustomProgramCard.tsx", "utf8");
assert.match(cardSource, /from "@\/components\/ui\/button"/);
assert.match(cardSource, /data-testid="custom-program-card-actions"/);

const dialogSource = readFileSync("src/features/treatments/custom-programs/components/CustomProgramStartUrlDialog.tsx", "utf8");
assert.match(dialogSource, /<Textarea/);
assert.match(dialogSource, /readOnly/);
assert.match(dialogSource, /max-h-\[calc\(100dvh-1\.5rem\)\]/);

console.log("PASS exposes URL actions on custom-program cards");
console.log("PASS uses shared action controls and a viewport-safe read-only URL dialog");
