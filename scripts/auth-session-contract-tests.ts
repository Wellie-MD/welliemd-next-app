import { strict as assert } from "node:assert";

import { cookieAuthRequestBody } from "../src/services/auth-session-contract";

assert.deepEqual(
  cookieAuthRequestBody(),
  {},
  "refresh and logout must use the current HTTP-only cookie, not a stale tab token",
);

console.log("PASS admin refresh and logout use the authoritative HTTP-only cookie");
