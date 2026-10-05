import type { C6MusicProject } from "./project";

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

  return { ...project, clips };
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
  const payload = JSON.parse(serialized) as SerializedProject;
  if (payload.manifest.schemaVersion !== PROJECT_SCHEMA_VERSION) {
    throw new Error(`Unsupported project schema: ${payload.manifest.schemaVersion}`);
  }
  if (payload.manifest.projectId !== payload.project.id) throw new Error("Project ID mismatch");
  return migrateProject(payload.project);
}