import { useMemo, useRef, useState } from "react";
import { BookOpen, Search, Plus, Trash2, X, Sparkles, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { PromptLibraryCard } from "@/components/library/PromptLibraryCard";
import { useSettings } from "@/context/AppSettingsContext";
import { cn } from "@/lib/utils";
import type { PromptLibraryDoc } from "@/types";

const CATEGORIES = ["Video Prompt Engines", "Image Prompt Engines", "Camera Control", "Lighting & Physics"] as const;
type Category = (typeof CATEGORIES)[number];

const SAMPLE_DOCS: PromptLibraryDoc[] = [
  {
    id: "runway-gen3",
    title: "Runway Gen-3 — Motion Prompt Engine",
    category: "Video Prompt Engines",
    content: "# Runway Gen-3\n\nPositive: cinematic wide shot, a lone astronaut walking across a frozen alien plain, indigo rim lighting, slow dolly forward, 24fps, film grain.\n\nNegative: static, blurry, morphing faces, extra limbs.",
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "wan2.1",
    title: "Wan 2.1 — Character Consistency",
    category: "Video Prompt Engines",
    content: "# Wan 2.1\n\nKeep a fixed character reference image. Describe the subject first, then the motion. Use camera keywords: orbit, push-in, handheld. Reference frames improve continuity.",
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "ltx-video",
    title: "LTX-Video — Fast Iteration",
    category: "Video Prompt Engines",
    content: "# LTX-Video\n\nConcise prompts work best. Lead with subject + environment, then one dominant motion. Specify lighting mood in a single adjective. Avoid over-describing camera.",
    updatedAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: "hunyuan-image",
    title: "HunyuanDiT — Image Generation Spec",
    category: "Image Prompt Engines",
    content: "# HunyuanDiT\n\nFormat: [subject][style][lighting][mood]. Weight important elements: (focus:1.3). Use negative prompts for style bleed. Batch with seed locks for consistency.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "camera-dolly",
    title: "Camera Control — Dolly & Crane",
    category: "Camera Control",
    content: "# Camera Control\n\n- Dolly in: intimacy, tension. Dolly out: reveal, isolation.\n- Crane up: authority, scale. Crane down: vulnerability.\n- Handheld: urgency, realism. Stabilized: elegance, control.",
    updatedAt: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: "lighting-rim",
    title: "Lighting & Physics — Rim Light",
    category: "Lighting & Physics",
    content: "# Lighting & Physics\n\nRim light separates subject from backdrop. Two-key setups: key + fill at 2:1 ratio. Practical lights sell space. Volumetric haze catches light rays.",
    updatedAt: new Date(Date.now() - 518400000).toISOString(),
  },
];

export default function PromptLibraryPage() {
  const { promptDocs, addPromptDoc, deletePromptDocFn } = useSettings();
  const [category, setCategory] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState<PromptLibraryDoc[]>(promptDocs.length ? promptDocs : SAMPLE_DOCS);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter((doc) => {
      if (category !== "all" && doc.category !== category) return false;
      if (!q) return true;
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.content.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q)
      );
    });
  }, [docs, category, query]);

  const persist = (doc: PromptLibraryDoc) => {
    setDocs((prev) => {
      const exists = prev.some((d) => d.id === doc.id);
      return exists ? prev.filter((d) => d.id !== doc.id).concat(doc) : prev.concat(doc);
    });
    addPromptDoc(doc);
  };

  const createDoc = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    persist({
      id: `${newTitle.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}`,
      title: newTitle.trim(),
      category: category as PromptLibraryDoc["category"],
      content: newContent.trim(),
      updatedAt: new Date().toISOString(),
    });
    setNewTitle("");
    setNewContent("");
    setShowNew(false);
  };

  const handleExportAll = () => {
    const data = JSON.stringify(docs, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cinefora-prompt-library-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported: PromptLibraryDoc[] = JSON.parse(reader.result as string);
        if (!Array.isArray(imported)) return;
        let count = 0;
        for (const doc of imported) {
          if (doc.id && doc.title && doc.content) {
            persist({ ...doc, updatedAt: new Date().toISOString() });
            count++;
          }
        }
        setImportCount(count);
        setTimeout(() => setImportCount(0), 3000);
      } catch {
        // Invalid JSON — ignore silently
      }
    };
    reader.readAsText(file);
    // Reset the input so the same file can be re-imported.
    e.target.value = "";
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <PageHeader title="Prompt Library" subtitle="A repository of video, image, camera, and lighting prompt specs authored by Hermes Agent." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory("all")}
            className={cn("rounded-full px-3 py-1 text-xs font-medium transition", category === "all" ? "bg-[#6366F1] text-white" : "bg-white/5 text-white/50 hover:bg-white/10")}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn("rounded-full px-3 py-1 text-xs font-medium transition", category === cat ? "bg-[#6366F1] text-white" : "bg-white/5 text-white/50 hover:bg-white/10")}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search prompts…"
            className="w-full rounded-md border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white focus:border-[#6366F1] focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-white/40">{filtered.length} prompt document(s)</p>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <Button size="sm" variant="outline" className="border-white/10 gap-2" onClick={handleExportAll}>
            <Download className="h-4 w-4" /> Export all
          </Button>
          <Button size="sm" variant="outline" className="border-white/10 gap-2" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" /> Import
          </Button>
          <Button size="sm" onClick={() => setShowNew((v) => !v)} className="gap-2">
            <Plus className="h-4 w-4" /> New prompt
          </Button>
        </div>
      </div>

      {importCount > 0 && (
        <p className="text-xs text-emerald-400">{importCount} prompt(s) imported successfully.</p>
      )}

      {showNew && (
        <div className="rounded-xl border border-[#6366F1]/30 bg-[#6366F1]/5 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Prompt title (e.g. Runway Gen-3 Motion)"
              className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[#6366F1] focus:outline-none"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[#6366F1] focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-[#0a0a12]">{cat}</option>
              ))}
            </select>
          </div>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="# Prompt\nPositive: …\nNegative: …"
            className="mt-3 w-full resize-none rounded-md border border-white/10 bg-white/5 p-3 font-mono text-sm text-white/90 focus:outline-none"
            rows={5}
          />
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="outline" size="sm" className="border-white/10" onClick={() => setShowNew(false)}>
              Cancel
            </Button>
            <Button size="sm" className="gap-2" onClick={createDoc}>
              <Sparkles className="h-4 w-4" /> Save prompt
            </Button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 p-12 text-center text-sm text-white/40">
          No prompts match. Create one or clear your filters.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((doc) => (
            <PromptLibraryCard key={doc.id} doc={doc} onDelete={(id) => {
              setDocs((prev) => prev.filter((d) => d.id !== id));
              deletePromptDocFn(id);
            }} />
          ))}
        </div>
      )}

      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
          <BookOpen className="h-4 w-4 text-[#6366F1]" />
          Authored by Hermes Agent
        </div>
        <p className="mt-1 text-xs text-white/40">
          Prompt snippets and engine specifications generated by the Hermes Agent for Runway, Wan, LTX, Hunyuan, and image-generation workflows. Stored locally in <code className="rounded bg-white/10 px-1">/public/app_data/markdown_files/</code>.
        </p>
      </div>
    </div>
  );
}
