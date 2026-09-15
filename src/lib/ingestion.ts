// Filesystem ingestion helpers.
//
// Reads a local Obsidian vault or folder into structured sources while
// preserving relative paths and filenames. Prefers the native
// `showDirectoryPicker()` API and falls back to a `<input webkitdirectory>`
// FileList. Skips Obsidian metadata and other dotfiles so a vault import only
// pulls in manuscript content.

import type { SourceEntry } from "@/types";

// A small result object so ingestion can report partial failures (e.g. one
// unreadable file) instead of aborting the whole import.
export interface IngestResult {
  sources: SourceEntry[];
  error?: string;
}

const MANUSCRIPT_RE = /\.(md|markdown|txt)$/i;

export function isManuscriptFile(name: string): boolean {
  return MANUSCRIPT_RE.test(name);
}

function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `src-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function extensionOf(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

function makeSource(file: File, relativePath: string, chapter?: string): SourceEntry {
  return {
    id: newId(),
    filename: file.name,
    relativePath,
    title: file.name.replace(MANUSCRIPT_RE, "").trim() || file.name,
    content: "",
    chapter,
    sourceType: /\.(md|markdown)$/i.test(file.name) ? "markdown" : "txt",
    metadata: {
      folder: relativePath.substring(0, relativePath.lastIndexOf("/") || 0),
      extension: extensionOf(file.name),
      sizeBytes: file.size,
    },
  };
}

// Recursively collect manuscript files from a directory handle, tracking the
// relative path prefix so provenance is preserved.
async function collectFromHandle(
  dir: FileSystemDirectoryHandle,
  prefix: string,
  out: SourceEntry[],
  error?: string,
): Promise<IngestResult> {
  const iterator = dir.values() as AsyncIterableIterator<FileSystemDirectoryHandle | FileSystemFileHandle>;
  for await (const entry of iterator) {
    // Skip Obsidian metadata and other hidden files/dirs.
    if (entry.kind === "directory" && (entry.name === ".obsidian" || entry.name.startsWith("."))) {
      continue;
    }
    if (entry.kind === "directory") {
      const sub = await collectFromHandle(entry, `${prefix}${entry.name}/`, out, error);
      if (sub.error) error = sub.error;
    } else if (entry.kind === "file" && isManuscriptFile(entry.name)) {
      try {
        const file = await entry.getFile();
        const content = await readTextFile(file);
        out.push({ ...makeSource(file, `${prefix}${entry.name}`), content });
      } catch (err) {
        error = error ?? `Could not read ${entry.name}: ${err instanceof Error ? err.message : String(err)}`;
      }
    }
  }
  return { sources: out, error };
}

// Ingest from a native directory handle (showDirectoryPicker).
export async function ingestFromDirectoryHandle(
  handle: FileSystemDirectoryHandle,
): Promise<IngestResult> {
  return ingestDirectory(handle);
}

// Read a directory handle and stream its file contents into sources.
export async function ingestDirectory(handle: FileSystemDirectoryHandle): Promise<IngestResult> {
  const out: SourceEntry[] = [];
  let error: string | undefined;
  const result = await collectFromHandle(handle, "", out, error);
  return { sources: result.sources, error: result.error };
}

// Build source records from a FileList (used by the webkitdirectory fallback).
export async function ingestFileList(files: FileList): Promise<IngestResult> {
  const out: SourceEntry[] = [];
  for (const file of Array.from(files)) {
    if (!isManuscriptFile(file.name)) continue;
    const relativePath = file.webkitRelativePath ?? file.name;
    try {
      const source = makeSource(file, relativePath);
      source.content = await readTextFile(file);
      out.push(source);
    } catch {
      // Skip unreadable files rather than failing the whole import.
    }
  }
  return { sources: out };
}

// Assemble the concatenated text used to drive AI extraction.
export function sourcesToText(sources: SourceEntry[]): string {
  return sources.map((s) => `${s.relativePath}\n${s.content}\n`).join("\n\n---\n\n");
}
