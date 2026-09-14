import { useEffect, useRef, useState } from "react";
import { View, Pencil, Save, FolderOpen, Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkdownPreview } from "@/components/settings/MarkdownPreview";
import { cn } from "@/lib/utils";
import type { MarkdownFile } from "@/types";

interface MarkdownFileManagerProps {
  files: MarkdownFile[];
  onAdd: (file: MarkdownFile) => void;
  onUpdate: (file: MarkdownFile) => void;
  onDelete: (id: string) => void;
}

const MARKDOWN_DIR = "app_data/markdown_files";

async function pickOrCreateDir(): Promise<FileSystemDirectoryHandle | null> {
  if (!("showDirectoryHandle" in window)) return null;
  try {
    return await (window as unknown as {
      showDirectoryHandle: (name: string, options?: unknown) => Promise<FileSystemDirectoryHandle>;
    }).showDirectoryHandle(MARKDOWN_DIR, { create: true });
  } catch {
    return null;
  }
}

async function fileFromHandle(handle: FileSystemFileHandle): Promise<MarkdownFile> {
  const file = await handle.getFile();
  return {
    id: file.name,
    title: file.name.replace(/\.md$/, ""),
    path: `${MARKDOWN_DIR}/${file.name}`,
    content: await file.text(),
    updatedAt: new Date().toISOString(),
  };
}

async function writeToFile(handle: FileSystemFileHandle, content: string): Promise<void> {
  await handle.createWritable().then((w) => w.write(content)).catch(() => {});
}

async function readFromFile(handle: FileSystemFileHandle): Promise<string> {
  const file = await handle.getFile();
  return file.text();
}

export function MarkdownFileManager({ files, onAdd, onUpdate, onDelete }: MarkdownFileManagerProps) {
  const dirRef = useRef<FileSystemDirectoryHandle | null>(null);
  const [dirError, setDirError] = useState("");
  const [title, setTitle] = useState("");
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState(false);
  const [mode, setMode] = useState<"view" | "edit" | "save">("view");
  const [activeId, setActiveId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const active = files.find((f) => f.id === activeId) ?? null;

  const refreshDir = async () => {
    const dir = await pickOrCreateDir();
    if (dir) {
      dirRef.current = dir;
      setDirError("");
      try {
        const entries = dir.values() as unknown as AsyncIterable<FileSystemFileHandle | FileSystemDirectoryHandle>;
        for await (const entry of entries) {
          if ((entry.kind as "file" | "directory") === "file") {
            onAdd(await fileFromHandle(entry as FileSystemFileHandle));
          }
        }
      } catch (e) {
        setDirError(e instanceof Error ? e.message : "Could not read folder");
      }
    } else {
      setDirError("File System Access API unavailable — using in-app storage fallback.");
    }
  };

  useEffect(() => {
    refreshDir();
  }, []);

  const commit = (file: MarkdownFile) => {
    const dir = dirRef.current;
    if (dir && file.id.endsWith(".md")) {
      void writeToFile(file as unknown as FileSystemFileHandle, file.content);
      void readFromFile(file as unknown as FileSystemFileHandle).then((content) => onUpdate({ ...file, content }));
    }
    onAdd(file);
    setActiveId(file.id);
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-white/10" onClick={refreshDir}>
            <FolderOpen className="mr-2 h-4 w-4" /> Refresh folder
          </Button>
          {dirError && <Badge variant="destructive" className="text-xs">{dirError}</Badge>}
        </div>
        <Button onClick={() => fileRef.current?.click()} className="gap-2">
          <Plus className="h-4 w-4" /> New Markdown file
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".md,.markdown,.txt"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setTitle(file.name.replace(/\.md$/i, ""));
            setDraft("");
            setSaved(false);
            setActiveId(null);
          }}
        />
      </div>

      <Tabs value={active ? activeId : ""} onValueChange={setActiveId} className="flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-72 lg:min-w-[18rem] shrink-0">
          <div className="rounded-xl border border-white/10 bg-white/5">
            <div className="border-b border-white/10 px-4 py-3">
              <h3 className="font-semibold text-white">App Markdown Files</h3>
              <p className="text-[11px] text-white/40">{MARKDOWN_DIR}</p>
            </div>
            <ul className="max-h-[400px] overflow-y-auto">
              {files.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-white/40">No Markdown files yet.</li>
              ) : (
                files.map((file) => (
                  <li key={file.id}>
                    <button
                      onClick={() => {
                        setActiveId(file.id);
                        setTitle(file.title);
                        setDraft(file.content);
                        setMode("view");
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition",
                        activeId === file.id && mode === "view" ? "bg-[#6366F1]/15 text-white" : "hover:bg-white/5 text-white/70",
                      )}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#6366F1]" />
                        <span className="truncate font-mono text-sm">{file.title}</span>
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 hover:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(file.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {active && (
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-mono text-sm text-white/70">{active.path}</h3>
              <div className="flex items-center gap-2">
                {saved && <Badge className="text-emerald-300 border-emerald-500/30 bg-emerald-500/10"><Check className="h-3 w-3 mr-1" /> Saved</Badge>}
                {mode === "view" && (
                  <Button size="sm" onClick={() => { setDraft(active.content); setTitle(active.title); setSaved(false); setMode("edit"); }}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit MD
                  </Button>
                )}
                {mode === "edit" && (
                  <Button size="sm" onClick={() => setMode("save")}>
                    <Save className="h-3.5 w-3.5 mr-1.5" /> Save MD
                  </Button>
                )}
              </div>
            </div>

            <Tabs value={mode} onValueChange={(m) => setMode(m as "view" | "edit" | "save")}>
              <TabsList className="mb-3">
                <TabsTrigger value="view" className="data-[state=active]:bg-[#6366F1]"><View className="mr-1.5 h-3.5 w-3.5" /> View</TabsTrigger>
                <TabsTrigger value="edit" className="data-[state=active]:bg-[#6366F1]"><Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit</TabsTrigger>
                <TabsTrigger value="save" className="data-[state=active]:bg-[#6366F1]"><Save className="mr-1.5 h-3.5 w-3.5" /> Save</TabsTrigger>
              </TabsList>

              {(mode === "edit" || mode === "save") && (
                <div className="mb-3">
                  <Label className="text-xs text-white/60">Title</Label>
                  <input
                    className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white focus:border-[#6366F1] focus:outline-none"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
              )}

              <div className="grid flex-1 gap-4 min-h-0">
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <Label className="text-xs text-white/60 mb-1.5 block">Source (raw markdown)</Label>
                  <textarea
                    className="h-[calc(50%_/_2_+_1rem)] w-full resize-none rounded-md border border-white/10 bg-transparent px-3 py-2 font-mono text-sm text-white/90 focus:outline-none"
                    value={mode === "view" ? draft : draft}
                    onChange={(e) => setDraft(e.target.value)}
                    spellCheck={false}
                  />
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <Label className="text-xs text-white/60 mb-1.5 block">Live preview</Label>
                  <div className="h-[calc(50%_/_2_+_1rem)] overflow-y-auto">
                    <MarkdownPreview content={draft} />
                  </div>
                </div>
              </div>
            </Tabs>
          </div>
        )}
      </Tabs>
    </div>
  );
}
