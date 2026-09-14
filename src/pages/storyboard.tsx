import { useState } from "react";
import { Film } from "lucide-react";
import { PageHeader, RunExtractionButton } from "@/components/layout/PageHeader";
import { ExtractionRunner } from "@/components/extraction/ExtractionRunner";
import { ExtractionTable } from "@/components/extraction/ExtractionTable";
import { useBook } from "@/context/IngestedBookContext";
import { useSettings } from "@/context/AppSettingsContext";
import { storyboardPrompt } from "@/lib/prompts";
import { runExtraction } from "@/lib/ai";
import type { AiResponse, ExtractionCategory, ExtractionRow } from "@/types";

const CATEGORY: ExtractionCategory = "characters";

export default function StoryboardPage() {
  const { source } = useBook();
  const { settings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResponse | null>(null);
  const [rows, setRows] = useState<ExtractionRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<keyof ExtractionRow>("");

  const handleRun = async () => {
    if (!source) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await runExtraction(settings.engines, CATEGORY, storyboardPrompt(source));
      setResult(res);
      setRows(parseStoryboard(res.content));
    } finally {
      setLoading(false);
    }
  };

  const exportJson = (r: ExtractionRow[]) => {
    const blob = new Blob([JSON.stringify(r, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "storyboard-shots.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <PageHeader title="Storyboard" subtitle="Keyframe shot list, visual prompt builder, and camera movement specs." icon={<Film className="h-5 w-5" />} />

      <ExtractionRunner
        category={CATEGORY}
        loading={loading}
        result={result}
        rows={rows}
        onRun={handleRun}
        onExport={exportJson}
      />

      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="mb-4 text-sm font-semibold text-white/80">Shot List</h3>
        <ExtractionTable
          category={CATEGORY}
          rows={rows}
          filter={(row) => Boolean(row.visualPrompt || row.subject || row.movement)}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>
    </div>
  );
}

function parseStoryboard(text: string): ExtractionRow[] {
  const cleaned = text.replace(/```json\n?|```/gi, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.shots) ? parsed.shots : [parsed];
    return arr.map((item: Record<string, unknown>, i: number) => ({
      id: String(item.id ?? `shot-${i + 1}`),
      name: String(item.visualPrompt ?? item.subject ?? `Shot ${i + 1}`),
      look: "",
      form: "",
      size: "",
      function: "",
      role: "",
      traits: "",
      details: JSON.stringify({ shotNumber: item.shotNumber, angle: item.angle, movement: item.movement, subject: item.subject, duration: item.duration }),
    }));
  } catch {
    return [];
  }
}
