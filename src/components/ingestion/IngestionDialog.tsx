import { useEffect, useRef, useState } from "react";
import { X, FileText, FolderOpen, Upload, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface IngestionDialogProps {
  open: boolean;
  onConfirm: (source: { label: string; text: string }) => void;
  onClose: () => void;
}

const DEFAULT_SAMPLE = `Chapter One — The Arrival

The station hung like a suspended moon, its hull a lattice of indigo light against the void. Kael stepped onto the observation deck, her boots ringing against the deck. Beside her, Commander Voss watched the scanner flicker.

"There's something out there," Voss said. "A shape moving along the outer ring."

Kael raised her rifle. The weapon was a sleek cylinder of black polymer, humming with stored energy. Beyond the viewport, the colony outpost of New Meridian stretched across the ice plain — a cluster of geodesic domes and angular habitats clinging to the frozen world.`;

function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

async function readDirectoryRecursive(dir: FileSystemDirectoryHandle, prefix: string): Promise<string> {
  let text = "";
  const iterator = (dir as unknown as { values: () => AsyncIterableIterator<FileSystemEntry> }).values();
  while (true) {
    const result = await iterator.next();
    if (result.done) break;
    const entry = result.value;
    if (entry.kind === entry.kind.directory) {
      text += await readDirectoryRecursive(entry as unknown as FileSystemDirectoryHandle, `${prefix}${dir.name}/`);
    } else if (entry.kind === entry.kind.file && /\.(md|markdown|txt)$/.test(entry.name)) {
      const file = await entry.getFile();
      text += `${file.name}\n${await readFileText(file)}\n\n`;
    }
  }
  return text;
}

export function IngestionDialog({ open, onConfirm, onClose }: IngestionDialogProps) {
  const [mode, setMode] = useState<"paste" | "file" | "folder">("paste");
  const [text, setText] = useState("");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setMode("paste");
      setText("");
      setLabel("");
      setError("");
    }
  }, [open]);

  const onPickFiles = async (input: HTMLInputElement) => {
    setError("");
    const picked = Array.from(input.files ?? []);
    if (picked.length === 0) return;
    setLoading(true);
    try {
      const contents = await Promise.all(
        picked.map(async (file) => ({ name: file.name, text: await readFileText(file) })),
      );
      setText(contents.map((c) => c.text).join("\n\n"));
      setLabel(picked.map((c) => c.name).join(", "));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read files");
    } finally {
      setLoading(false);
    }
  };

  const confirm = () => {
    if (!text.trim()) {
      setError("Nothing to ingest — paste or attach a file first.");
      return;
    }
    onConfirm({ label: label.trim() || "Ingested book section", text: text.trim() });
  };

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
              Browse a local Obsidian Vault or folder. Only <code className="rounded bg-white/10 px-1">.md</code> and <code className="rounded bg-white/10 px-1">.txt</code> files are ingested, recursively.
            </p>
            <Button onClick={() => fileRef.current?.click()} className="h-11">
              <FolderOpen className="mr-2 h-4 w-4" /> Select folder
            </Button>
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={async (e) => {
                const target = e.target as HTMLInputElement & { directory?: boolean };
                const files = target.files;
                if (files && files.length > 0) {
                  const entry = (files[0] as unknown as { handle: FileSystemFileHandle }).handle;
                  try {
                    setLoading(true);
                    const rootHandle = entry as unknown as FileSystemDirectoryHandle;
                    const text = await readDirectoryRecursive(rootHandle, "");
                    setText(text.trim());
                    setLabel(files[0].name);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Could not read folder");
                  } finally {
                    setLoading(false);
                  }
                }
              }}
            />
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
