import { PanelLeftClose, Cpu, FileCode2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { EngineConfig } from "@/components/settings/EngineConfig";
import { MarkdownFileManager } from "@/components/settings/MarkdownFileManager";
import { useSettings } from "@/context/AppSettingsContext";

export default function SettingsPage() {
  const { settings, markdownFiles, promptDocs, updateEngines, addMarkdownFile, updateMarkdownFile, deleteMarkdownFileFn, addPromptDoc, deletePromptDocFn } = useSettings();

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <PageHeader title="Settings" subtitle="Configure AI engines and manage your app Markdown library." />

      <Tabs defaultValue="engines" className="space-y-4">
        <TabsList className="inline-flex gap-1">
          <TabsTrigger value="engines" className="data-[state=active]:bg-[#6366F1]">AI Engines</TabsTrigger>
          <TabsTrigger value="markdown" className="data-[state=active]:bg-[#6366F1]">Markdown Files</TabsTrigger>
        </TabsList>

        <TabsContent value="engines" className="space-y-6">
          <EngineConfig />
        </TabsContent>

        <TabsContent value="markdown" className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4 flex items-center gap-2">
              <FileCode2 className="h-5 w-5 text-[#6366F1]" />
              <h2 className="text-lg font-semibold text-white">App Markdown File Manager</h2>
            </div>
            <p className="mb-6 text-sm text-white/50">
              View, edit, and save <code className="rounded bg-white/10 px-1">.md</code> files inside a dedicated local directory (<code className="rounded bg-white/10 px-1">/public/app_data/markdown_files/</code>). Files persist between sessions.
            </p>

            {promptDocs.length > 0 && (
              <>
                <Separator className="my-6" />
                <h3 className="mb-3 text-sm font-semibold text-white/80">Saved Prompt Library ({promptDocs.length})</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {promptDocs.map((doc) => (
                    <div key={doc.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="font-sans text-sm font-semibold text-white">{doc.title}</p>
                      <p className="mt-1 font-mono text-[11px] text-white/50 line-clamp-2">{doc.content}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            <MarkdownFileManager
              files={markdownFiles}
              onAdd={(file) => addMarkdownFile(file)}
              onUpdate={(file) => updateMarkdownFile(file)}
              onDelete={deleteMarkdownFileFn}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
