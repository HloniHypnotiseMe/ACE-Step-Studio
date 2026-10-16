import type { C6MusicProject, ProjectClip, Track } from "./project";

export const PROJECT_SCHEMA_VERSION = 1;

export interface ProjectManifest {
  schemaVersion: number;
  projectId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  files: string[];
}

export interface SerializedProject {
  manifest: ProjectManifest;
  project: C6MusicProject;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`Invalid project: ${field} must be a non-empty string`);
}

function requireFiniteNumber(value: unknown, field: string, minimum = 0): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum) {
    throw new Error(`Invalid project: ${field} must be a finite number >= ${minimum}`);
  }
}

function validateProjectShape(value: unknown): asserts value is C6MusicProject {
  if (!isRecord(value)) throw new Error("Invalid project: project payload must be an object");
  requireString(value.id, "id");
  requireString(value.name, "name");
  if (value.schemaVersion !== PROJECT_SCHEMA_VERSION) throw new Error(`Unsupported project schema: ${value.schemaVersion}`);
  requireFiniteNumber(value.bpm, "bpm", 1);
  requireFiniteNumber(value.sampleRate, "sampleRate", 1);
  if (!Array.isArray(value.tracks)) throw new Error("Invalid project: tracks must be an array");

  const trackIds = new Set<string>();
  const assetIds = new Set<string>();
  for (const [trackIndex, rawTrack] of value.tracks.entries()) {
    if (!isRecord(rawTrack)) throw new Error(`Invalid project: tracks[${trackIndex}] must be an object`);
    requireString(rawTrack.id, `tracks[${trackIndex}].id`);
    requireString(rawTrack.name, `tracks[${trackIndex}].name`);
    if (trackIds.has(rawTrack.id)) throw new Error(`Invalid project: duplicate track id ${rawTrack.id}`);
    trackIds.add(rawTrack.id);
    if (!["audio", "midi", "instrument", "bus"].includes(String(rawTrack.type))) throw new Error(`Invalid project: tracks[${trackIndex}].type is invalid`);
    if (!Array.isArray(rawTrack.assets)) throw new Error(`Invalid project: tracks[${trackIndex}].assets must be an array`);
    requireFiniteNumber(rawTrack.gainDb, `tracks[${trackIndex}].gainDb`, -120);
    requireFiniteNumber(rawTrack.pan, `tracks[${trackIndex}].pan`, -1);
    if (typeof rawTrack.muted !== "boolean" || typeof rawTrack.solo !== "boolean") {
      throw new Error(`Invalid project: tracks[${trackIndex}] mute/solo flags must be boolean`);
    }
    for (const [assetIndex, rawAsset] of rawTrack.assets.entries()) {
      if (!isRecord(rawAsset)) throw new Error(`Invalid project: tracks[${trackIndex}].assets[${assetIndex}] must be an object`);
      requireString(rawAsset.id, `tracks[${trackIndex}].assets[${assetIndex}].id`);
      requireString(rawAsset.uri, `tracks[${trackIndex}].assets[${assetIndex}].uri`);
      requireString(rawAsset.format, `tracks[${trackIndex}].assets[${assetIndex}].format`);
      if (assetIds.has(rawAsset.id)) throw new Error(`Invalid project: duplicate asset id ${rawAsset.id}`);
      assetIds.add(rawAsset.id);
      if (rawAsset.durationSeconds !== undefined) requireFiniteNumber(rawAsset.durationSeconds, `tracks[${trackIndex}].assets[${assetIndex}].durationSeconds`);
      if (rawAsset.provenance !== undefined) {
        if (!isRecord(rawAsset.provenance) || !Array.isArray(rawAsset.provenance.parentAssetIds) ||
            typeof rawAsset.provenance.createdAt !== "string" || typeof rawAsset.provenance.licenseVerified !== "boolean") {
          throw new Error(`Invalid project: tracks[${trackIndex}].assets[${assetIndex}].provenance is malformed`);
        }
      }
    }
  }
  if (value.clips !== undefined && !Array.isArray(value.clips)) throw new Error("Invalid project: clips must be an array");
  if (value.operations !== undefined && !Array.isArray(value.operations)) throw new Error("Invalid project: operations must be an array");
  if (value.metadata !== undefined && !isRecord(value.metadata)) throw new Error("Invalid project: metadata must be an object");
}

function migrateProject(project: C6MusicProject): C6MusicProject {
  const clips = Array.isArray(project.clips)
    ? project.clips
    : project.tracks.flatMap(track => track.assets.map(asset => ({
        id: crypto.randomUUID(),
        trackId: track.id,
        assetId: asset.id,
        startSeconds: 0,
        durationSeconds: asset.durationSeconds ?? 8,
        gainDb: 0
      })));

  return {
    ...project,
    clips,
    operations: Array.isArray(project.operations) ? project.operations : [],
    metadata: isRecord(project.metadata) ? project.metadata : {}
  };
}

function validateClips(project: C6MusicProject): void {
  const clipIds = new Set<string>();
  const trackIds = new Set(project.tracks.map(track => track.id));
  const assetIds = new Set(project.tracks.flatMap(track => track.assets.map(asset => asset.id)));
  for (const [index, rawClip] of project.clips.entries()) {
    if (!isRecord(rawClip)) throw new Error(`Invalid project: clips[${index}] must be an object`);
    requireString(rawClip.id, `clips[${index}].id`);
    requireString(rawClip.trackId, `clips[${index}].trackId`);
    requireString(rawClip.assetId, `clips[${index}].assetId`);
    if (clipIds.has(rawClip.id)) throw new Error(`Invalid project: duplicate clip id ${rawClip.id}`);
    clipIds.add(rawClip.id);
    if (!trackIds.has(rawClip.trackId)) throw new Error(`Invalid project: clip references missing track ${rawClip.trackId}`);
    if (!assetIds.has(rawClip.assetId)) throw new Error(`Invalid project: clip references missing asset ${rawClip.assetId}`);
    requireFiniteNumber(rawClip.startSeconds, `clips[${index}].startSeconds`);
    requireFiniteNumber(rawClip.durationSeconds, `clips[${index}].durationSeconds`, Number.EPSILON);
    requireFiniteNumber(rawClip.gainDb, `clips[${index}].gainDb`, -120);
    if (rawClip.sourceOffsetSeconds !== undefined) requireFiniteNumber(rawClip.sourceOffsetSeconds, `clips[${index}].sourceOffsetSeconds`);
  }
}

export function serializeProject(project: C6MusicProject, files: string[] = []): string {
  const now = new Date().toISOString();
  const createdAt = typeof project.metadata.createdAt === "string" ? project.metadata.createdAt : now;
  const payload: SerializedProject = {
    manifest: {
      schemaVersion: PROJECT_SCHEMA_VERSION,
      projectId: project.id,
      name: project.name,
      createdAt,
      updatedAt: now,
      files,
    },
    project,
  };
  return JSON.stringify(payload, null, 2);
}

export function deserializeProject(serialized: string): C6MusicProject {
  const payload: unknown = JSON.parse(serialized);
  if (!isRecord(payload) || !isRecord(payload.manifest) || !("project" in payload)) {
    throw new Error("Invalid project package: manifest and project are required");
  }
  if (payload.manifest.schemaVersion !== PROJECT_SCHEMA_VERSION) {
    throw new Error(`Unsupported project schema: ${payload.manifest.schemaVersion}`);
  }
  validateProjectShape(payload.project);
  if (payload.manifest.projectId !== payload.project.id) throw new Error("Project ID mismatch");
  const migrated = migrateProject(payload.project);
  validateClips(migrated);
  return migrated;
}
