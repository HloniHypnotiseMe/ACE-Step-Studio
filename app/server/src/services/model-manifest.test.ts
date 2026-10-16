import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { loadModelManifests } from "./model-manifest.js";

const originalPath = process.env.C6_MODEL_MANIFEST_PATH;
let tempDir: string | undefined;

afterEach(async () => {
  if (originalPath === undefined) delete process.env.C6_MODEL_MANIFEST_PATH;
  else process.env.C6_MODEL_MANIFEST_PATH = originalPath;
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
  tempDir = undefined;
});

describe("local model manifest loader", () => {
  it("does not auto-register models when no manifest path is configured", async () => {
    delete process.env.C6_MODEL_MANIFEST_PATH;
    const result = await loadModelManifests();
    assert.equal(result.source, "not-configured");
    assert.deepEqual(result.models, []);
    assert.ok(result.warning);
  });

  it("loads validated metadata without silently granting commercial clearance", async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "c6-model-manifest-"));
    const manifestPath = path.join(tempDir, "models.json");
    await writeFile(manifestPath, JSON.stringify({ models: [{
      id: "test-model", version: "1", providerId: "test-provider",
      license: "review required", weightsLicense: "review required",
      commercialRedistribution: true, localInference: true,
      backends: ["cpu"], provenance: "test fixture",
      licenseVerified: false, weightsLicenseVerified: false, provenanceVerified: false
    }] }), "utf8");
    process.env.C6_MODEL_MANIFEST_PATH = manifestPath;

    const result = await loadModelManifests();
    assert.equal(result.source, "configured-file");
    assert.equal(result.models.length, 1);
    assert.equal(result.models[0].licenseVerified, false);
    assert.equal(result.models[0].weightsLicenseVerified, false);
    assert.equal(result.models[0].provenanceVerified, false);
  });

  it("fails closed for duplicate IDs and malformed metadata", async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "c6-model-manifest-"));
    const manifestPath = path.join(tempDir, "models.json");
    const model = {
      id: "duplicate", version: "1", providerId: "provider",
      license: "unknown", commercialRedistribution: false,
      localInference: true, backends: ["cpu"], provenance: "fixture"
    };
    await writeFile(manifestPath, JSON.stringify([model, model]), "utf8");
    process.env.C6_MODEL_MANIFEST_PATH = manifestPath;
    const duplicateResult = await loadModelManifests();
    assert.equal(duplicateResult.source, "invalid");
    assert.deepEqual(duplicateResult.models, []);
    assert.match(duplicateResult.warning ?? "", /Duplicate model id/);

    await writeFile(manifestPath, JSON.stringify([{ ...model, id: "", backends: ["gpu"] }]), "utf8");
    const malformedResult = await loadModelManifests();
    assert.equal(malformedResult.source, "invalid");
    assert.deepEqual(malformedResult.models, []);
    assert.ok(malformedResult.warning);
  });
});
