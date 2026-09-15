import { useState } from "react";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExtractionRunner } from "@/components/extraction/ExtractionRunner";
import { EntityReviewPanel } from "@/components/entities/EntityReviewPanel";
import { useBook } from "@/context/IngestedBookContext";
import { useSettings } from "@/context/AppSettingsContext";
import { useProject } from "@/context/ProjectContext";
import { characterPrompt } from "@/lib/prompts";
import { runExtraction } from "@/lib/ai";
import { parseExtraction } from "@/lib/prompts";
import { parseEntitiesToReviewed } from "@/lib/entities";
import type { AiResponse, ExtractionCategory, ExtractionRow } from "@/types";

export default function CharacterPage() {
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
      const res = await runExtraction(settings.engines, "characters", characterPrompt(source));
      setResult(res);
      setRows(parseExtraction(res.content, "characters"));
      const entities = parseEntitiesToReviewed(res.content, source, "characters");
      if (entities.length) {
        addEntities("characters", entities);
        setJustExtracted(entities.map((e) => e.id));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <PageHeader title="Character Extraction" subtitle="Master character sheets, Z-Image Turbo prompts, and reference systems for visual consistency." icon={<Users className="h-5 w-5" />} />

      <ExtractionRunner
        category="characters"
        loading={loading}
        result={result}
        rows={rows}
        onRun={handleRun}
        onExport={(r) => {
          const blob = new Blob([JSON.stringify(r, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "characters.json";
          a.click();
          URL.revokeObjectURL(url);
        }}
      />

      <EntityReviewPanel
        category="characters"
        title="Character Extraction"
        subtitle="Master character sheets with visual-consistency prompts. AI output starts as *Inferred* — approve to confirm."
        icon={<Users className="h-5 w-5" />}
        justExtracted={justExtracted}
      />
    </div>
  );
}
