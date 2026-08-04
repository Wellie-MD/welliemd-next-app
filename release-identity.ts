import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { OutputAsset, OutputBundle, Plugin } from "rollup";

const COMMIT_RE = /^[0-9a-f]{40}$/;
const SAFE_BUILD_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:/+-]{0,127}$/;

export function resolveCommit(): string {
  for (const candidate of [
    process.env.WELLIEMD_BUILD_COMMIT,
    process.env.AWS_COMMIT_ID,
    process.env.GITHUB_SHA,
  ]) {
    const normalized = String(candidate || "").trim().toLowerCase();
    if (COMMIT_RE.test(normalized)) return normalized;
  }
  try {
    const local = execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim().toLowerCase();
    return COMMIT_RE.test(local) ? local : "unknown";
  } catch {
    return "unknown";
  }
}

export function resolveBuildId(commit: string): string {
  for (const candidate of [
    process.env.WELLIEMD_BUILD_ID,
    process.env.AWS_JOB_ID,
    process.env.GITHUB_RUN_ID && process.env.GITHUB_RUN_ATTEMPT
      ? `github-${process.env.GITHUB_RUN_ID}.${process.env.GITHUB_RUN_ATTEMPT}`
      : "",
  ]) {
    const normalized = String(candidate || "").trim();
    if (SAFE_BUILD_ID_RE.test(normalized)) return normalized;
  }
  return commit === "unknown" ? "unknown" : `local-${commit.slice(0, 12)}`;
}

export function digestOutputBundle(bundle: OutputBundle): string {
  const hash = createHash("sha256");
  for (const [fileName, output] of Object.entries(bundle).sort(([a], [b]) => a.localeCompare(b))) {
    if (fileName === "release-identity.json") continue;
    hash.update(fileName);
    hash.update("\0");
    if (output.type === "chunk") {
      hash.update(output.code);
    } else {
      const source = (output as OutputAsset).source;
      hash.update(typeof source === "string" ? source : Buffer.from(source));
    }
    hash.update("\0");
  }
  return `sha256:${hash.digest("hex")}`;
}

function filesUnder(root: string): string[] {
  return readdirSync(root, { withFileTypes: true })
    .flatMap((entry) => {
      const absolute = path.join(root, entry.name);
      return entry.isDirectory() ? filesUnder(absolute) : [absolute];
    })
    .sort();
}

export function digestOutputDirectory(root: string): string {
  const hash = createHash("sha256");
  for (const absolute of filesUnder(root)) {
    const relative = path.relative(root, absolute).split(path.sep).join("/");
    if (relative === "release-identity.json") continue;
    hash.update(relative);
    hash.update("\0");
    hash.update(readFileSync(absolute));
    hash.update("\0");
  }
  return `sha256:${hash.digest("hex")}`;
}

export function releaseIdentityPlugin(): Plugin {
  let outputDirectory = "";
  let identity: Record<string, string> | null = null;
  return {
    name: "welliemd-release-identity",
    configResolved(config) {
      outputDirectory = path.resolve(config.root, config.build.outDir);
    },
    generateBundle(_options, bundle) {
      const commit = resolveCommit();
      identity = {
        component: "welliemd-admin",
        commit,
        build_id: resolveBuildId(commit),
        runtime_contract_version: "2",
        asset_digest: digestOutputBundle(bundle),
      };
      this.emitFile({
        type: "asset",
        fileName: "release-identity.json",
        source: `${JSON.stringify(identity, null, 2)}\n`,
      });
    },
    closeBundle() {
      if (!identity || !outputDirectory) return;
      identity.asset_digest = digestOutputDirectory(outputDirectory);
      writeFileSync(
        path.join(outputDirectory, "release-identity.json"),
        `${JSON.stringify(identity, null, 2)}\n`,
      );
    },
  };
}
