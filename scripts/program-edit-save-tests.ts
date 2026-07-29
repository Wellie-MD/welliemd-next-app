import { strict as assert } from "assert";

import { isDuplicateSlugError } from "../src/features/treatments/common/utils/duplicateSlugError.ts";

const test = (name: string, run: () => void) => {
  run();
  console.log(`PASS ${name}`);
};

test("a generic Program-save 400 is not presented as a duplicate slug", () => {
  assert.equal(
    isDuplicateSlugError({
      response: {
        status: 400,
        data: { error: "Invalid request. Please check your input." },
      },
      config: {
        data: JSON.stringify({ slug: "sqa23" }),
      },
    }),
    false,
  );
});

test("a Product route mismatch is not presented as a duplicate slug", () => {
  assert.equal(
    isDuplicateSlugError({
      response: {
        status: 400,
        data: {
          error_code: "product_treatment_type_mismatch",
          error: "The Product Treatment Type does not match the Program.",
        },
      },
    }),
    false,
  );
});

test("an explicit slug field error is presented as a duplicate slug", () => {
  assert.equal(
    isDuplicateSlugError({
      response: {
        status: 400,
        data: { slug: ["Please enter a unique slug."] },
      },
    }),
    true,
  );
});

test("the stable duplicate slug code is supported", () => {
  assert.equal(
    isDuplicateSlugError({
      response: {
        status: 400,
        data: { error_code: "duplicate_slug" },
      },
    }),
    true,
  );
});

console.log("All Program edit-save tests passed.");
