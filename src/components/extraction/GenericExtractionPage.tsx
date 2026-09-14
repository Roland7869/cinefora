import { useState } from "react";
import { Sparkles, Loader2, AlertTriangle, RotateCcw, Download } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExtractionRunner } from "@/components/extraction/ExtractionRunner";
import { ExtractionTable } from "@/components/extraction/ExtractionTable";
import { useBook } from "@/context/IngestedBookContext";
import { useSettings } from "@/context/AppSettingsContext";
import { runExtraction } from "@/lib/ai";
import { extractPrompt, parseExtraction } from "@/lib/prompts";
import type { AiResponse, ExtractionCategory, ExtractionRow } from "@/types";

interface GenericExtractionPageProps {
  category: ExtractionCategory;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  prompt: (source: { text: string } | null) => string;
}

export function GenericExtractionPage({ category, title, subtitle, icon, prompt }: GenericExtractionPageProps) {
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
      const res = await runExtraction(settings.engines, category, prompt(source));
      setResult(res);
      setRows(parseExtraction(res.content, category));
    } finally {
      setLoading(false);
    }
  };

  const exportJson = (r: ExtractionRow[]) => {
    const blob = new Blob([JSON.stringify(r, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${category}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <PageHeader title={title} subtitle={subtitle} icon={icon} />

      <ExtractionRunner
        category={category}
        loading={loading}
        result={result}
        rows={rows}
        onRun={handleRun}
        onExport={exportJson}
      />

      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="mb-4 text-sm font-semibold text-white/80">
          {category === "characters" ? "Extracted Entities" : category.charAt(0).toUpperCase() + category.slice(1)}
        </h3>
        <ExtractionTable
          category={category}
          rows={rows}
          filter={(row) => Boolean(row.name)}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>
    </div>
  );
}
