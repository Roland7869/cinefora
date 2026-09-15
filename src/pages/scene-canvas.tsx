import { useEffect, useState, type ReactNode } from "react";
import { LayoutGrid, Users, Package, Trash2, Plus, ArrowLeftRight, ArrowUpDown, Save } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { useBook } from "@/context/IngestedBookContext";
import { sceneCanvasPrompt, scriptPrompt } from "@/lib/prompts";
import { runExtraction } from "@/lib/ai";
import { useSettings } from "@/context/AppSettingsContext";
import { useProject } from "@/context/ProjectContext";
import type { CanvasActor, ExtractionCategory, ExtractionRow, SceneCanvas } from "@/types";

const GRID = 8;
const COLORS = ["#6366F1", "#22d3ee", "#f472b6", "#fbbf24", "#34d399", "#a78bfa"];
const STAGE_BG = "https://images.unsplash.com/photo-1519638399135-1491ac152928?auto=format&fit=crop&w=1600&q=80";

function newCanvasId(): string {
  return `canvas-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function SceneCanvasPage() {
  const { source } = useBook();
  const { settings } = useSettings();
  const { project, updateSceneCanvas } = useProject();

  // Use the first scene canvas from the project, or create a blank one.
  const saved = project?.sceneCanvases?.[0];
  const [canvasId, setCanvasId] = useState(saved?.id ?? newCanvasId());
  const [actors, setActors] = useState<CanvasActor[]>(saved?.actors ?? []);
  const [selected, setSelected] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<{ running: boolean; done: boolean }>({ running: false, done: false });
  const [output, setOutput] = useState(saved?.generatedOutput ?? "");

  // Persist canvas state back to the project on every meaningful change.
  const persistCanvas = (nextActors: CanvasActor[], nextOutput: string) => {
    const canvas: SceneCanvas = {
      id: canvasId,
      name: "Scene Canvas",
      actors: nextActors,
      generatedOutput: nextOutput,
      createdAt: saved?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    updateSceneCanvas(canvas);
  };

  const handleSeed = async () => {
    if (!source) return;
    setExtraction((e) => ({ ...e, running: true }));
    try {
      const res = await runExtraction(settings.engines, "characters", scriptPrompt(source));
      const rows = parseScenes(res.content).slice(0, 6);
      const nextActors: CanvasActor[] = rows.map((row, i) => ({
        id: row.id,
        name: row.name,
        type: "character",
        x: ((i % GRID) / GRID) * 100,
        y: Math.floor((i / GRID) / GRID) * 100,
        color: COLORS[i % COLORS.length],
      }));
      setActors(nextActors);
      persistCanvas(nextActors, output);
    } finally {
      setExtraction((e) => ({ ...e, running: false, done: true }));
    }
  };

  const handleGenerateCanvas = async () => {
    if (!source) return;
    setExtraction((e) => ({ ...e, running: true }));
    try {
      const res = await runExtraction(settings.engines, "characters", sceneCanvasPrompt(source));
      const nextOutput = sanitize(res.content);
      setOutput(nextOutput);
      persistCanvas(actors, nextOutput);
    } finally {
      setExtraction((e) => ({ ...e, running: false, done: true }));
    }
  };

  const addActor = (type: "character" | "object") => {
    const count = actors.length;
    const actor: CanvasActor = {
      id: `${type}-${Date.now()}`,
      name: `${type === "character" ? "Character" : "Object"} ${count + 1}`,
      type,
      x: 12 + (count % 3) * 25,
      y: 12 + Math.floor(count / 3) * 25,
      color: COLORS[count % COLORS.length],
    };
    const next = [...actors, actor];
    setActors(next);
    setSelected(actor.id);
    persistCanvas(next, output);
  };

  const moveActor = (id: string, dx: number, dy: number) => {
    const next = actors.map((act) => (act.id === id ? { ...act, x: Math.min(92, Math.max(4, act.x + dx)), y: Math.min(92, Math.max(4, act.y + dy)) } : act));
    setActors(next);
    persistCanvas(next, output);
  };

  const removeActor = (id: string) => {
    const next = actors.filter((act) => act.id !== id);
    setActors(next);
    persistCanvas(next, output);
  };

  const handleSave = () => {
    persistCanvas(actors, output);
  };

  const handleNewCanvas = () => {
    const id = newCanvasId();
    setCanvasId(id);
    setActors([]);
    setOutput("");
    setSelected(null);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <PageHeader title="Scene Canvas" subtitle="Interactive spatial blocking + high-fidelity canvas prompt generation." icon={<LayoutGrid className="h-5 w-5" />} />

      <div className="flex items-center gap-2 text-xs text-white/50">
        <span className="rounded-full bg-white/10 px-2 py-1 font-mono">
          {actors.length} actor(s) · {output ? "Canvas generated" : "No canvas"}
        </span>
        <Button size="xs" variant="outline" className="border-white/10" onClick={handleNewCanvas}>
          New canvas
        </Button>
        <Button size="xs" variant="outline" className="border-white/10" onClick={handleSave}>
          <Save className="mr-1 h-3 w-3" /> Save
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <aside className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-3 text-sm font-semibold text-white/80">Blocking</h3>
            <div className="space-y-2">
              <Button onClick={() => addActor("character")} className="w-full justify-start gap-2"><Users className="h-4 w-4" /> Add character</Button>
              <Button variant="outline" onClick={() => addActor("object")} className="w-full justify-start gap-2 border-white/10"><Package className="h-4 w-4" /> Add object</Button>
            </div>

            <div className="mt-4 space-y-2">
              {actors.map((act) => (
                <div key={act.id} className={selected === act.id ? "rounded-lg border border-[#6366F1]/50 bg-[#6366F1]/10" : "rounded-lg border border-white/10 bg-white/[0.03]"}>
                  <button onClick={() => setSelected(act.id)} className="flex w-full items-center justify-between px-3 py-2 text-left">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: act.color }} />
                      <span className="text-sm text-white/80">{act.name}</span>
                    </span>
                    <button onClick={() => removeActor(act.id)} className="text-white/30 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                  </button>
                  <div className="flex gap-1 px-3 pb-2 pt-0">
                    <button onClick={() => moveActor(act.id, 5, 0)} className="flex-1 rounded px-1 py-1 text-white/40 hover:bg-white/10 hover:text-white"><ArrowLeftRight className="h-3.5 w-3.5" /></button>
                    <button onClick={() => moveActor(act.id, -5, 0)} className="flex-1 rounded px-1 py-1 text-white/40 hover:bg-white/10 hover:text-white"><ArrowLeftRight className="h-3.5 w-3.5 rotate-180" /></button>
                    <button onClick={() => moveActor(act.id, 0, 5)} className="flex-1 rounded px-1 py-1 text-white/40 hover:bg-white/10 hover:text-white"><ArrowUpDown className="h-3.5 w-3.5" /></button>
                    <button onClick={() => moveActor(act.id, 0, -5)} className="flex-1 rounded px-1 py-1 text-white/40 hover:bg-white/10 hover:text-white"><ArrowUpDown className="h-3.5 w-3.5 rotate-180" /></button>
                  </div>
                </div>
              ))}
              {actors.length === 0 && <p className="px-3 py-4 text-center text-xs text-white/40">No actors placed yet.</p>}
            </div>
          </div>
        </aside>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white/80">Stage Grid ({GRID}×{GRID})</h3>
              <p className="text-xs text-white/40">Click arrows to reposition. Click an actor to select.</p>
            </div>
            <Button size="sm" onClick={handleSeed} disabled={extraction.running}>
              {extraction.running ? (
                <span className="h-4 w-4 animate-spin"><svg viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></span>
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {extraction.running ? "Extracting…" : "Seed from text"}
            </Button>
          </div>

          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-white/10">
            <img src={STAGE_BG} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
            <div className="pointer-events-none absolute inset-0 bg-[#0a0a12]/40" />
            <div className="pointer-events-none absolute inset-0 grid grid-cols-8 grid-rows-8 gap-px opacity-30">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className="border border-white/10" />
              ))}
            </div>
            {actors.map((act) => (
              <button
                key={act.id}
                onClick={() => setSelected(act.id)}
                style={{ left: `${act.x}%`, top: `${act.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 transition-all hover:z-10"
              >
                <div className={`flex size-9 items-center justify-center rounded-full shadow-lg ${act.type === "object" ? "border-2 border-dashed" : ""}`} style={{ backgroundColor: act.color, borderColor: act.color }}>
                  <span className="text-xs font-bold text-white">{act.name[0]}</span>
                </div>
                <span className="mt-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/80 whitespace-nowrap">{act.name}</span>
              </button>
            ))}
            {actors.length === 0 && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-white/30">Place actors on the stage to begin blocking.</div>
            )}
          </div>

          {source && (
            <div className="mt-4 max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-black/30 p-3 font-mono text-[11px] text-white/60">
              {source.text.slice(0, 500)}
              {source.text.length > 500 && "…"}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white/80">Scene Canvas Generation</h3>
              <p className="text-xs text-white/40">Generate high-fidelity canvas prompts with environmental geometry, props, and spatial geography.</p>
            </div>
            <Button size="sm" onClick={handleGenerateCanvas} disabled={extraction.running || !source}>
              {extraction.running ? (
                <span className="h-4 w-4 animate-spin"><svg viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></span>
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {extraction.running ? "Generating…" : "Generate Canvas"}
            </Button>
          </div>
          <div className="max-h-[400px] overflow-y-auto rounded-lg border border-white/10 bg-[#0a0a12] p-4">
            {output ? (
              <SceneCanvasRenderer content={output} />
            ) : (
              <div className="py-12 text-center text-sm text-white/40">
                Connect a book section, then generate the scene canvas to produce high-fidelity canvas prompts.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function sanitize(text: string): string {
  return text.replace(/```markdown\n?|```/gi, "").trim();
}

function SceneCanvasRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: ReactNode[] = [];
  let inTable = false;
  let tableRows: string[] = [];

  const flushTable = () => {
    if (inTable && tableRows.length > 0) {
      const body = tableRows
        .slice(1)
        .map((row) => {
          const cells = row.split("|").filter((c) => c.trim() !== "");
          return `<tr class="border-b border-white/5 last:border-0">` + cells
            .map((c) => `<td class="px-3 py-2 text-[12px] text-white/70">${c.trim()}</td>`)
            .join("") + `</tr>`;
        })
        .join("");
      elements.push(`<table class="mb-4 w-full"><thead><tr class="border-b border-white/10">` + tableRows[0]
        .split("|")
        .filter((c) => c.trim() !== "")
        .map((c) => `<th class="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-white/40">${c.trim()}</th>`)
        .join("") + `</tr></thead><tbody>${body}</tbody></table>`);
    }
    tableRows = [];
    inTable = false;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      if (!inTable) {
        inTable = true;
        tableRows.push(trimmed);
      } else {
        tableRows.push(trimmed);
      }
      return;
    }
    flushTable();
    if (trimmed === "") {
      elements.push(<div key={idx} className="h-2" />);
      return;
    }
    if (trimmed.startsWith("# ")) {
      elements.push(<h1 key={idx} className="mb-3 text-lg font-semibold text-white">{trimmed.slice(2)}</h1>);
    } else if (trimmed.startsWith("## ")) {
      elements.push(<h2 key={idx} className="mb-2 mt-4 text-base font-semibold text-white">{trimmed.slice(3)}</h2>);
    } else if (trimmed.startsWith("### ")) {
      elements.push(<h3 key={idx} className="mb-2 mt-3 text-sm font-semibold text-white/80">{trimmed.slice(4)}</h3>);
    } else if (trimmed.startsWith("> ")) {
      elements.push(<blockquote key={idx} className="my-2 border-l-2 border-[#6366F1] pl-3 italic text-white/60">{trimmed.slice(2)}</blockquote>);
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(<li key={idx} className="ml-4 list-disc text-white/70">{renderInline(trimmed.slice(2))}</li>);
    } else if (trimmed.startsWith("1.") || trimmed.startsWith("2.") || trimmed.startsWith("3.") || trimmed.startsWith("4.")) {
      elements.push(<li key={idx} className="ml-4 list-decimal text-white/70">{renderInline(trimmed.replace(/^\d+\.\s/, ""))}</li>);
    } else {
      elements.push(<p key={idx} className="my-1 text-sm leading-relaxed text-white/70">{renderInline(trimmed)}</p>);
    }
  });
  flushTable();
  return <div className="space-y-1">{elements}</div>;
}

function renderInline(text: string): string {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts
    .map((part) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return `<strong class="font-semibold text-white">${part.slice(2, -2)}</strong>`;
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length > 1) {
        return `<em class="italic text-white/80">${part.slice(1, -1)}</em>`;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return `<code class="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px] text-[#6366F1]">${part.slice(1, -1)}</code>`;
      }
      return part;
    })
    .join("");
}

function parseScenes(text: string): ExtractionRow[] {
  const cleaned = text.replace(/```json\n?|```/gi, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.scenes) ? parsed.scenes : [parsed];
    return arr.map((item: Record<string, unknown>, i: number) => ({
      id: String(item.id ?? `scene-${i + 1}`),
      name: String(item.sceneHeading ?? item.location ?? `Scene ${i + 1}`),
      look: "", form: "", size: "", function: "", role: "", traits: "",
      details: JSON.stringify({ act: item.act, characters: item.characters, action: item.action }),
    }));
  } catch {
    return [];
  }
}
