import { useState, useMemo } from "react";
import { PenLine, Download } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExtractionRunner } from "@/components/extraction/ExtractionRunner";
import { MarkdownPreview } from "@/components/settings/MarkdownPreview";
import { Button } from "@/components/ui/button";
import { useBook } from "@/context/IngestedBookContext";
import { useSettings } from "@/context/AppSettingsContext";
import { useProject } from "@/context/ProjectContext";
import { scriptPrompt, formatScriptBeatsAsMarkdown } from "@/lib/prompts";
import { runExtraction } from "@/lib/ai";
import { parseScriptBeats } from "@/lib/entities";
import type { AiResponse, ScriptBeat } from "@/types";

export default function ScriptPage() {
  const { source } = useBook();
  const { settings } = useSettings();
  const { project, addScenes } = useProject();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResponse | null>(null);
  const [justExtracted, setJustExtracted] = useState<string[]>([]);
  const [newBeats, setNewBeats] = useState<ScriptBeat[]>([]);

  const allBeats = useMemo(() => {
    const existing = project?.scenes ?? [];
    if (newBeats.length === 0) return existing;
    const newIds = new Set(newBeats.map((b) => b.id));
    const older = existing.filter((b) => !newIds.has(b.id));
    return [...older, ...newBeats];
  }, [project?.scenes, newBeats]);

  const markdown = useMemo(() => formatScriptBeatsAsMarkdown(allBeats), [allBeats]);

  const handleRun = async () => {
    if (!source) return;
    setLoading(true);
    setResult(null);
    try {
      const lastBeat = project?.scenes?.length ? project.scenes[project.scenes.length - 1] : null;
      const res = await runExtraction(settings.engines, "characters", scriptPrompt(source, lastBeat, project?.characterFiles));
      setResult(res);
      const beats = parseScriptBeats(res.content, source);
      if (beats.length) {
        const linked = beats.map((b, i) => ({
          ...b,
          previousBeatId: i === 0 ? lastBeat?.id : beats[i - 1].id,
          continuityState: i === 0 && lastBeat
            ? `Continues from ${lastBeat.sceneHeading}: ${lastBeat.action.slice(0, 80)}…`
            : i > 0
              ? `Continues from ${beats[i - 1].sceneHeading}: ${beats[i - 1].action.slice(0, 80)}…`
              : undefined,
        }));
        addScenes(linked);
        setNewBeats(linked);
        setJustExtracted(linked.map((b) => b.id));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportMd = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "script-beats.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <PageHeader title="Script" subtitle="Dialogue scripts in 15-second visual beats, minimum 10 per chapter." icon={<PenLine className="h-5 w-5" />} />

      <ExtractionRunner
        category="characters"
        loading={loading}
        result={result}
        rows={[]}
        onRun={handleRun}
        onExport={handleExportMd}
      />

      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/80">Script Beats</h3>
          {allBeats.length > 0 && (
            <Button size="sm" variant="outline" className="border-white/10 gap-2" onClick={handleExportMd}>
              <Download className="h-4 w-4" /> Export .md
            </Button>
          )}
        </div>
        <p className="text-xs text-white/50 mb-4">Each beat is a 15-second visual beat with dialogue, location, and purpose. AI output starts as Inferred — approve to confirm.</p>
        {project?.scenes?.length ? (
          <p className="text-xs text-white/40 mb-3">{project.scenes.length} beat(s) in project. Running extraction again will enforce beat-to-beat continuity from the last beat.</p>
        ) : null}
        {justExtracted.length > 0 && (
          <p className="text-xs text-emerald-400 mb-3">{justExtracted.length} beat(s) saved to project with continuity links.</p>
        )}
      </div>

      {allBeats.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white/80">Preview</h3>
          <div className="max-h-[600px] overflow-y-auto rounded-lg border border-white/10 bg-[#0a0a12] p-4">
            <MarkdownPreview content={markdown} />
          </div>
        </div>
      )}
    </div>
  );
}
