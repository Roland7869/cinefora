import { useState } from "react";
import { Sparkles, ArrowRight, BookOpen, Zap, Shield, Film } from "lucide-react";
import { IngestionDialog } from "@/components/ingestion/IngestionDialog";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: <Zap className="h-5 w-5" />, title: "Live AI Engines", description: "Cloud or local LLMs — OpenAI, Claude, Gemini, and LM Studio, Ollama, Unsloth, Llama.cpp." },
  { icon: <Film className="h-5 w-5" />, title: "Full Production Pipeline", description: "Script, storyboard, scene canvas, and spatial blocking all fed from one ingested section." },
  { icon: <BookOpen className="h-5 w-5" />, title: "Structured Extraction", description: "Characters, assets, locations, buildings, and spacecraft distilled into filterable tables." },
  { icon: <Shield className="h-5 w-5" />, title: "Local-first & Encrypted", description: "API keys encrypted at rest; your manuscripts never leave this device." },
];

const BG_IMAGE = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80";

export default function IndexPage() {
  const [ingestionOpen, setIngestionOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <img src={BG_IMAGE} alt="" className="h-[120%] w-full opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a12]/70 via-[#0a0a12]/50 to-[#0a0a12]" />
      </div>

      <IngestionDialog open={ingestionOpen} onClose={() => setIngestionOpen(false)} onConfirm={() => setIngestionOpen(false)} />

      <nav className="mb-12 flex flex-wrap items-center justify-center gap-2">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60">
            <span className="text-[#6366F1]">{f.icon}</span>
            {f.title}
          </div>
        ))}
      </nav>

      <main className="mx-auto max-w-3xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#6366F1]/30 bg-[#6366F1]/10 px-3 py-1 text-xs font-medium text-[#6366F1]">
          <Sparkles className="h-3.5 w-3.5" /> Book-to-Screen AI Production Pipeline
        </div>

        <h1 className="bg-gradient-to-br from-white via-white to-white/50 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
          Turn pages into screen.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-white/60">
          Connect a section of your book, then run cloud or local AI engines across every stage of your production — from script to spacecraft.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" className="gap-2 bg-[#6366F1] text-white hover:bg-[#6366F1]/80" onClick={() => setIngestionOpen(true)}>
            Connect your book <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="lg" className="border-white/10 text-white/80 hover:bg-white/5">
            Explore the pipeline
          </Button>
        </div>
      </main>

      <footer className="mt-16 text-center text-xs text-white/30">
        Cinefora · local-first · encrypted at rest
      </footer>
    </div>
  );
}
