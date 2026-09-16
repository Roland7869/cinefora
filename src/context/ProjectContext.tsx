import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  clearProject,
  createEmptyProject,
  exportProjectJson,
  importProjectJson,
  loadProject,
  saveBackup,
  saveProject,
  type Project,
} from "@/lib/project";
import { type EntityCategory } from "@/lib/entities";
import type { ReviewedEntity, CharacterFile, SceneCanvas, ScriptBeat, SourceEntry, StoryboardBeat } from "@/types";

interface ProjectContextValue {
  project: Project | null;
  hasProject: boolean;
  isNew: boolean;
  createProject: (name: string) => void;
  openProject: (project: Project) => void;
  saveProject: () => void;
  exportJson: () => string;
  importJson: (json: string) => void;
  clearProject: () => void;
  // Sources
  addSources: (sources: SourceEntry[]) => void;
  updateSource: (source: SourceEntry) => void;
  removeSource: (id: string) => void;
  // Entities (review workflow)
  addEntities: (category: EntityCategory, entities: ReviewedEntity[]) => void;
  updateEntity: (category: EntityCategory, id: string, patch: Partial<ReviewedEntity>) => void;
  removeEntities: (category: EntityCategory, ids: string[]) => void;
  // Scenes / Storyboards
  addScenes: (beats: ScriptBeat[]) => void;
  addStoryboards: (beats: StoryboardBeat[]) => void;
  // Scene Canvas
  updateSceneCanvas: (canvas: SceneCanvas) => void;
  removeSceneCanvas: (id: string) => void;
  // Character Files
  addCharacterFile: (file: CharacterFile) => void;
  removeCharacterFile: (id: string) => void;
}

const PROJECT_CATEGORIES: EntityCategory[] = ["characters", "locations", "buildings", "assets", "spacecraft"];

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<Project | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadProject().then((loaded) => {
      if (mounted) {
        if (loaded) {
          setProject(loaded);
          setIsNew(false);
        } else {
          const empty = createEmptyProject("Untitled Project");
          setProject(empty);
          setIsNew(true);
          saveProject(empty);
        }
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const commit = useCallback((next: Project) => {
    setProject(next);
    saveProject(next);
    setIsNew(false);
  }, []);

  const createProject = useCallback((name: string) => {
    const empty = createEmptyProject(name);
    commit(empty);
  }, [commit]);

  const openProject = useCallback((loaded: Project) => {
    commit({ ...loaded, id: loaded.id ?? `proj-${Date.now()}` });
    setIsNew(false);
  }, [commit]);

  const saveProjectFn = useCallback(() => {
    if (project) commit({ ...project, updatedAt: new Date().toISOString() });
  }, [project, commit]);

  const exportJson = useCallback(() => {
    return project ? exportProjectJson(project) : "";
  }, [project]);

  const importJson = useCallback((json: string) => {
    const imported = importProjectJson(json);
    commit({ ...imported, id: imported.id ?? `proj-${Date.now()}` });
    saveBackup(imported);
    setIsNew(false);
  }, [commit]);

  const clearProjectFn = useCallback(() => {
    const empty = createEmptyProject("Untitled Project");
    commit(empty);
  }, [commit]);

  const addSources = useCallback((sources: SourceEntry[]) => {
    commit({ ...project, sources: dedupeSources([...project.sources, ...sources]) });
  }, [project, commit]);

  const updateSource = useCallback((source: SourceEntry) => {
    commit({
      ...project,
      sources: project.sources.map((s) => (s.id === source.id ? source : s)),
    });
  }, [project, commit]);

  const removeSource = useCallback((id: string) => {
    commit({ ...project, sources: project.sources.filter((s) => s.id !== id) });
  }, [project, commit]);

  const addEntities = useCallback(
    (category: EntityCategory, entities: ReviewedEntity[]) => {
      commit({ ...project, [category]: [...project[category], ...entities] });
    },
    [project, commit],
  );

  const updateEntity = useCallback(
    (category: EntityCategory, id: string, patch: Partial<ReviewedEntity>) => {
      commit({
        ...project,
        [category]: project[category].map((e) => (e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e)),
      });
    },
    [project, commit],
  );

  const removeEntities = useCallback(
    (category: EntityCategory, ids: string[]) => {
      commit({
        ...project,
        [category]: project[category].filter((e) => !ids.includes(e.id)),
      });
    },
    [project, commit],
  );

  const addScenes = useCallback(
    (beats: ScriptBeat[]) => {
      commit({ ...project, scenes: [...project.scenes, ...beats] });
    },
    [project, commit],
  );

  const addStoryboards = useCallback(
    (beats: StoryboardBeat[]) => {
      commit({ ...project, storyboards: [...project.storyboards, ...beats] });
    },
    [project, commit],
  );

  const updateSceneCanvas = useCallback(
    (canvas: SceneCanvas) => {
      const exists = project.sceneCanvases.some((c) => c.id === canvas.id);
      const next = exists
        ? project.sceneCanvases.map((c) => (c.id === canvas.id ? canvas : c))
        : [...project.sceneCanvases, canvas];
      commit({ ...project, sceneCanvases: next });
    },
    [project, commit],
  );

  const removeSceneCanvas = useCallback(
    (id: string) => {
      commit({ ...project, sceneCanvases: project.sceneCanvases.filter((c) => c.id !== id) });
    },
    [project, commit],
  );

  const addCharacterFile = useCallback(
    (file: CharacterFile) => {
      const exists = project.characterFiles.some((f) => f.id === file.id);
      const next = exists
        ? project.characterFiles.map((f) => (f.id === file.id ? file : f))
        : [...project.characterFiles, file];
      commit({ ...project, characterFiles: next });
    },
    [project, commit],
  );

  const removeCharacterFile = useCallback(
    (id: string) => {
      commit({ ...project, characterFiles: project.characterFiles.filter((f) => f.id !== id) });
    },
    [project, commit],
  );

  const value = useMemo<ProjectContextValue>(
    () => ({
      project,
      hasProject: Boolean(project),
      isNew,
      createProject,
      openProject,
      saveProject: saveProjectFn,
      exportJson,
      importJson,
      clearProject: clearProjectFn,
      addSources,
      updateSource,
      removeSource,
    addEntities,
    updateEntity,
    removeEntities,
    addScenes,
    addStoryboards,
    updateSceneCanvas,
    removeSceneCanvas,
    addCharacterFile,
    removeCharacterFile,
  }),
    [
      project,
      isNew,
      createProject,
      openProject,
      saveProjectFn,
      exportJson,
      importJson,
      clearProjectFn,
      addSources,
      updateSource,
      removeSource,
      addEntities,
      updateEntity,
      removeEntities,
      addScenes,
      addStoryboards,
      updateSceneCanvas,
      removeSceneCanvas,
      addCharacterFile,
      removeCharacterFile,
    ],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}

function dedupeSources(sources: SourceEntry[]): SourceEntry[] {
  const byId = new Map<string, SourceEntry>();
  for (const s of sources) byId.set(s.id, s);
  return Array.from(byId.values());
}
