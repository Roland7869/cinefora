import { useState } from "react";
import { Film } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExtractionRunner } from "@/components/extraction/ExtractionRunner";
import { ExtractionTable } from "@/components/extraction/ExtractionTable";
import { useBook } from "@/context/IngestedBookContext";
import { useSettings } from "@/context/AppSettingsContext";
import { useProject } from "@/context/ProjectContext";
import { storyboardPrompt } from "@/lib/prompts";
import { runExtraction } from "@/lib/ai";
import { parseStoryboardBeats } from "@/lib/entities";
import type { AiResponse, ExtractionCategory, ExtractionRow } from "@/types";

const CATEGORY: ExtractionCategory = "characters";

export default function StoryboardPage() {
  const { source } = useBook();
  const { settings } = useSettings();
  const { project, addStoryboards } = useProject();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResponse | null>(null);
  const [rows, setRows] = useState<ExtractionRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [savedCount, setSavedCount] = useState(0);

  const handleRun = async () => {
    if (!source) return;
    setLoading(true);
    setResult(null);
    try {
      const lastBeat = project?.storyboards?.length ? project.storyboards[project.storyboards.length - 1] : null;
      const res = await runExtraction(settings.engines, CATEGORY, storyboardPrompt(source, lastBeat));
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
        setRows(parsed.map((b) => ({
          id: b.id,
          name: b.primaryFocus,
          look: "",
          form: "",
          size: "",
          function: "",
          role: "",
          traits: "",
          details: JSON.stringify({
            act: b.act,
            location: b.location,
            time_of_day: b.timeOfDay,
            shot_scale: b.shotScale,
            camera_movement: b.cameraMovement,
            panels: b.panels,
            lighting: b.lighting,
            movement: b.movement,
          }),
        })));
        setSavedCount(linked.length);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <PageHeader title="Storyboard" subtitle="4-panel visual beats, 15-second camera progression, minimum 10 per chapter." icon={<Film className="h-5 w-5" />} />

      <ExtractionRunner
        category={CATEGORY}
        loading={loading}
        result={result}
        rows={rows}
        onRun={handleRun}
        onExport={(r) => {
          const blob = new Blob([JSON.stringify(r, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "storyboard-shots.json";
          a.click();
          URL.revokeObjectURL(url);
        }}
      />

      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="mb-4 text-sm font-semibold text-white/80">Shot List</h3>
        {project?.storyboards?.length ? (
          <p className="text-xs text-white/40 mb-3">{project.storyboards.length} shot(s) in project. Running extraction enforces beat-to-beat continuity.</p>
        ) : null}
        {savedCount > 0 && (
          <p className="text-xs text-emerald-400 mb-3">{savedCount} shot(s) saved to project with continuity links.</p>
        )}
        <ExtractionTable
          category={CATEGORY}
          rows={rows}
          filter={(row) => Boolean(row.details || row.name)}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>
    </div>
  );
}
