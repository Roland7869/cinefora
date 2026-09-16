import { useRef, useState } from "react";
import { Upload, FileText, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProject } from "@/context/ProjectContext";
import type { CharacterFile } from "@/types";

export function CharacterFileUpload() {
  const { project, addCharacterFile, removeCharacterFile } = useProject();
  const files = project?.characterFiles ?? [];
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    for (const file of Array.from(fileList)) {
      const content = await file.text();
      const characterFile: CharacterFile = {
        id: `charfile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name.replace(/\.(txt|md|text)$/i, ""),
        content,
        uploadedAt: new Date().toISOString(),
      };
      addCharacterFile(characterFile);
    }
    e.target.value = "";
  };

  return (
    <Card className="overflow-hidden border-white/10 bg-white/5">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-[#6366F1]/15 text-[#6366F1]">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Character Reference Files</CardTitle>
              <CardDescription>Upload .txt or .md files with character descriptions to prevent AI hallucination.</CardDescription>
            </div>
          </div>
          <Button size="sm" variant="outline" className="border-white/10 gap-2" onClick={() => inputRef.current?.click()}>
            <Upload className="h-4 w-4" /> Add Character File
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".txt,.md,.text"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/15 p-6 text-center text-sm text-white/40">
            No character files uploaded. Add .txt or .md files with character descriptions.
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div key={file.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 shrink-0 text-white/40" />
                    <span className="text-sm text-white/80 truncate">{file.name}</span>
                    <span className="text-[10px] text-white/30 shrink-0">
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="xs"
                      variant="outline"
                      className="border-white/10"
                      onClick={() => setPreviewId(previewId === file.id ? null : file.id)}
                    >
                      {previewId === file.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      className="border-white/10 text-red-300 hover:bg-red-500/10"
                      onClick={() => removeCharacterFile(file.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {previewId === file.id && (
                  <div className="mt-2 max-h-32 overflow-y-auto rounded-md bg-black/30 p-2 font-mono text-[11px] text-white/60">
                    {file.content.slice(0, 500)}{file.content.length > 500 && "…"}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {files.length > 0 && (
          <p className="mt-3 text-[11px] text-white/40">
            {files.length} file(s) uploaded. These will be included in Script, Storyboard, and Character extraction prompts.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
