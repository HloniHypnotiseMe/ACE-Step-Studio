import type { AudioAsset } from "./contracts.js";

export interface Track {
  id: string;
  name: string;
  type: "audio" | "midi" | "instrument" | "bus";
  gainDb: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  assets: AudioAsset[];
}

export interface ProjectClip {
  id: string;
  trackId: string;
  assetId: string;
  startSeconds: number;
  durationSeconds: number;
  gainDb: number;
}

export interface ProjectOperation {
  id: string;
  timestamp: string;
  type: string;
  payload: Record<string, unknown>;
  reversible: boolean;
}

export interface C6MusicProject {
  schemaVersion: 1;
  id: string;
  name: string;
  bpm: number;
  sampleRate: number;
  tracks: Track[];
  clips: ProjectClip[];
  operations: ProjectOperation[];
  metadata: Record<string, unknown>;
}

export function createProject(name = "Untitled"): C6MusicProject {
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    name,
    bpm: 120,
    sampleRate: 48000,
    tracks: [],
    clips: [],
    operations: [],
    metadata: { createdAt: new Date().toISOString() }
  };
}

export function appendOperation(project: C6MusicProject, operation: ProjectOperation): C6MusicProject {
  return { ...project, operations: [...project.operations, operation] };
}

export function addAssetTrack(project: C6MusicProject, asset: AudioAsset, name = "Audio"): C6MusicProject {
  const trackId = asset.id;
  const track: Track = {
    id: trackId,
    name,
    type: "audio",
    gainDb: 0,
    pan: 0,
    muted: false,
    solo: false,
    assets: [asset]
  };
  const clip: ProjectClip = {
    id: crypto.randomUUID(),
    trackId,
    assetId: asset.id,
    startSeconds: 0,
    durationSeconds: asset.durationSeconds ?? 8,
    gainDb: 0
  };
  return { ...project, tracks: [...project.tracks, track], clips: [...project.clips, clip] };
}

export function addProjectClip(project: C6MusicProject, clip: ProjectClip): C6MusicProject {
  if (!project.tracks.some(track => track.id === clip.trackId)) throw new Error(`Track not found: ${clip.trackId}`);
  if (!project.tracks.some(track => track.assets.some(asset => asset.id === clip.assetId))) throw new Error(`Asset not found: ${clip.assetId}`);
  return { ...project, clips: [...project.clips, clip] };
}

export function moveProjectClip(project: C6MusicProject, clipId: string, startSeconds: number): C6MusicProject {
  if (startSeconds < 0) throw new Error("Clip cannot start before zero");
  return {
    ...project,
    clips: project.clips.map(clip => clip.id === clipId ? { ...clip, startSeconds } : clip)
  };
}

export function resizeProjectClip(project: C6MusicProject, clipId: string, durationSeconds: number): C6MusicProject {
  if (durationSeconds <= 0) throw new Error("Clip duration must be positive");
  return {
    ...project,
    clips: project.clips.map(clip => clip.id === clipId ? { ...clip, durationSeconds } : clip)
  };
}
