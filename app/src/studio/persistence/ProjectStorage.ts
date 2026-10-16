import type { C6MusicProject } from "../../../../c6-core/src/project";
import { deserializeProject, serializeProject } from "../../../../c6-core/src/project-io";

const DB_NAME = "c6-music-studio";
const DB_VERSION = 1;
const PROJECT_STORE = "projects";
const ASSET_STORE = "assets";
const PROJECT_ID = "current";

interface StoredProject {
  id: string;
  serialized: string;
  savedAt: number;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROJECT_STORE)) db.createObjectStore(PROJECT_STORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(ASSET_STORE)) db.createObjectStore(ASSET_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open project storage"));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
  });
}

async function putProject(serialized: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(PROJECT_STORE, "readwrite");
  tx.objectStore(PROJECT_STORE).put({ id: PROJECT_ID, serialized, savedAt: Date.now() } satisfies StoredProject);
  await transactionDone(tx);
  db.close();
}

async function putAsset(id: string, blob: Blob): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(ASSET_STORE, "readwrite");
  tx.objectStore(ASSET_STORE).put({ id, blob });
  await transactionDone(tx);
  db.close();
}

async function getProject(): Promise<StoredProject | undefined> {
  const db = await openDatabase();
  const tx = db.transaction(PROJECT_STORE, "readonly");
  const request = tx.objectStore(PROJECT_STORE).get(PROJECT_ID);
  const result = await new Promise<StoredProject | undefined>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as StoredProject | undefined);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return result;
}

async function getAsset(id: string): Promise<Blob | undefined> {
  const db = await openDatabase();
  const tx = db.transaction(ASSET_STORE, "readonly");
  const request = tx.objectStore(ASSET_STORE).get(id);
  const result = await new Promise<Blob | undefined>((resolve, reject) => {
    request.onsuccess = () => resolve((request.result as { blob: Blob } | undefined)?.blob);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return result;
}

export interface PersistedProject {
  project: C6MusicProject;
  assets: Map<string, string>;
  savedAt: number;
}

export async function saveProject(project: C6MusicProject): Promise<number> {
  const assetIds = project.tracks.flatMap(track => track.assets.map(asset => asset.id));
  const uniqueIds = [...new Set(assetIds)];

  for (const id of uniqueIds) {
    const asset = project.tracks.flatMap(track => track.assets).find(item => item.id === id);
    if (!asset?.uri) continue;
    const response = await fetch(asset.uri);
    if (!response.ok) throw new Error(`Unable to persist asset ${asset.id}: HTTP ${response.status}`);
    await putAsset(id, await response.blob());
  }

  const serialized = serializeProject(project, uniqueIds.map(id => `assets/${id}`));
  await putProject(serialized);
  return Date.now();
}

export async function loadProject(): Promise<PersistedProject | undefined> {
  const stored = await getProject();
  if (!stored) return undefined;

  const project = deserializeProject(stored.serialized);
  const assets = new Map<string, string>();

  for (const track of project.tracks) {
    for (const asset of track.assets) {
      if (assets.has(asset.id)) continue;
      const blob = await getAsset(asset.id);
      if (!blob) continue;
      assets.set(asset.id, URL.createObjectURL(blob));
    }
  }

  return { project, assets, savedAt: stored.savedAt };
}

export async function getStoredAsset(id: string): Promise<Blob | undefined> {
  return getAsset(id);
}

export async function storeAsset(id: string, blob: Blob): Promise<void> {
  await putAsset(id, blob);
}

export async function hasSavedProject(): Promise<boolean> {
  return Boolean(await getProject());
}
