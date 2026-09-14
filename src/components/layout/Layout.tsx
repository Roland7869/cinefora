import { useState } from "react";
import { IngestionDialog } from "@/components/ingestion/IngestionDialog";
import { ContextBar } from "@/components/layout/ContextBar";
import { Sidebar } from "@/components/sidebar/Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [ingestionOpen, setIngestionOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a12] text-white">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <ContextBar onOpenIngestion={() => setIngestionOpen(true)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <IngestionDialog open={ingestionOpen} onClose={() => setIngestionOpen(false)} onConfirm={() => setIngestionOpen(false)} />
    </div>
  );
}
