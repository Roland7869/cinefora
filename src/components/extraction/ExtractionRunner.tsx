import { useMemo } from "react";
import { Sparkles, Loader2, AlertTriangle, RotateCcw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBook } from "@/context/IngestedBookContext";
import { useSettings } from "@/context/AppSettingsContext";
import { extractPrompt, parseExtraction, sanitizeAiResponse } from "@/lib/prompts";
import type { AiResponse, ExtractionCategory, ExtractionRow } from "@/types";

interface ExtractionRunnerProps {
  category: ExtractionCategory;
  loading: boolean;
  result: AiResponse | null;
  rows: ExtractionRow[];
  onRun: () => void;
  onExport: (data: unknown) => void;
}

function friendlyError(result: AiResponse): string | null {
  if (!result.error) return null;
  const msg = result.error.toLowerCase();
  if (msg.includes("invalid api key") || msg.includes("401") || msg.includes("unauthorized")) {
    return "Invalid API key. Check your key in Settings → AI Engines.";
  }
  if (msg.includes("429") || msg.includes("rate limit")) {
    return "Rate limited. Wait a moment and try again.";
  }
  if (msg.includes("timeout") || msg.includes("abort")) {
    return "Request timed out. Try a shorter text section or a faster model.";
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return "Network error. Check your internet connection.";
  }
  if (msg.includes("500") || msg.includes("502") || msg.includes("503")) {
    return "Provider server error. Try again in a moment.";
  }
  return result.error;
}

export function ExtractionRunner({ category, loading, result, rows, onRun, onExport }: ExtractionRunnerProps) {
  const { source } = useBook();
  const { settings } = useSettings();

  const rawView = useMemo(() => (result ? sanitizeAiResponse(result.content) : ""), [result]);
  const parsedRows = useMemo(() => (result ? parseExtraction(rawView, category) : []), [rawView, category, result]);
  const errorMsg = useMemo(() => (result ? friendlyError(result) : null), [result]);

  return (
    <Card className="overflow-hidden border-white/10 bg-white/5">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-[#6366F1]/15 text-[#6366F1]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Run Extraction</CardTitle>
              <CardDescription>Feed the active book section to your configured AI engine.</CardDescription>
            </div>
          </div>
          <Button size="sm" onClick={onRun} disabled={loading || result !== null || !source}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />}
            {loading ? "Running…" : "Run"}
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-white/10 px-2 py-1 font-mono text-white/70">
            {settings.engines.local[0]
              ? `${settings.engines.local[0].kind} (local) · ${settings.engines.local[0].baseUrl}`
              : `${settings.engines.cloud.provider} · ${settings.engines.cloud.apiKey ? "key set" : "no key"}`}
          </span>
          {source && <span className="rounded-full bg-white/10 px-2 py-1 font-mono text-white/70">{source.label}</span>}
          {!source && <span className="rounded-full bg-amber-500/10 px-2 py-1 text-amber-300">No active text — connect a book section first.</span>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {result && (
          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] text-white/40">
                {result.error ? "Request failed" : `Engine: ${result.engine} · Model: ${result.model} · ${result.elapsedMs}ms`}
              </span>
              <Button size="xs" variant="outline" className="border-white/10 text-[11px] hover:bg-white/10" onClick={() => onExport(parsedRows)}>
                <Download className="mr-1.5 h-3 w-3" /> Export JSON ({parsedRows.length})
              </Button>
            </div>
            {errorMsg && (
              <div className="mb-2 flex items-start gap-2 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-300">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {errorMsg}
              </div>
            )}
            <pre className="max-h-64 overflow-auto rounded-md bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-white/80">{rawView}</pre>
          </div>
        )}

        {!result && !loading && (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-white/15 p-6 text-center text-sm text-white/40">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Click Run to extract entries from your ingested text.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
