import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loadBook, saveBook } from "@/lib/storage";
import type { IngestedSource } from "@/types";

interface IngestedBookContextValue {
  source: IngestedSource | null;
  hasSource: boolean;
  setSource: (source: IngestedSource) => void;
  clearSource: () => void;
  isPersisted: boolean;
}

const IngestedBookContext = createContext<IngestedBookContextValue | undefined>(undefined);

export function IngestedBookProvider({ children }: { children: ReactNode }) {
  const [source, setSourceState] = useState<IngestedSource | null>(null);
  const [isPersisted, setIsPersisted] = useState(false);

  const setSource = useCallback((source: IngestedSource) => {
    setSourceState(source);
    saveBook(source);
  }, []);

  const clearSource = useCallback(() => {
    setSourceState(null);
    saveBook({ text: "", label: "(no active text)" });
  }, []);

  useEffect(() => {
    loadBook().then((initial) => {
      // On cold start prefer a stored source; otherwise fall back to any
      // ephemeral source set during the session.
      setSourceState(initial ?? source);
      setIsPersisted(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setIsPersisted(true);
  }, [source]);

  const value = useMemo<IngestedBookContextValue>(
    () => ({ source, hasSource: Boolean(source?.text), setSource, clearSource, isPersisted: isPersisted && Boolean(source) }),
    [source, setSource, clearSource, isPersisted],
  );

  return <IngestedBookContext.Provider value={value}>{children}</IngestedBookContext.Provider>;
}

export function useBook(): IngestedBookContextValue {
  const ctx = useContext(IngestedBookContext);
  if (!ctx) throw new Error("useBook must be used within IngestedBookProvider");
  return ctx;
}
