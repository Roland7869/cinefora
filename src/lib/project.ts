// Project persistence model.
//
// A Project bundles every piece of structured data for a creative run —
// sources, entities (characters/locations/buildings/assets/spacecraft), script
// beats, storyboard shots, and the prompt library — so a whole session can be
// backed up and restored as a single portable JSON document. Larger or blob
// payloads live in IndexedDB; the portable JSON export/import is the user's
// backup mechanism.

import type {
  AppSettings,
  PromptLibraryDoc,
  ReviewedEntity,
  SceneCanvas,
  ScriptBeat,
  SourceEntry,
  StoryboardBeat,
} from "@/types";
import { DB_NAME, DB_VERSION, STORE_PROJECT, STORE_BACKUPS, openDB } from "@/lib/storage";
import { EVIDENCE_LABELS } from "@/lib/entities";

export const PROJECT_VERSION = "1.0.0";

export interface Project {
  id: string;
  name: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  sources: SourceEntry[];
  characters: ReviewedEntity[];
  locations: ReviewedEntity[];
  buildings: ReviewedEntity[];
  assets: ReviewedEntity[];
  spacecraft: ReviewedEntity[];
  scenes: ScriptBeat[];
  storyboards: StoryboardBeat[];
  sceneCanvases: SceneCanvas[];
  promptLibrary: PromptLibraryDoc[];
  settings: AppSettings;
}

export interface ProjectBackup {
  id: string;
  name: string;
  createdAt: string;
  sizeBytes: number;
  data: string;
}

export function createEmptyProject(name = "Untitled Project"): Project {
  const now = new Date().toISOString();
  return {
    id: `proj-${now}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    version: PROJECT_VERSION,
    createdAt: now,
    updatedAt: now,
    sources: [],
    characters: [],
    locations: [],
    buildings: [],
    assets: [],
    spacecraft: [],
    scenes: [],
    storyboards: [],
    sceneCanvases: [],
    promptLibrary: [],
    settings: {
      engines: {
        cloud: { provider: "openai", apiKey: "" },
        local: [
          { kind: "lm-studio", baseUrl: "http://localhost:1234", model: "local-model", healthPath: "/v1/models" },
          { kind: "ollama", baseUrl: "http://localhost:11434", model: "llama3.2", healthPath: "/v1/models" },
        ],
      },
      markdownFiles: [],
    },
  };
}

function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function tx<T>(mode: IDBTransactionMode, storeName: string, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = fn(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      reject(request.error);
      db.close();
    };
    transaction.oncomplete = () => db.close();
  });
}

// --- Project storage (IndexedDB) -------------------------------------------
export async function loadProject(): Promise<Project | null> {
  return tx<Project | null>("readonly", STORE_PROJECT, (store) => store.get("active")) as Promise<Project | null>;
}

export async function saveProject(project: Project): Promise<void> {
  project.updatedAt = new Date().toISOString();
  await tx("readwrite", STORE_PROJECT, (store) => store.put({ id: "active", ...project }));
}

export async function clearProject(): Promise<void> {
  await tx("readwrite", STORE_PROJECT, (store) => store.delete("active"));
}

// --- Backups (IndexedDB) ---------------------------------------------------
export async function saveBackup(project: Project): Promise<ProjectBackup> {
  const backup: ProjectBackup = {
    id: newId(),
    name: project.name,
    createdAt: new Date().toISOString(),
    sizeBytes: new Blob([JSON.stringify(project, null, 2)]).size,
    data: JSON.stringify(project, null, 2),
  };
  await tx("readwrite", STORE_BACKUPS, (store) => store.put(backup));
  return backup;
}

export async function loadBackups(): Promise<ProjectBackup[]> {
  return tx<ProjectBackup[]>("readonly", STORE_BACKUPS, (store) => store.getAll());
}

export async function deleteBackup(id: string): Promise<void> {
  await tx("readwrite", STORE_BACKUPS, (store) => store.delete(id));
}

// --- Portable JSON export/import -------------------------------------------
export function exportProjectJson(project: Project): string {
  return JSON.stringify(project, null, 2);
}

export function importProjectJson(json: string): Project {
  const parsed = JSON.parse(json) as Project;
  // Normalise a bare object into the active-keyed shape if needed.
  if (!parsed.id || !Array.isArray(parsed.characters)) {
    return { id: parsed.id ?? newId(), ...parsed };
  }
  return parsed;
}

export function projectJsonName(project: Project): string {
  return `cinefora-${project.id}.json`;
}
