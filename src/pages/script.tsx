import { useState } from "react";
import { PenLine } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExtractionRunner } from "@/components/extraction/ExtractionRunner";
import { useBook } from "@/context/IngestedBookContext";
import { useSettings } from "@/context/AppSettingsContext";
import { useProject } from "@/context/ProjectContext";
import { scriptPrompt } from "@/lib/prompts";
import { runExtraction } from "@/lib/ai";
import { parseScriptBeats } from "@/lib/entities";
import type { AiResponse } from "@/types";

export default function ScriptPage() {
  const { source } = useBook();
  const { settings } = useSettings();
  const { project, addScenes } = useProject();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResponse | null>(null);
  const [justExtracted, setJustExtracted] = useState<string[]>([]);

  const handleRun = async () => {
    if (!source) return;
    setLoading(true);
    setResult(null);
    try {
      // Pass the last existing beat for beat-to-beat continuity.
      const lastBeat = project?.scenes?.length ? project.scenes[project.scenes.length - 1] : null;
      const res = await runExtraction(settings.engines, "characters", scriptPrompt(source, lastBeat));
      setResult(res);
      const beats = parseScriptBeats(res.content, source);
      if (beats.length) {
        // Stamp continuity links on the new beats.
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
        setJustExtracted(linked.map((b) => b.id));
      }
    } finally {
      setLoading(false);
    }
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
        onExport={(r) => {
          const blob = new Blob([JSON.stringify(r, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "script-scenes.json";
          a.click();
          URL.revokeObjectURL(url);
        }}
      />

      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="mb-4 text-sm font-semibold text-white/80">Script Beats</h3>
        <p className="text-xs text-white/50 mb-4">Each beat is a 15-second visual beat with dialogue, location, and purpose. AI output starts as Inferred — approve to confirm.</p>
        {project?.scenes?.length ? (
          <p className="text-xs text-white/40 mb-3">{project.scenes.length} beat(s) in project. Running extraction again will enforce beat-to-beat continuity from the last beat.</p>
        ) : null}
        {justExtracted.length > 0 && (
          <p className="text-xs text-emerald-400 mb-3">{justExtracted.length} beat(s) saved to project with continuity links.</p>
        )}
      </div>
    </div>
  );
}
