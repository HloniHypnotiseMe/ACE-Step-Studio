import { describe, expect, it } from "vitest";
import { addAssetTrack, createProject } from "../src/project";
import { deserializeProject, serializeProject } from "../src/project-io";
import type { AudioAsset } from "../src/contracts";

describe("project persistence", () => {
  it("round trips the editable project", () => {
    const project=createProject("Demo");
    const restored=deserializeProject(serializeProject(project,["audio/demo.wav"]));
    expect(restored.name).toBe("Demo");
    expect(restored.sampleRate).toBe(48000);
  });

  it("preserves asset provenance and license status through save/load", () => {
    const project=createProject("Lineage");
    const asset: AudioAsset = {
      id: "generated-1",
      uri: "audio/generated.wav",
      format: "wav",
      durationSeconds: 12,
      provenance: {
        origin: "generated",
        providerId: "ace-step",
        modelId: "ace-step-1.5",
        modelVersion: "1.5",
        taskType: "text2music",
        parentAssetIds: [],
        createdAt: "2026-10-16T08:00:00.000Z",
        parameters: { prompt: "original instrumental", batchSize: 1 },
        license: "unreviewed",
        licenseVerified: false
      }
    };
    const withAsset = addAssetTrack(project, asset, "Generated");
    const restored = deserializeProject(serializeProject(withAsset));
    expect(restored.tracks[0].assets[0].provenance).toEqual(asset.provenance);
    expect(restored.tracks[0].assets[0].provenance?.licenseVerified).toBe(false);
  });

  it("rejects project packages whose clips reference missing tracks or assets", () => {
    const project = addAssetTrack(createProject("Broken"), {
      id: "asset-1", uri: "audio/one.wav", format: "wav", durationSeconds: 4
    });
    const payload = JSON.parse(serializeProject(project));
    payload.project.clips[0].trackId = "missing-track";
    expect(() => deserializeProject(JSON.stringify(payload))).toThrow(/missing track/);
  });

  it("rejects malformed project structure and provenance instead of loading unsafe state", () => {
    expect(() => deserializeProject(JSON.stringify({ manifest: { schemaVersion: 1, projectId: "x" }, project: {} }))).toThrow(/Invalid project/);

    const project = addAssetTrack(createProject("Bad provenance"), {
      id: "asset-bad", uri: "audio/bad.wav", format: "wav",
      provenance: "untrusted string" as unknown as AudioAsset["provenance"]
    });
    expect(() => deserializeProject(serializeProject(project))).toThrow(/provenance is malformed/);
  });

  it("migrates legacy projects without provenance without inventing verification", () => {
    const project=createProject("Legacy");
    const legacy = addAssetTrack(project, {
      id: "legacy-1",
      uri: "audio/legacy.wav",
      format: "wav",
      durationSeconds: 4
    });
    const restored = deserializeProject(serializeProject(legacy));
    expect(restored.tracks[0].assets[0].provenance).toBeUndefined();
  });
});
