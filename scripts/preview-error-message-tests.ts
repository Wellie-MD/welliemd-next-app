import { strict as assert } from "assert";

import { getPreviewErrorMessage } from "../src/features/treatments/preview/previewError.ts";

const sectionMessage =
  "Section 'Patient History' is treatment-specific and cannot be used by Visit Type 'menopause'";

assert.equal(
  getPreviewErrorMessage({
    response: {
      status: 409,
      data: {
        error: "preview_configuration_invalid",
        details: { sections: [sectionMessage] },
      },
    },
  }),
  sectionMessage,
);

console.log("All preview error-message tests passed.");
