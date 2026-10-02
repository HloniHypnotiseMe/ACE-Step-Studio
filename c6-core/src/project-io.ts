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

export function serializeProject(project: C6MusicProject, files: string[] = []): string {
  const now = new Date().toISOString();
  const payload: SerializedProject = {
    manifest: {
      schemaVersion: PROJECT_SCHEMA_VERSION,
      projectId: project.id,
      name: project.name,
      createdAt: now,
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
  return payload.project;
}
