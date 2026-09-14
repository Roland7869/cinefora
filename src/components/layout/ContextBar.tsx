import { BookOpen, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBook } from "@/context/IngestedBookContext";

export function ContextBar({ onOpenIngestion }: { onOpenIngestion: () => void }) {
  const { source, isPersisted } = useBook();

  return (
    <div className="sticky top-0 z-20 border-b border-white/5 bg-[#0a0a12]/80 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-white">Cinefora</p>
            <p className="text-[11px] text-white/40">Book-to-Screen AI Pipeline</p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center gap-3">
          <div className="flex max-w-md items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white/80 hover:bg-white/10" onClick={onOpenIngestion}>
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Connect text
            </Button>
            {source && (
              <span className="hidden max-w-[200px] truncate font-mono text-[11px] text-white/50 sm:block">{source.label}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {source && (
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300 sm:inline-flex">
              <BookOpen className="h-3 w-3" />
              {isPersisted ? "Active & saved" : "Active"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
