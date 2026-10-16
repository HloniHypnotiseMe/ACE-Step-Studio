import { describe, expect, it } from "vitest";
import { assertRealtimeSafe, ModelRegistry, ModelManager } from "../src/index.js";

describe("runtime safety gates", () => {
  it("blocks AI work from the realtime audio thread", () => {
    expect(() => assertRealtimeSafe("llm.inference")).toThrow();
    expect(() => assertRealtimeSafe("diffusion.generate")).toThrow();
    expect(() => assertRealtimeSafe("audio.buffer")).not.toThrow();
  });

  it("filters models by hardware and local-use requirements", () => {
    const registry = new ModelRegistry();
    registry.register({
      id: "test", version: "1", providerId: "x", license: "MIT",
      commercialRedistribution: true, localInference: true, minVramGb: 8,
      backends: ["cuda"], provenance: "test"
    });
    expect(registry.isEligible("test", "cuda", 12)).toBe(true);
    expect(registry.isEligible("test", "cuda", 4)).toBe(false);
    expect(registry.isEligible("test", "cpu", 32)).toBe(false);
  });

  it("blocks commercial readiness until all license and provenance reviews are explicit", () => {
    const registry = new ModelRegistry();
    const manifest = {
      id: "candidate", version: "1", providerId: "x", license: "MIT",
      weightsLicense: "Unknown", commercialRedistribution: true,
      localInference: true, backends: ["cpu"] as const, provenance: "model card"
    };
    registry.register({ ...manifest, backends: ["cpu"] });
    const manager = new ModelManager(registry);
    expect(manager.recommend({ backend: "cpu" })).toHaveLength(1);
    expect(manager.commercialReady({ backend: "cpu" })).toHaveLength(0);

    registry.register({
      ...manifest,
      backends: ["cpu"],
      licenseVerified: true,
      weightsLicenseVerified: true,
      provenanceVerified: true
    });
    expect(manager.commercialReady({ backend: "cpu" })).toHaveLength(1);
  });

  it("rejects invalid model manifests instead of silently registering them", () => {
    const registry = new ModelRegistry();
    expect(() => registry.register({
      id: "", version: "1", providerId: "x", license: "MIT",
      commercialRedistribution: false, localInference: true,
      backends: ["cpu"], provenance: "test"
    })).toThrow(/Model id is required/);
    expect(() => registry.register({
      id: "bad-vram", version: "1", providerId: "x", license: "MIT",
      commercialRedistribution: false, localInference: true,
      minVramGb: -1, backends: ["cpu"], provenance: "test"
    })).toThrow(/Invalid VRAM requirement/);
  });
});
