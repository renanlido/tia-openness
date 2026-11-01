import assert from "node:assert/strict";
import { test } from "node:test";
import { verifyManifest } from "./verify-registry-manifest.mjs";

const manifest = () => ({
  name: "io.github.renanlido/tia-openness",
  version: "1.12.3",
  packages: [{ registryType: "npm", identifier: "@renanlido/tia-openness-mcp", version: "1.12.3", transport: { type: "stdio" } }],
});
const npmPackage = () => ({ name: "@renanlido/tia-openness-mcp", version: "1.12.3", mcpName: "io.github.renanlido/tia-openness" });

test("accepts the exact published npm version under its verified namespace", () => {
  assert.equal(verifyManifest("mcp-v1.12.3", manifest(), npmPackage()), "1.12.3");
});

for (const [name, mutate] of [
  ["stale server version", (m) => { m.version = "1.11.0"; }],
  ["stale package version", (m) => { m.packages[0].version = "1.11.0"; }],
  ["another namespace", (m) => { m.name = "io.github.other/tia-openness"; }],
  ["another npm package", (m) => { m.packages[0].identifier = "@other/server"; }],
  ["another registry", (m) => { m.packages[0].registryType = "oci"; }],
  ["additional package", (m) => { m.packages.push({ ...m.packages[0] }); }],
  ["no packages", (m) => { m.packages = []; }],
]) {
  test(`rejects ${name} before registry publishing`, () => {
    const m = manifest();
    mutate(m);
    assert.throws(() => verifyManifest("mcp-v1.12.3", m, npmPackage()));
  });
}

for (const tag of ["app-v1.12.3", "mcp-v1.12.3-beta.1", "mcp-v1.12.3\n", "mcp-v1.12.03", "mcp-vlatest", ""]) {
  test(`rejects unrelated or invalid release tag ${JSON.stringify(tag)}`, () => {
    assert.throws(() => verifyManifest(tag, manifest(), npmPackage()));
  });
}

for (const patch of [{ version: "1.12.2" }, { name: "@other/server" }, { mcpName: "io.github.other/server" }]) {
  test(`rejects mismatched npm metadata ${JSON.stringify(patch)}`, () => {
    assert.throws(() => verifyManifest("mcp-v1.12.3", manifest(), { ...npmPackage(), ...patch }));
  });
}
