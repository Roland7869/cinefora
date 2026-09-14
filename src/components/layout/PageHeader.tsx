import { ChevronRight, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBook } from "@/context/IngestedBookContext";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, icon, action }: PageHeaderProps) {
  const { hasSource } = useBook();

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid size-10 place-items-center rounded-lg bg-white/5 text-[#6366F1]">
          {icon ?? <Sparkles className="h-5 w-5" />}
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-white/50">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center">{action}</div>
    </div>
  );
}

interface RunActionProps {
  loading: boolean;
  onRun: () => void;
}

export function RunExtractionButton({ loading, onRun }: RunActionProps) {
  return (
    <Button onClick={onRun} disabled={loading} className="gap-2 bg-[#6366F1] text-white hover:bg-[#6366F1]/80 disabled:opacity-60">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {loading ? "Running…" : "Run Extraction"}
    </Button>
  );
}
