import { describe, expect, it } from "vitest";
import { addAssetTrack, createProject, moveProjectClip, resizeProjectClip } from "../src/project.js";

describe("project timeline", () => {
  it("creates a clip when an asset becomes a track", () => {
    const asset = { id: "a1", uri: "file://a.wav", format: "wav" as const, durationSeconds: 12 };
    const project = addAssetTrack(createProject("Test"), asset, "Beat");
    expect(project.clips).toHaveLength(1);
    expect(project.clips[0]).toMatchObject({ trackId: "a1", assetId: "a1", startSeconds: 0, durationSeconds: 12 });
  });

  it("moves and resizes clips without mutating the source project", () => {
    const asset = { id: "a1", uri: "file://a.wav", format: "wav" as const, durationSeconds: 12 };
    const original = addAssetTrack(createProject("Test"), asset);
    const moved = moveProjectClip(original, original.clips[0].id, 8);
    const resized = resizeProjectClip(moved, moved.clips[0].id, 10);
    expect(original.clips[0].startSeconds).toBe(0);
    expect(resized.clips[0]).toMatchObject({ startSeconds: 8, durationSeconds: 10 });
  });
});
