import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const distPath = path.resolve(process.argv[2] || "dist");
const identityPath = path.join(distPath, "release-identity.json");
const identity = JSON.parse(fs.readFileSync(identityPath, "utf8"));

function filesUnder(root) {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(root, entry.name);
    return entry.isDirectory() ? filesUnder(absolute) : [absolute];
  }).sort();
}

const digest = crypto.createHash("sha256");
for (const absolute of filesUnder(distPath)) {
  const relative = path.relative(distPath, absolute).split(path.sep).join("/");
  if (relative === "release-identity.json") continue;
  digest.update(relative);
  digest.update("\0");
  digest.update(fs.readFileSync(absolute));
  digest.update("\0");
}

assert.equal(identity.component, "welliemd-admin");
assert.match(identity.commit, /^(unknown|[0-9a-f]{40})$/);
assert.equal(identity.runtime_contract_version, "2");
assert.equal(identity.asset_digest, `sha256:${digest.digest("hex")}`);
console.log(JSON.stringify(identity));
