import { describe, expect, it } from "vitest";
import { addAssetTrack, createProject, moveProjectClip, resizeProjectClip, duplicateProjectClip, deleteProjectClip, splitProjectClip, moveProjectClipToTrack } from "../src/project.js";

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


describe("multi-clip editing", () => {
  const setup = () => {
    const first = { id: "a1", uri: "file://a.wav", format: "wav" as const, durationSeconds: 12 };
    const second = { id: "a2", uri: "file://b.wav", format: "wav" as const, durationSeconds: 12 };
    let project = addAssetTrack(createProject("Edit"), first, "A");
    project = addAssetTrack(project, second, "B");
    return project;
  };

  it("duplicates, splits and deletes clips", () => {
    const project = setup();
    const original = project.clips[0];
    const duplicated = duplicateProjectClip(project, original.id, 8);
    expect(duplicated.clips).toHaveLength(3);
    const split = splitProjectClip(duplicated, original.id, 4);
    expect(split.clips).toHaveLength(4);
    expect(split.clips.filter(clip => clip.trackId === original.trackId)).toHaveLength(3);
    expect(deleteProjectClip(split, original.id).clips).toHaveLength(3);
  });

  it("moves a clip to another track", () => {
    const project = setup();
    const moved = moveProjectClipToTrack(project, project.clips[0].id, project.tracks[1].id);
    expect(moved.clips[0].trackId).toBe(project.tracks[1].id);
  });
});
