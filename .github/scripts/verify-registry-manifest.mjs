import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const serverName = "io.github.renanlido/tia-openness";
const packageName = "@renanlido/tia-openness-mcp";
const tagPattern = /^mcp-v((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*))$/;

export function releaseVersion(tag) {
  const match = tagPattern.exec(tag);
  assert.ok(match && match[0] === tag, "Expected an exact stable mcp-vX.Y.Z release tag");
  return match[1];
}

export function verifyManifest(tag, manifest, npmPackage) {
  const version = releaseVersion(tag);
  assert.equal(manifest.name, serverName, "Unexpected Registry namespace");
  assert.equal(manifest.version, version, "Server version must equal the release tag");
  assert.equal(manifest.packages?.length, 1, "Expected exactly one npm package");
  const pkg = manifest.packages[0];
  assert.equal(pkg.registryType, "npm");
  assert.equal(pkg.identifier, packageName);
  assert.equal(pkg.version, version, "Package version must equal the release tag");
  assert.equal(npmPackage.name, packageName);
  assert.equal(npmPackage.version, version, "The exact version must already be published on npm");
  assert.equal(npmPackage.mcpName, serverName, "npm must authorize the Registry identity");
  return version;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const tag = process.env.RELEASE_TAG ?? "";
  const version = releaseVersion(tag);
  const manifest = JSON.parse(readFileSync(process.argv[2] ?? "server.json", "utf8"));
  const response = await fetch(`https://registry.npmjs.org/@renanlido%2ftia-openness-mcp/${version}`);
  assert.equal(response.status, 200, `npm version ${version} is unavailable`);
  verifyManifest(tag, manifest, await response.json());
  console.log(`Verified ${serverName} ${version} against npm and ${tag}`);
}
