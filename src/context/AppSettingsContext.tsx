import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  deleteMarkdownFile,
  deletePromptDoc,
  loadMarkdownFiles,
  loadPromptDocs,
  loadSettings,
  saveMarkdownFile,
  savePromptDoc,
  saveSettings,
  defaultSettings,
} from "@/lib/storage";
import type { AppSettings, MarkdownFile, PromptLibraryDoc } from "@/types";

interface AppSettingsContextValue {
  settings: AppSettings;
  markdownFiles: MarkdownFile[];
  promptDocs: PromptLibraryDoc[];
  updateEngines: (engines: AppSettings["engines"]) => void;
  addMarkdownFile: (file: MarkdownFile) => void;
  updateMarkdownFile: (file: MarkdownFile) => void;
  deleteMarkdownFileFn: (id: string) => void;
  addPromptDoc: (doc: PromptLibraryDoc) => void;
  deletePromptDocFn: (id: string) => void;
}

const AppSettingsContext = createContext<AppSettingsContextValue | undefined>(undefined);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => defaultSettings());
  const [markdownFiles, setMarkdownFiles] = useState<MarkdownFile[]>([]);
  const [promptDocs, setPromptDocs] = useState<PromptLibraryDoc[]>([]);

  useEffect(() => {
    let mounted = true;
    loadSettings().then((loaded) => {
      if (mounted) setSettings(loaded);
    });
    loadMarkdownFiles().then((files) => {
      if (mounted) setMarkdownFiles(files);
    });
    loadPromptDocs().then((docs) => {
      if (mounted) setPromptDocs(docs);
    });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateEngines = useCallback((engines: AppSettings["engines"]) => {
    setSettings((prev) => ({ ...prev, engines }));
  }, []);

  const addMarkdownFile = useCallback((file: MarkdownFile) => {
    setMarkdownFiles((prev) => {
      const exists = prev.some((f) => f.id === file.id);
      return exists ? prev.filter((f) => f.id !== file.id).concat(file) : prev.concat(file);
    });
  }, []);

  const updateMarkdownFile = useCallback((file: MarkdownFile) => {
    setMarkdownFiles((prev) => prev.map((f) => (f.id === file.id ? file : f)));
  }, []);

  const deleteMarkdownFileFn = useCallback(
    (id: string) => {
      setMarkdownFiles((prev) => prev.filter((f) => f.id !== id));
    },
    [],
  );

  const addPromptDoc = useCallback((doc: PromptLibraryDoc) => {
    setPromptDocs((prev) => {
      const exists = prev.some((d) => d.id === doc.id);
      return exists ? prev.filter((d) => d.id !== doc.id).concat(doc) : prev.concat(doc);
    });
  }, []);

  const deletePromptDocFn = useCallback((id: string) => {
    setPromptDocs((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const value = useMemo<AppSettingsContextValue>(
    () => ({
      settings,
      markdownFiles,
      promptDocs,
      updateEngines,
      addMarkdownFile,
      updateMarkdownFile,
      deleteMarkdownFileFn,
      addPromptDoc,
      deletePromptDocFn,
    }),
    [settings, markdownFiles, promptDocs, updateEngines, addMarkdownFile, updateMarkdownFile, deleteMarkdownFileFn, addPromptDoc, deletePromptDocFn],
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useSettings(): AppSettingsContextValue {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error("useSettings must be used within AppSettingsProvider");
  return ctx;
}
