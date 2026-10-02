import type { AudioAsset } from "./contracts.js";

export interface Track {
  id: string;
  name: string;
  type: "audio"|"midi"|"instrument"|"bus";
  gainDb: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  assets: AudioAsset[];
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
  operations: ProjectOperation[];
  metadata: Record<string, unknown>;
}

export function createProject(name="Untitled"): C6MusicProject {
  return {schemaVersion:1,id:crypto.randomUUID(),name,bpm:120,sampleRate:48000,tracks:[],operations:[],metadata:{}};
}

export function appendOperation(project:C6MusicProject, operation:ProjectOperation): C6MusicProject {
  return {...project, operations:[...project.operations, operation]};
}