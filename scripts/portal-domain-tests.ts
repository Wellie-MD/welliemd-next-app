import { strict as assert } from "node:assert";

import {
  configuredCustomDomains,
  isCustomPortalDomain,
  managedWellieUrl,
} from "../src/utils/portalDomainUtils.ts";

const test = (name: string, run: () => void) => {
  run();
  console.log(`PASS ${name}`);
};

const kinmedsClient = {
  id: "d1815253-aa4e-4c0f-acc2-40317072e4fc",
  name: "KinMeds",
  api_endpoint: "https://prod-mirror-kinmeds-api.welliemd.com",
  patient_portal_domain: "https://prod-mirror-kinmeds-patient.welliemd.com",
  resolved_patient_portal_domain: "https://prod-mirror-kinmeds-patient.welliemd.com",
};

test("preserves the configured legacy KinMeds patient URL", () => {
  assert.equal(
    managedWellieUrl(kinmedsClient, "patient", kinmedsClient.patient_portal_domain),
    "https://prod-mirror-kinmeds-patient.welliemd.com",
  );
});

test("preserves newer patientportal managed URLs", () => {
  const client = {
    ...kinmedsClient,
    patient_portal_domain: "https://examplepatientportal.welliemd.com",
  };

  assert.equal(
    managedWellieUrl(client, "patient", client.patient_portal_domain),
    "https://examplepatientportal.welliemd.com",
  );
});

test("keeps custom domains out of the managed URL row", () => {
  const customDomain = "https://patients.kinmeds.com";
  assert.equal(managedWellieUrl(kinmedsClient, "patient", customDomain), "");
  assert.equal(isCustomPortalDomain(customDomain), true);
  assert.equal(isCustomPortalDomain(kinmedsClient.patient_portal_domain), false);
});

test("uses the existing fallback only when the configured URL is absent", () => {
  assert.equal(
    managedWellieUrl({ ...kinmedsClient, api_endpoint: "https://clinic.api.welliemd.com" }, "patient"),
    "https://clinicpatientportal.welliemd.com",
  );
});

test("configured custom-domain fallback still uses resolved custom values", () => {
  const client = {
    ...kinmedsClient,
    resolved_patient_portal_domain: "https://patients.kinmeds.com",
  };

  assert.equal(configuredCustomDomains(client)[0]?.domain, "patients.kinmeds.com");
  assert.equal(configuredCustomDomains(client)[0]?.portal_type, "patient");
});

console.log("\nAll portal-domain tests passed.");
