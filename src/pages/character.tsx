import { useState, type ReactNode } from "react";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExtractionRunner } from "@/components/extraction/ExtractionRunner";
import { useBook } from "@/context/IngestedBookContext";
import { useSettings } from "@/context/AppSettingsContext";
import { characterPrompt } from "@/lib/prompts";
import { runExtraction } from "@/lib/ai";
import type { AiResponse } from "@/types";

export default function CharacterPage() {
  const { source } = useBook();
  const { settings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResponse | null>(null);
  const [output, setOutput] = useState<string>("");

  const handleRun = async () => {
    if (!source) return;
    setLoading(true);
    setResult(null);
    setOutput("");
    try {
      const res = await runExtraction(settings.engines, "characters", characterPrompt(source));
      setResult(res);
      setOutput(sanitize(res.content));
    } finally {
      setLoading(false);
    }
  };

  const exportMarkdown = () => {
    const blob = new Blob([output], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "characters.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <PageHeader title="Character Extraction" subtitle="Master character sheets, Z-Image Turbo prompts, and reference systems for visual consistency." icon={<Users className="h-5 w-5" />} />

      <ExtractionRunner
        category="characters"
        loading={loading}
        result={result}
        rows={[]}
        onRun={handleRun}
        onExport={exportMarkdown}
      />

      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/80">Character Reference System</h3>
          <button
            onClick={exportMarkdown}
            disabled={!output}
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export characters.md
          </button>
        </div>
        <div className="max-h-[600px] overflow-y-auto rounded-lg border border-white/10 bg-[#0a0a12] p-4">
          {output ? (
            <MarkdownRenderer content={output} />
          ) : (
            <div className="py-16 text-center text-sm text-white/40">
              Connect a book section, then run extraction to generate the character reference system.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function sanitize(text: string): string {
  return text.replace(/```markdown\n?|```/gi, "").trim();
}

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: ReactNode[] = [];
  let inTable = false;
  let tableRows: string[] = [];

  const flushTable = () => {
    if (inTable && tableRows.length > 0) {
      const body = tableRows
        .slice(1)
        .map((row) => {
          const cells = row.split("|").filter((c) => c.trim() !== "");
          return `<tr class="border-b border-white/5 last:border-0">` + cells
            .map((c) => `<td class="px-3 py-2 text-[12px] text-white/70">${c.trim()}</td>`)
            .join("") + `</tr>`;
        })
        .join("");
      elements.push(`<table class="mb-4 w-full"><thead><tr class="border-b border-white/10">` + tableRows[0]
        .split("|")
        .filter((c) => c.trim() !== "")
        .map((c) => `<th class="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-white/40">${c.trim()}</th>`)
        .join("") + `</tr></thead><tbody>${body}</tbody></table>`);
    }
    tableRows = [];
    inTable = false;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      if (!inTable) {
        inTable = true;
        tableRows.push(trimmed);
      } else {
        tableRows.push(trimmed);
      }
      return;
    }
    flushTable();
    if (trimmed === "") {
      elements.push(<div key={idx} className="h-2" />);
      return;
    }
    if (trimmed.startsWith("# ")) {
      elements.push(<h1 key={idx} className="mb-3 text-lg font-semibold text-white">{trimmed.slice(2)}</h1>);
    } else if (trimmed.startsWith("## ")) {
      elements.push(<h2 key={idx} className="mb-2 mt-4 text-base font-semibold text-white">{trimmed.slice(3)}</h2>);
    } else if (trimmed.startsWith("### ")) {
      elements.push(<h3 key={idx} className="mb-2 mt-3 text-sm font-semibold text-white/80">{trimmed.slice(4)}</h3>);
    } else if (trimmed.startsWith("> ")) {
      elements.push(<blockquote key={idx} className="my-2 border-l-2 border-[#6366F1] pl-3 italic text-white/60">{trimmed.slice(2)}</blockquote>);
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(<li key={idx} className="ml-4 list-disc text-white/70">{renderInline(trimmed.slice(2))}</li>);
    } else if (trimmed.startsWith("1.") || trimmed.startsWith("2.") || trimmed.startsWith("3.") || trimmed.startsWith("4.")) {
      elements.push(<li key={idx} className="ml-4 list-decimal text-white/70">{renderInline(trimmed.replace(/^\d+\.\s/, ""))}</li>);
    } else {
      elements.push(<p key={idx} className="my-1 text-sm leading-relaxed text-white/70">{renderInline(trimmed)}</p>);
    }
  });
  flushTable();
  return <div className="space-y-1">{elements}</div>;
}

function renderInline(text: string): string {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts
    .map((part) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return `<strong class="font-semibold text-white">${part.slice(2, -2)}</strong>`;
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length > 1) {
        return `<em class="italic text-white/80">${part.slice(1, -1)}</em>`;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return `<code class="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px] text-[#6366F1]">${part.slice(1, -1)}</code>`;
      }
      return part;
    })
    .join("");
}
