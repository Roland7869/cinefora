// Local-first persistence layer.
//
// Sensitive settings (API keys) are encrypted at rest via Web Crypto and
// stored in `localStorage`. Larger or blob-like collections (ingested book
// text, markdown files, prompt docs) are sharded into a private IndexedDB
// database so the app scales comfortably without touching the quota-heavy
// localStorage for big payloads.

import type { AppSettings, IngestedSource, MarkdownFile, PromptLibraryDoc } from "@/types";
import { encryptSettings } from "@/lib/crypto";

export const DB_NAME = "cinefora";
export const DB_VERSION = 1;
export const STORE_BOOK = "book";
export const STORE_MARKDOWN = "markdown";
export const STORE_PROMPTS = "promptLibrary";

function getSettingsKey() {
  return `cinefora.settings.v1`;
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// --- Settings (engines + config) -------------------------------------------
export function loadSettings(): Promise<AppSettings> {
  return encryptSettings(readJSON(getSettingsKey(), null));
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await encryptSettings(settings);
}

export function defaultSettings(): AppSettings {
  return {
    engines: {
      cloud: { provider: "openai", apiKey: "" },
      local: [
        { kind: "lm-studio", baseUrl: "http://localhost:1234", model: "local-model", healthPath: "/v1/models" },
        { kind: "ollama", baseUrl: "http://localhost:11434", model: "llama3.2", healthPath: "/v1/models" },
        { kind: "unsloth", baseUrl: "http://localhost:8000", model: "unsloth-model", healthPath: "/v1/models" },
        { kind: "llama-cpp", baseUrl: "http://localhost:8080", model: "llama3.2", healthPath: "/v1/models" },
      ],
    },
    markdownFiles: [],
  };
}

// --- IndexedDB sharded store -----------------------------------------------
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_BOOK)) db.createObjectStore(STORE_BOOK, { keyPath: "id" });
      if (!db.objectStoreNames.contains(STORE_MARKDOWN)) db.createObjectStore(STORE_MARKDOWN, { keyPath: "id" });
      if (!db.objectStoreNames.contains(STORE_PROMPTS)) db.createObjectStore(STORE_PROMPTS, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
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

export async function loadBook(): Promise<IngestedSource | null> {
  return tx<IngestedSource | null>("readonly", STORE_BOOK, (store) => store.get("active")) as Promise<IngestedSource | null>;
}

export async function saveBook(source: IngestedSource): Promise<void> {
  await tx("readwrite", STORE_BOOK, (store) => store.put({ id: "active", ...source }));
}

export async function clearBook(): Promise<void> {
  await tx("readwrite", STORE_BOOK, (store) => store.delete("active"));
}

export async function loadMarkdownFiles(): Promise<MarkdownFile[]> {
  return tx<MarkdownFile[]>("readonly", STORE_MARKDOWN, (store) => store.getAll());
}

export async function saveMarkdownFile(file: MarkdownFile): Promise<void> {
  await tx("readwrite", STORE_MARKDOWN, (store) => store.put(file));
}

export async function deleteMarkdownFile(id: string): Promise<void> {
  await tx("readwrite", STORE_MARKDOWN, (store) => store.delete(id));
}

export async function savePromptDoc(doc: PromptLibraryDoc): Promise<void> {
  await tx("readwrite", STORE_PROMPTS, (store) => store.put(doc));
}

export async function deletePromptDoc(id: string): Promise<void> {
  await tx("readwrite", STORE_PROMPTS, (store) => store.delete(id));
}

export async function loadPromptDocs(): Promise<PromptLibraryDoc[]> {
  return tx<PromptLibraryDoc[]>("readonly", STORE_PROMPTS, (store) => store.getAll());
}
