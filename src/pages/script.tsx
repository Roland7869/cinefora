import { useState } from "react";
import { PenLine } from "lucide-react";
import { PageHeader, RunExtractionButton } from "@/components/layout/PageHeader";
import { ExtractionRunner } from "@/components/extraction/ExtractionRunner";
import { ExtractionTable } from "@/components/extraction/ExtractionTable";
import { useBook } from "@/context/IngestedBookContext";
import { useSettings } from "@/context/AppSettingsContext";
import { scriptPrompt } from "@/lib/prompts";
import { runExtraction } from "@/lib/ai";
import type { AiResponse, ExtractionCategory, ExtractionRow } from "@/types";

const CATEGORY: ExtractionCategory = "characters";

export default function ScriptPage() {
  const { source } = useBook();
  const { settings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResponse | null>(null);
  const [rows, setRows] = useState<ExtractionRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("");

  const handleRun = async () => {
    if (!source) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await runExtraction(settings.engines, CATEGORY, scriptPrompt(source));
      setResult(res);
      setRows(parseScript(res.content));
    } finally {
      setLoading(false);
    }
  };

  const exportJson = (r: ExtractionRow[]) => {
    const blob = new Blob([JSON.stringify(r, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "script-scenes.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <PageHeader title="Script" subtitle="Scene breakdown, dialogue formatting, and act structuring." icon={<PenLine className="h-5 w-5" />} />

      <ExtractionRunner
        category={CATEGORY}
        loading={loading}
        result={result}
        rows={rows}
        onRun={handleRun}
        onExport={exportJson}
      />

      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="mb-4 text-sm font-semibold text-white/80">Extracted Scenes</h3>
        <ExtractionTable
          category={CATEGORY}
          rows={rows}
          filter={(row) => Boolean(row.sceneHeading || row.action || row.dialogue)}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>
    </div>
  );
}

function parseScript(text: string): ExtractionRow[] {
  const cleaned = text.replace(/```json\n?|```/gi, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.scenes) ? parsed.scenes : [parsed];
    return arr.map((item: Record<string, unknown>, i: number) => ({
      id: String(item.id ?? `scene-${i + 1}`),
      name: String(item.sceneHeading ?? item.location ?? `Scene ${i + 1}`),
      look: "",
      form: "",
      size: "",
      function: "",
      role: "",
      traits: "",
      details: JSON.stringify({
        act: item.act,
        location: item.location,
        characters: item.characters,
        action: item.action,
        dialogue: item.dialogue,
      }),
    }));
  } catch {
    return [];
  }
}
