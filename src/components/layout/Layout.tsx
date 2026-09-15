import { useState } from "react";
import { IngestionDialog } from "@/components/ingestion/IngestionDialog";
import { ContextBar } from "@/components/layout/ContextBar";
import { ProjectMenu } from "@/components/layout/ProjectMenu";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { useBook } from "@/context/IngestedBookContext";
import { useProject } from "@/context/ProjectContext";
import type { SourceEntry } from "@/types";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [ingestionOpen, setIngestionOpen] = useState(false);
  const { setSource } = useBook();
  const { addSources } = useProject();

  const handleIngestConfirm = (source: { text: string; label?: string; sources?: SourceEntry[] }) => {
    setSource(source);
    if (source.sources && source.sources.length > 0) {
      addSources(source.sources);
    }
    setIngestionOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a12] text-white">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <ContextBar onOpenIngestion={() => setIngestionOpen(true)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <IngestionDialog open={ingestionOpen} onClose={() => setIngestionOpen(false)} onConfirm={handleIngestConfirm} />
      <ProjectMenu />
    </div>
  );
}
