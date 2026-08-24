import { strict as assert } from "assert";
import type { ConsentForm, ProgramQuestion } from "../src/features/treatments/types/index";
import {
  getConsentPreviewData,
  getLibraryConsentId,
  isLibraryConsentReference,
  stripRepeatedHeading,
} from "../src/features/treatments/common/utils/consentPreview.ts";

const test = (name: string, run: () => void) => {
  run();
  console.log(`PASS ${name}`);
};

const question = (overrides: Partial<ProgramQuestion> = {}): ProgramQuestion => ({
  id: "question-1",
  order: 1,
  text: "Consent question",
  kind: "consent",
  section: "Consents",
  required: true,
  consentText: "Inline consent body",
  ...overrides,
});

const libraryConsent: ConsentForm = {
  id: "consent-global",
  name: "Global Consent",
  scope: "global",
  isArchived: false,
  visitTypeKeys: [],
  text: "<p>Library consent body</p>",
  options: [
    { id: "agree", text: "I agree", disqualifies: false },
    { id: "decline", text: "I do not agree", disqualifies: true },
  ],
  updatedAt: "2026-08-24",
};

test("only source-backed consent questions are library references", () => {
  assert.equal(isLibraryConsentReference(question()), false);
  assert.equal(
    isLibraryConsentReference(question({ elementConfig: { sourceId: "consent-global" } })),
    true,
  );
  assert.equal(
    getLibraryConsentId(question({ elementConfig: { sourceId: "consent-global" } })),
    "consent-global",
  );
});

test("library consent content takes precedence over the question placeholder", () => {
  const preview = getConsentPreviewData(
    question({
      elementConfig: { sourceId: libraryConsent.id },
      consentText: "Patient must accept: Global Consent",
    }),
    libraryConsent,
  );

  assert.equal(preview.isLibraryReference, true);
  assert.equal(preview.title, libraryConsent.name);
  assert.equal(preview.options[0].text, "I agree");
  assert.equal(preview.options[0].disqualifies, false);
  assert.equal(preview.options[1].text, "I do not agree");
  assert.equal(preview.options[1].disqualifies, true);
  assert.equal(preview.body.includes("Library consent body"), true);
  assert.equal(preview.body.includes("Patient must accept"), false);
});

test("inline consent content remains independently previewable", () => {
  const preview = getConsentPreviewData(question({ consentText: "<p>Inline body</p>" }));

  assert.equal(preview.isLibraryReference, false);
  assert.equal(preview.body.includes("Inline body"), true);
});

test("duplicated consent headings are removed before rendering", () => {
  assert.equal(
    stripRepeatedHeading("<h2>Consent question:</h2><p>Terms</p>", ["Consent question"]),
    "<p>Terms</p>",
  );
});

console.log("All consent editor boundary tests passed.");
