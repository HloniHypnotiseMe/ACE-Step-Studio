import type { C6MusicProject } from "../../../../c6-core/src/project";
import { deserializeProject, serializeProject } from "../../../../c6-core/src/project-io";

export const C6_PROJECT_PACKAGE_VERSION = 1;

export interface C6ProjectPackageAsset {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
}

export interface C6ProjectPackage {
  format: "c6-music-project";
  version: 1;
  exportedAt: string;
  project: string;
  assets: C6ProjectPackageAsset[];
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read project asset"));
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) throw new Error("Invalid project asset data");
  const header = dataUrl.slice(0, comma);
  const body = dataUrl.slice(comma + 1);
  const mimeType = header.match(/data:([^;]+)/)?.[1] ?? "application/octet-stream";
  const bytes = Uint8Array.from(atob(body), char => char.charCodeAt(0));
  return new Blob([bytes], { type: mimeType });
}

export async function exportProjectPackage(
  project: C6MusicProject,
  resolveAsset: (id: string) => Promise<Blob | undefined>
): Promise<Blob> {
  const ids = [...new Set(project.tracks.flatMap(track => track.assets.map(asset => asset.id)))];
  const assets: C6ProjectPackageAsset[] = [];

  for (const id of ids) {
    const asset = project.tracks.flatMap(track => track.assets).find(item => item.id === id);
    const blob = await resolveAsset(id);
    if (!asset || !blob) throw new Error(`Project asset is unavailable: ${id}`);
    assets.push({
      id,
      name: asset.uri.split("/").pop() || id,
      mimeType: blob.type || "application/octet-stream",
      dataUrl: await blobToDataUrl(blob)
    });
  }

  const payload: C6ProjectPackage = {
    format: "c6-music-project",
    version: C6_PROJECT_PACKAGE_VERSION,
    exportedAt: new Date().toISOString(),
    project: serializeProject(project, ids.map(id => `assets/${id}`)),
    assets
  };

  return new Blob([JSON.stringify(payload)], { type: "application/json" });
}

export async function importProjectPackage(
  file: Blob,
  storeAsset: (id: string, blob: Blob) => Promise<void>
): Promise<{ project: C6MusicProject; assets: Map<string, string> }> {
  const raw = JSON.parse(await file.text()) as Partial<C6ProjectPackage>;
  if (raw.format !== "c6-music-project" || raw.version !== 1 || typeof raw.project !== "string" || !Array.isArray(raw.assets)) {
    throw new Error("Not a valid C6 Music Studio project package");
  }

  const project = deserializeProject(raw.project);
  const assets = new Map<string, string>();

  for (const item of raw.assets) {
    if (!item || typeof item.id !== "string" || typeof item.dataUrl !== "string") {
      throw new Error("Project package contains an invalid asset");
    }
    const blob = dataUrlToBlob(item.dataUrl);
    await storeAsset(item.id, blob);
    assets.set(item.id, URL.createObjectURL(blob));
  }

  return { project, assets };
}
