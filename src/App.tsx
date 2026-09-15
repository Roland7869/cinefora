import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProjectProvider } from "@/context/ProjectContext";
import { AppSettingsProvider } from "@/context/AppSettingsContext";
import { IngestedBookProvider } from "@/context/IngestedBookContext";
import { Layout } from "@/components/layout/Layout";
import Index from "@/pages/Index";
import SettingsPage from "@/pages/settings";
import ScriptPage from "@/pages/script";
import StoryboardPage from "@/pages/storyboard";
import SceneCanvasPage from "@/pages/scene-canvas";
import CharacterPage from "@/pages/character";
import AssetsPage from "@/pages/assets";
import LocationPage from "@/pages/location";
import BuildingPage from "@/pages/building";
import SpacecraftPage from "@/pages/spacecraft";
import PromptLibraryPage from "@/pages/prompt-library";
import { ROUTES } from "@/router.routes";

const queryClient = new QueryClient();

const INNER = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/script" element={<ScriptPage />} />
    <Route path="/storyboard" element={<StoryboardPage />} />
    <Route path="/scene-canvas" element={<SceneCanvasPage />} />
    <Route path="/character" element={<CharacterPage />} />
    <Route path="/assets" element={<AssetsPage />} />
    <Route path="/location" element={<LocationPage />} />
    <Route path="/building" element={<BuildingPage />} />
    <Route path="/spacecraft" element={<SpacecraftPage />} />
    <Route path="/prompt-library" element={<PromptLibraryPage />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="*" element={<Index />} />
  </Routes>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ProjectProvider>
          <AppSettingsProvider>
            <IngestedBookProvider>
              <BrowserRouter>
                <Layout>
                  <INNER />
                </Layout>
              </BrowserRouter>
            </IngestedBookProvider>
          </AppSettingsProvider>
        </ProjectProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
