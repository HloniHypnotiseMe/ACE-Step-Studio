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
