import { Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PromptLibraryDoc } from "@/types";

interface PromptLibraryCardProps {
  doc: PromptLibraryDoc;
  onDelete: (id: string) => void;
}

const CATEGORY_STYLES: Record<PromptLibraryDoc["category"], string> = {
  "Video Prompt Engines": "bg-blue-500/15 text-blue-300 border-blue-500/30",
  "Image Prompt Engines": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  "Camera Control": "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "Lighting & Physics": "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export function PromptLibraryCard({ doc, onDelete }: PromptLibraryCardProps) {
  return (
    <div className="group flex flex-col rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-[#6366F1]/40 hover:bg-white/[0.07]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge className={cn("border", CATEGORY_STYLES[doc.category])}>{doc.category}</Badge>
          <span className="text-[11px] text-white/30">{new Date(doc.updatedAt).toLocaleDateString()}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 transition group-hover:opacity-100 hover:text-red-400" onClick={() => onDelete(doc.id)} aria-label="Delete prompt">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <h3 className="mt-3 pr-6 font-sans text-base font-semibold text-white">{doc.title}</h3>
      <p className="mt-2 flex-1 whitespace-pre-wrap font-mono text-xs leading-relaxed text-white/60">{doc.content}</p>
      <Button variant="ghost" className="mt-3 self-start text-xs hover:bg-[#6366F1]/20 hover:text-white" onClick={() => {
        navigator.clipboard.writeText(doc.content);
      }}>
        Copy prompt <ChevronRight className="ml-1 h-3 w-3" />
      </Button>
    </div>
  );
}
