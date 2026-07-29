import { strict as assert } from "assert";

import { navigateToAssignmentAction } from "../src/features/treatments/assignment/navigation.ts";

const test = (name: string, run: () => void) => {
  run();
  console.log(`PASS ${name}`);
};

test("assignment actions navigate in the current router context", () => {
  const visited: string[] = [];

  const navigated = navigateToAssignmentAction(
    (route) => visited.push(route),
    "/dashboard/products"
  );

  assert.equal(navigated, true);
  assert.deepEqual(visited, ["/dashboard/products"]);
});

test("record-specific dashboard query parameters are preserved", () => {
  const visited: string[] = [];

  navigateToAssignmentAction(
    (route) => visited.push(route),
    "/dashboard/products?product=product-1"
  );

  assert.deepEqual(visited, ["/dashboard/products?product=product-1"]);
});

test("external and authentication routes fail closed", () => {
  const visited: string[] = [];
  const navigate = (route: string) => visited.push(route);

  assert.equal(
    navigateToAssignmentAction(navigate, "https://example.com/dashboard"),
    false
  );
  assert.equal(
    navigateToAssignmentAction(navigate, "/auth/signin"),
    false
  );
  assert.deepEqual(visited, []);
});

console.log("All assignment navigation tests passed.");
