import { useMemo } from "react";

// Minimal, dependency-free Markdown → HTML renderer for local content.
// Handles the common subset used in prompt docs: headings, bold/italic,
// inline code, code blocks, links, lists, blockquotes, and paragraphs.
// Output is escaped to prevent XSS (content is authored locally).

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderInline(text: string): string {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, '<code class="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.9em] text-[#6366F1]">$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[#6366F1] underline">$1</a>');
  return out;
}

function renderBlock(markdown: string): string {
  const lines = markdown.split("\n");
  const html: string[] = [];
  let i = 0;
  let inList = false;
  let listType = "";

  const flushList = () => {
    if (inList) {
      html.push(`</${listType}>`);
      inList = false;
    }
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushList();
      const level = heading[1].length;
      html.push(`<h${level} class="mb-3 mt-4 text-lg font-semibold text-white last:mb-0">${renderInline(heading[2])}</h${level}>`);
      i++;
      continue;
    }

    const codeBlock = trimmed.match(/^```(\w*)\n([\s\S]*?)```$/);
    if (codeBlock) {
      flushList();
      const lang = codeBlock[1] || "text";
      const cls =
        lang === "js" || lang === "javascript"
          ? "text-amber-300"
          : lang === "json"
          ? "text-emerald-300"
          : lang === "md" || lang === "markdown"
          ? "text-sky-300"
          : "text-white/80";
      html.push(`<pre class="my-3 overflow-x-auto rounded-lg bg-black/40 p-4"><code class="font-mono text-xs ${cls}">${escapeHtml(codeBlock[2])}</code></pre>`);
      i += codeBlock[0].split("\n").length - 1;
      continue;
    }

    const blockquote = trimmed.match(/^&gt;\s?(.*)$/);
    if (blockquote) {
      flushList();
      html.push(`<blockquote class="my-3 border-l-2 border-[#6366F1] pl-4 italic text-white/60">${renderInline(blockquote[1])}</blockquote>`);
      i++;
      continue;
    }

    const unordered = trimmed.match(/^[-*+]\s+(.*)$/);
    if (unordered) {
      if (!inList || listType !== "ul") {
        flushList();
        html.push("<ul class=\"my-2 list-disc space-y-1 pl-6\">");
        inList = true;
        listType = "ul";
      }
      html.push(`<li class="text-white/70">${renderInline(unordered[1])}</li>`);
      i++;
      continue;
    }

    const ordered = trimmed.match(/^\d+\.\s+(.*)$/);
    if (ordered) {
      if (!inList || listType !== "ol") {
        flushList();
        html.push("<ol class=\"my-2 list-decimal space-y-1 pl-6\">");
        inList = true;
        listType = "ol";
      }
      html.push(`<li class="text-white/70">${renderInline(ordered[1])}</li>`);
      i++;
      continue;
    }

    if (trimmed === "---" || trimmed === "***") {
      flushList();
      html.push("<hr class='my-4 border-white/10'>");
      i++;
      continue;
    }

    flushList();
    html.push(`<p class="mb-3 text-white/70 last:mb-0">${renderInline(trimmed)}</p>`);
    i++;
  }
  flushList();
  return html.join("\n");
}

export function MarkdownPreview({ content }: { content: string }) {
  const html = useMemo(() => renderBlock(content), [content]);
  return <div className="prose-safe" dangerouslySetInnerHTML={{ __html: html }} />;
}
