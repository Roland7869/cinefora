import { useState } from "react";
import { Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExtractionRunner } from "@/components/extraction/ExtractionRunner";
import { EntityReviewPanel } from "@/components/entities/EntityReviewPanel";
import { useBook } from "@/context/IngestedBookContext";
import { useSettings } from "@/context/AppSettingsContext";
import { useProject } from "@/context/ProjectContext";
import { runExtraction } from "@/lib/ai";
import { extractPrompt } from "@/lib/prompts";
import { parseEntitiesToReviewed } from "@/lib/entities";
import type { AiResponse, ExtractionCategory, ExtractionRow, ReviewedEntity } from "@/types";

function toRow(e: ReviewedEntity): ExtractionRow {
  return {
    id: e.id,
    name: e.name,
    look: e.look,
    form: e.form,
    size: e.size,
    function: e.function,
    role: e.role,
    traits: e.traits,
    details: e.details,
  };
}

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
  const [status, setStatus] = useState<{ kind: "ok" | "warn"; message: string } | null>(null);

  const handleRun = async () => {
    if (!source) return;
    setLoading(true);
    setResult(null);
    setStatus(null);
    try {
      const res = await runExtraction(settings.engines, category, prompt(source));
      setResult(res);
      if (res.error) {
        setStatus({ kind: "warn", message: `Extraction failed: ${res.error}` });
        return;
      }
      const entities = parseEntitiesToReviewed(res.content, source, category);
      setRows(entities.length ? entities.map(toRow) : []);
      if (entities.length) {
        // Create reviewed entities (status: inferred) with provenance, so AI
        // output never silently becomes canonical project data.
        addEntities(category, entities);
        setJustExtracted(entities.map((e) => e.id));
        setStatus({ kind: "ok", message: `${entities.length} ${LABELS[category].toLowerCase()} extracted and saved to project.` });
      } else {
        setStatus({
          kind: "warn",
          message:
            "The AI response could not be parsed as structured JSON. Check the raw output below — if it is prose or Markdown, try running again or switching to a model that follows JSON instructions.",
        });
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
          const lines: string[] = [`# ${title}\n`];
          for (const row of r) {
            lines.push(`## ${row.name ?? "Unnamed"}`);
            if (row.look) lines.push(`**Look:** ${row.look}`);
            if (row.form) lines.push(`**Form:** ${row.form}`);
            if (row.size) lines.push(`**Size:** ${row.size}`);
            if (row.function) lines.push(`**Function:** ${row.function}`);
            if (row.role) lines.push(`**Role:** ${row.role}`);
            if (row.traits) lines.push(`**Traits:** ${row.traits}`);
            if (row.details) lines.push(`**Details:** ${row.details}`);
            lines.push("");
            lines.push("---\n");
          }
          const content = lines.join("\n");
          const blob = new Blob([content], { type: "text/markdown" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${category}.md`;
          a.click();
          URL.revokeObjectURL(url);
        }}
      />

      {status && (
        <div
          className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
            status.kind === "ok"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-amber-500/30 bg-amber-500/10 text-amber-300"
          }`}
        >
          {status.kind === "ok" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          {status.message}
        </div>
      )}

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
