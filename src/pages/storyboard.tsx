import { useState, useMemo } from "react";
import { Film, Download } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExtractionRunner } from "@/components/extraction/ExtractionRunner";
import { MarkdownPreview } from "@/components/settings/MarkdownPreview";
import { Button } from "@/components/ui/button";
import { useBook } from "@/context/IngestedBookContext";
import { useSettings } from "@/context/AppSettingsContext";
import { useProject } from "@/context/ProjectContext";
import { storyboardPrompt, formatStoryboardBeatsAsMarkdown } from "@/lib/prompts";
import { runExtraction } from "@/lib/ai";
import { parseStoryboardBeats } from "@/lib/entities";
import type { AiResponse, StoryboardBeat } from "@/types";

const CATEGORY = "characters" as const;

export default function StoryboardPage() {
  const { source } = useBook();
  const { settings } = useSettings();
  const { project, addStoryboards } = useProject();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResponse | null>(null);
  const [justExtracted, setJustExtracted] = useState<string[]>([]);
  const [newBeats, setNewBeats] = useState<StoryboardBeat[]>([]);

  const allBeats = useMemo(() => {
    const existing = project?.storyboards ?? [];
    if (newBeats.length === 0) return existing;
    const newIds = new Set(newBeats.map((b) => b.id));
    const older = existing.filter((b) => !newIds.has(b.id));
    return [...older, ...newBeats];
  }, [project?.storyboards, newBeats]);

  const markdown = useMemo(() => formatStoryboardBeatsAsMarkdown(allBeats), [allBeats]);

  const handleRun = async () => {
    if (!source) return;
    setLoading(true);
    setResult(null);
    try {
      const lastBeat = project?.storyboards?.length ? project.storyboards[project.storyboards.length - 1] : null;
      const res = await runExtraction(settings.engines, CATEGORY, storyboardPrompt(source, lastBeat, project?.characterFiles));
      setResult(res);
      const parsed = parseStoryboardBeats(res.content, source);
      if (parsed.length) {
        const linked = parsed.map((b, i) => ({
          ...b,
          previousBeatId: i === 0 ? lastBeat?.id : parsed[i - 1].id,
          continuityState: i === 0 && lastBeat
            ? `Shot follows from ${lastBeat.sceneHeading} — ${lastBeat.shotScale} → ${b.shotScale}`
            : i > 0
              ? `Shot follows from ${parsed[i - 1].sceneHeading} — ${parsed[i - 1].shotScale} → ${b.shotScale}`
              : undefined,
        }));
        addStoryboards(linked);
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
    a.download = "storyboard-shots.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <PageHeader title="Storyboard" subtitle="4-panel visual beats, 15-second camera progression, minimum 10 per chapter." icon={<Film className="h-5 w-5" />} />

      <ExtractionRunner
        category={CATEGORY}
        loading={loading}
        result={result}
        rows={[]}
        onRun={handleRun}
        onExport={handleExportMd}
      />

      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/80">Shot List</h3>
          {allBeats.length > 0 && (
            <Button size="sm" variant="outline" className="border-white/10 gap-2" onClick={handleExportMd}>
              <Download className="h-4 w-4" /> Export .md
            </Button>
          )}
        </div>
        {project?.storyboards?.length ? (
          <p className="text-xs text-white/40 mb-3">{project.storyboards.length} shot(s) in project. Running extraction enforces beat-to-beat continuity.</p>
        ) : null}
        {justExtracted.length > 0 && (
          <p className="text-xs text-emerald-400 mb-3">{justExtracted.length} shot(s) saved to project with continuity links.</p>
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
