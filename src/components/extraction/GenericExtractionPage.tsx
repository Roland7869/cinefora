import { useState } from "react";
import { Sparkles, Loader2, AlertTriangle, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExtractionRunner } from "@/components/extraction/ExtractionRunner";
import { EntityReviewPanel } from "@/components/entities/EntityReviewPanel";
import { useBook } from "@/context/IngestedBookContext";
import { useSettings } from "@/context/AppSettingsContext";
import { useProject } from "@/context/ProjectContext";
import { runExtraction } from "@/lib/ai";
import { extractPrompt, parseExtraction } from "@/lib/prompts";
import { parseEntitiesToReviewed } from "@/lib/entities";
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
  const { addEntities } = useProject();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResponse | null>(null);
  const [rows, setRows] = useState<ExtractionRow[]>([]);
  const [justExtracted, setJustExtracted] = useState<string[]>([]);

  const handleRun = async () => {
    if (!source) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await runExtraction(settings.engines, category, prompt(source));
      setResult(res);
      setRows(parseExtraction(res.content, category));
      // Create reviewed entities (status: inferred) with provenance, so AI
      // output never silently becomes canonical project data.
      const entities = parseEntitiesToReviewed(res.content, source, category);
      if (entities.length) {
        addEntities(category, entities);
        setJustExtracted(entities.map((e) => e.id));
      }
    } finally {
      setLoading(false);
    }
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
        onExport={(r) => {
          const blob = new Blob([JSON.stringify(r, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${category}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }}
      />

      <EntityReviewPanel
        category={category}
        title={title}
        subtitle={
          category === "characters"
            ? "Master character sheets with visual-consistency prompts. AI output starts as *Inferred* — approve to confirm."
            : `Extracted ${LABELS[category]}. AI output starts as *Inferred* — approve to confirm.`
        }
        icon={<Sparkles className="h-5 w-5" />}
        justExtracted={justExtracted}
      />
    </div>
  );
}

const LABELS: Record<ExtractionCategory, string> = {
  characters: "Characters",
  assets: "Assets",
  locations: "Locations",
  buildings: "Buildings",
  spacecraft: "Spacecraft",
};
