import { useEffect, useRef, useState } from "react";
import { X, FolderOpen, Upload, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  ingestFromDirectoryHandle,
  isManuscriptFile,
  sourcesToText,
} from "@/lib/ingestion";
import type { IngestedSource } from "@/types";

interface IngestionDialogProps {
  open: boolean;
  onConfirm: (source: IngestedSource) => void;
  onClose: () => void;
}

const DEFAULT_SAMPLE = `Chapter One — The Arrival

The station hung like a suspended moon, its hull a lattice of indigo light against the void. Kael stepped onto the observation deck, her boots ringing against the deck. Beside her, Commander Voss watched the scanner flicker.

"There's something out there," Voss said. "A shape moving along the outer ring."

Kael raised her rifle. The weapon was a sleek cylinder of black polymer, humming with stored energy. Beyond the viewport, the colony outpost of New Meridian stretched across the ice plain — a cluster of geodesic domes and angular habitats clinging to the frozen world.`;

async function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

// Load a set of files into a structured IngestedSource with provenance.
async function loadFiles(files: File[]): Promise<IngestedSource> {
  const sources: IngestedSource["sources"] = [];
  const chunks = await Promise.all(
    files.map(async (file) => {
      if (!isManuscriptFile(file.name)) return null;
      const content = await readFileText(file);
      const relativePath = file.webkitRelativePath ?? file.name;
      const title = file.name.replace(/\.(md|markdown|txt)$/i, "").trim() || file.name;
      // Try to extract chapter number from filename (e.g. "Chapter 03.md" -> "3")
      const chapterMatch = title.match(/chapter\s*(\d+)/i);
      return {
        id: `src-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        filename: file.name,
        relativePath,
        title,
        content,
        chapter: chapterMatch ? chapterMatch[1] : undefined,
        sourceType: /\.(md|markdown)$/i.test(file.name) ? "markdown" : "txt",
        metadata: { folder: relativePath.substring(0, relativePath.lastIndexOf("/") || 0), extension: file.name.split(".").pop() ?? "" },
      };
    }),
  );
  for (const chunk of chunks) if (chunk) sources.push(chunk);
  const text = sourcesToText(sources);
  return { text, label: sources.length ? `${sources.length} file(s)` : "", sources };
}

// Load a directory handle (showDirectoryPicker) into a structured IngestedSource.
async function loadDirectory(handle: FileSystemDirectoryHandle): Promise<IngestedSource> {
  const result = await ingestFromDirectoryHandle(handle);
  if (result.error && result.sources.length === 0) {
    throw new Error(result.error);
  }
  const label = result.sources.length ? `${result.sources.length} file(s)` : "";
  return { text: sourcesToText(result.sources), label, sources: result.sources };
}

export function IngestionDialog({ open, onConfirm, onClose }: IngestionDialogProps) {
  const [mode, setMode] = useState<"paste" | "file" | "folder">("paste");
  const [text, setText] = useState("");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileCount, setFileCount] = useState(0);
  const [folderCount, setFolderCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setMode("paste");
      setText("");
      setLabel("");
      setError("");
      setFileCount(0);
      setFolderCount(0);
    }
  }, [open]);

  const onPickFiles = async (input: HTMLInputElement) => {
    setError("");
    const picked = Array.from(input.files ?? []);
    if (picked.length === 0) return;
    setLoading(true);
    try {
      const source = await loadFiles(picked);
      setText(source.text);
      setLabel(source.label);
      setFileCount(source.sources.length);
      setLastSources(source.sources);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read files");
    } finally {
      setLoading(false);
    }
  };

  const openFolderPicker = async () => {
    setError("");
    setLoading(true);
    // Prefer the native directory picker; fall back to webkitdirectory.
    if (typeof window !== "undefined" && "showDirectoryPicker" in window) {
      try {
        const handle = await window.showDirectoryPicker({ label: "Select Obsidian vault or folder" });
        const source = await loadDirectory(handle);
        setText(source.text);
        setLabel(source.label);
        setFolderCount(source.sources.length);
        setLastSources(source.sources);
      } catch (err) {
        // User cancelled (AbortError) or unsupported — fall back to FileList.
        if (err instanceof Error && err.name === "AbortError") {
          setError("");
        } else {
          setError(err instanceof Error ? err.message : "Could not open folder");
        }
      }
    }
    // Always surface the FileList fallback so the feature works everywhere.
    fileRef.current?.click();
    setLoading(false);
  };

  const confirm = () => {
    if (!text.trim()) {
      setError("Nothing to ingest — paste or attach a file first.");
      return;
    }
    onConfirm({ text: text.trim(), label: label.trim() || "Ingested book section", sources: lastSources });
  };

  const [lastSources, setLastSources] = useState<IngestedSource["sources"]>([]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl data-[state=open]:animate-in p-0">
        <DialogHeader>
          <DialogTitle className="text-lg">Connect your book text</DialogTitle>
          <DialogDescription>
            Feed a raw section of your manuscript to every stage of the pipeline.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-1 p-1 pt-4">
          {(["paste", "file", "folder"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition",
                mode === m ? "bg-[#6366F1] text-white" : "text-white/50 hover:bg-white/5 hover:text-white/80",
              )}
            >
              {m === "paste" ? "Paste text" : m === "file" ? "Single file" : "Whole folder"}
            </button>
          ))}
        </div>

        {mode === "paste" && (
          <Textarea
            placeholder="Paste a raw section of your book text here…"
            className="min-h-[220px] resize-none font-mono text-sm"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        )}

        {mode === "file" && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-white/50">Attach one <code className="rounded bg-white/10 px-1">.md</code> / <code className="rounded bg-white/10 px-1">.txt</code> file (or several, concatenated).</p>
            <Button onClick={() => fileRef.current?.click()} className="h-11">
              <Upload className="mr-2 h-4 w-4" /> Attach file(s)
            </Button>
            <input ref={fileRef} type="file" accept=".md,.markdown,.txt" multiple className="hidden" onChange={(e) => onPickFiles(e.target)} />
          </div>
        )}

        {mode === "folder" && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-white/50">
              Browse a local Obsidian Vault or folder. Only <code className="rounded bg-white/10 px-1">.md</code> and <code className="rounded bg-white/10 px-1">.txt</code> files are ingested, recursively. <code className="rounded bg-white/10 px-1">.obsidian/</code> metadata is ignored.
            </p>
            <Button onClick={openFolderPicker} className="h-11" disabled={loading}>
              <FolderOpen className="mr-2 h-4 w-4" /> Select folder
            </Button>
            <input
              ref={fileRef}
              type="file"
              multiple
              webkitdirectory
              directory
              className="hidden"
              onChange={(e) => {
                const target = e.target as HTMLInputElement & { files?: FileList };
                if (target.files) onPickFiles(target);
                else setLoading(false);
              }}
            />
            {folderCount > 0 && (
              <div className="rounded-md border border-white/10 bg-black/30 p-2.5 font-mono text-[11px] text-white/70 leading-relaxed">
                {folderCount} {folderCount === 1 ? "file" : "files"} ingested · {text.length.toLocaleString()} characters
              </div>
            )}
            {loading && <div className="flex items-center gap-2 text-xs text-white/60"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading folder…</div>}
          </div>
        )}

        {error && <p className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-white/40">{text.length.toLocaleString()} characters ingested</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} className="border-white/10">
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button onClick={confirm} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />} Load into pipeline
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
