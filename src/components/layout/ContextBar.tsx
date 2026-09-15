import { BookOpen, Sparkles, Upload, Save, Cloud, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBook } from "@/context/IngestedBookContext";
import { useProject } from "@/context/ProjectContext";
import { useSettings } from "@/context/AppSettingsContext";

export function ContextBar({ onOpenIngestion }: { onOpenIngestion: () => void }) {
  const { source, hasSource, isPersisted, sourceCount } = useBook();
  const { project, isNew, saveProject } = useProject();
  const { settings } = useSettings();

  const activeEngine = settings.engines.local[0]
    ? `${settings.engines.local[0].kind} (local)`
    : `${settings.engines.cloud.provider} (cloud)`;
  const hasKey = Boolean(settings.engines.cloud.apiKey);

  const counts = {
    characters: project?.characters.length ?? 0,
    locations: project?.locations.length ?? 0,
    assets: project?.assets.length ?? 0,
    buildings: project?.buildings.length ?? 0,
    spacecraft: project?.spacecraft.length ?? 0,
  };
  const totalEntities = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="sticky top-0 z-20 border-b border-white/5 bg-[#0a0a12]/80 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-white">Cinefora</p>
            <p className="text-[11px] text-white/40">Book-to-Screen AI Pipeline</p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center gap-3">
          <div className="flex max-w-md items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white/80 hover:bg-white/10" onClick={onOpenIngestion}>
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Connect text
            </Button>
            {source && (
              <span className="hidden max-w-[200px] truncate font-mono text-[11px] text-white/50 sm:block">{source.label}</span>
            )}
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ProjectStatus project={project} isNew={isNew} onSave={saveProject} />
          {hasSource && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300">
              <BookOpen className="h-3 w-3" />
              {sourceCount > 0 ? `${sourceCount} source(s)` : isPersisted ? "Active & saved" : "Active"}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/50">
            {settings.engines.local[0] ? <Server className="h-3 w-3" /> : <Cloud className="h-3 w-3" />}
            {activeEngine}
          </span>
        </div>
      </div>
    </div>
  );
}

function ProjectStatus({ project, isNew, onSave }: { project: { name: string; characters?: unknown[]; locations?: unknown[]; assets?: unknown[]; buildings?: unknown[]; spacecraft?: unknown[]; sources?: unknown[] } | null; isNew: boolean; onSave: () => void }) {
  if (!project) return null;
  const counts = {
    characters: project.characters?.length ?? 0,
    locations: project.locations?.length ?? 0,
    assets: project.assets?.length ?? 0,
    buildings: project.buildings?.length ?? 0,
    spacecraft: project.spacecraft?.length ?? 0,
  };
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const parts = [
    { label: "Sources", value: `${project.sources?.length ?? 0}`, icon: <BookOpen className="h-3 w-3" /> },
    { label: "Entities", value: `${total}`, icon: <SparklesIcon /> },
  ];
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1">
        <span className="max-w-[120px] truncate font-sans text-xs font-medium text-white/70">{project.name}</span>
        <span className="text-white/30">·</span>
        {parts.map((p) => (
          <span key={p.label} className="hidden items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/50 sm:inline-flex">
            {p.icon} {p.value}
          </span>
        ))}
      </div>
      {isNew && (
        <button
          onClick={onSave}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <Save className="h-3 w-3" /> Save
        </button>
      )}
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
      <path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z" />
    </svg>
  );
}
