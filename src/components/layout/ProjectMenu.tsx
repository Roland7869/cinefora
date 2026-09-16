import { useEffect, useRef, useState } from "react";
import { FolderOpen, Download, Save, Plus, History, Trash2, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProject } from "@/context/ProjectContext";
import { deleteBackup, loadBackups } from "@/lib/project";
import {
  formatScriptBeatsAsMarkdown,
  formatStoryboardBeatsAsMarkdown,
  formatEntitiesAsMarkdown,
} from "@/lib/prompts";

export function ProjectMenu() {
  const { isNew, createProject, saveProject, exportJson, importJson, clearProject, project } = useProject();
  const [newName, setNewName] = useState("");
  const [opening, setOpening] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleNew = () => {
    const name = newName.trim() || "Untitled Project";
    createProject(name);
    setNewName("");
  };

  const handleSave = () => {
    setSaving(true);
    saveProject();
    window.setTimeout(() => setSaving(false), 700);
  };

  const handleExport = () => {
    const json = exportJson();
    if (!json) return;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cinefora-project.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAll = () => {
    if (!project) return;
    const sections: string[] = [];
    sections.push(`# ${project.name} — Full Export\n`);
    sections.push(`*Exported ${new Date().toLocaleString()}*\n`);
    sections.push("---\n");
    if (project.characters.length > 0) { sections.push(formatEntitiesAsMarkdown(project.characters, "characters")); sections.push("\n---\n"); }
    if (project.assets.length > 0) { sections.push(formatEntitiesAsMarkdown(project.assets, "assets")); sections.push("\n---\n"); }
    if (project.locations.length > 0) { sections.push(formatEntitiesAsMarkdown(project.locations, "locations")); sections.push("\n---\n"); }
    if (project.buildings.length > 0) { sections.push(formatEntitiesAsMarkdown(project.buildings, "buildings")); sections.push("\n---\n"); }
    if (project.spacecraft.length > 0) { sections.push(formatEntitiesAsMarkdown(project.spacecraft, "spacecraft")); sections.push("\n---\n"); }
    if (project.scenes.length > 0) { sections.push(formatScriptBeatsAsMarkdown(project.scenes)); sections.push("\n---\n"); }
    if (project.storyboards.length > 0) { sections.push(formatStoryboardBeatsAsMarkdown(project.storyboards)); sections.push("\n---\n"); }
    if (project.sceneCanvases.length > 0) {
      sections.push("# Scene Canvases\n");
      for (const canvas of project.sceneCanvases) {
        sections.push(`## ${canvas.name}`);
        if (canvas.actors.length > 0) {
          sections.push("\n### Blocking\n");
          for (const actor of canvas.actors) {
            sections.push(`- **${actor.name}** (${actor.type}) at position (${Math.round(actor.x)}%, ${Math.round(actor.y)}%)`);
          }
        }
        if (canvas.generatedOutput) { sections.push("\n### Generated Canvas\n"); sections.push(canvas.generatedOutput); }
        sections.push("");
      }
      sections.push("\n---\n");
    }
    const content = sections.join("\n");
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cinefora-export.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOpening(true);
    try {
      const text = await file.text();
      importJson(text);
    } catch (err) {
      alert(`Could not open project: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setOpening(false);
      e.target.value = "";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-white/10 bg-white/5 text-white/80 hover:bg-white/10">
          <FolderOpen className="h-4 w-4" /> Project
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Project</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <div className="flex items-center gap-2 px-2 pt-1 pb-1">
            <Input
              placeholder="New project name"
              className="h-8 font-sans text-sm bg-white/5 font-mono"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <DropdownMenuItem onSelect={handleNew} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" /> New Project
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSave} className="cursor-pointer" disabled={!isNew || saving}>
            {saving ? <Spinner /> : <Save className="mr-2 h-4 w-4" />}
            Save Project
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleExport} className="cursor-pointer">
            <Download className="mr-2 h-4 w-4" /> Export JSON
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleExportAll} className="cursor-pointer">
            <FileText className="mr-2 h-4 w-4" /> Export All as Text
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleOpen} className="cursor-pointer" disabled={opening}>
            {opening ? <Spinner /> : <FolderOpen className="mr-2 h-4 w-4" />}
            Open Project
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs px-2 py-1 text-white/40">Backups</DropdownMenuLabel>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <History className="mr-2 h-4 w-4" /> Saved backups
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56">
            <BackupsList onOpen={handleOpen} onDelete={async (id: string) => {
              await loadBackups();
              deleteBackup(id);
            }} />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            if (window.confirm("Start over? This will clear the current project. You can export first to save a backup.")) {
              clearProject();
            }
          }}
          className="cursor-pointer text-red-300 focus:bg-red-500/20 focus:text-red-300"
        >
          <Trash2 className="mr-2 h-4 w-4" /> Start over
        </DropdownMenuItem>
      </DropdownMenuContent>
      <input type="file" accept="application/json,.json" className="hidden" onChange={handleOpen} />
    </DropdownMenu>
  );
}

function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin"><svg viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></span>
  );
}

interface BackupsListProps {
  onOpen: (json: string) => void;
  onDelete: (id: string) => Promise<void>;
}

function BackupsList({ onOpen, onDelete }: BackupsListProps) {
  const [backups, setBackups] = useState<Array<{ id: string; name: string; createdAt: string; sizeBytes: number; data: string }>>([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    loadBackups().then((list) => setBackups(list)).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    await onDelete(id);
    setBackups((b) => b.filter((b) => b.id !== id));
  };

  if (loading) {
    return <div className="px-2 py-1 text-xs text-white/40">Loading…</div>;
  }

  return (
    <div className="max-h-64 overflow-y-auto">
      {backups.length === 0 ? (
        <div className="px-2 py-3 text-xs text-white/40">No saved backups yet.</div>
      ) : (
        backups.map((backup) => (
          <div key={backup.id} className="group flex items-center gap-1">
            <button
              onClick={() => onOpen(backup.data)}
              className="flex flex-1 items-center gap-2 rounded px-2 py-1 text-left text-xs text-white/70 hover:bg-white/10 hover:text-white"
            >
              <FileJson className="h-3.5 w-3.5 shrink-0 text-white/40" />
              <span className="truncate">{backup.name}</span>
              <span className="ml-auto shrink-0 font-mono text-[10px] text-white/30">
                {new Date(backup.createdAt).toLocaleDateString()}
              </span>
            </button>
            <button
              onClick={() => handleDelete(backup.id)}
              className="shrink-0 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
              aria-label="Delete backup"
            >
              <Trash2 className="h-3.5 w-3.5 text-white/40" />
            </button>
          </div>
        ))
      )}
    </div>
  );
}

function FileJson({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}
