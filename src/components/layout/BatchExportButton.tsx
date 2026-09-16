import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProject } from "@/context/ProjectContext";
import {
  formatScriptBeatsAsMarkdown,
  formatStoryboardBeatsAsMarkdown,
  formatEntitiesAsMarkdown,
} from "@/lib/prompts";

export function BatchExportButton() {
  const { project } = useProject();

  const handleExportAll = () => {
    if (!project) return;
    const sections: string[] = [];

    sections.push(`# ${project.name} — Full Export\n`);
    sections.push(`*Exported ${new Date().toLocaleString()}*\n`);
    sections.push("---\n");

    // Characters
    if (project.characters.length > 0) {
      sections.push(formatEntitiesAsMarkdown(project.characters, "characters"));
      sections.push("\n---\n");
    }

    // Assets
    if (project.assets.length > 0) {
      sections.push(formatEntitiesAsMarkdown(project.assets, "assets"));
      sections.push("\n---\n");
    }

    // Locations
    if (project.locations.length > 0) {
      sections.push(formatEntitiesAsMarkdown(project.locations, "locations"));
      sections.push("\n---\n");
    }

    // Buildings
    if (project.buildings.length > 0) {
      sections.push(formatEntitiesAsMarkdown(project.buildings, "buildings"));
      sections.push("\n---\n");
    }

    // Spacecraft
    if (project.spacecraft.length > 0) {
      sections.push(formatEntitiesAsMarkdown(project.spacecraft, "spacecraft"));
      sections.push("\n---\n");
    }

    // Script
    if (project.scenes.length > 0) {
      sections.push(formatScriptBeatsAsMarkdown(project.scenes));
      sections.push("\n---\n");
    }

    // Storyboard
    if (project.storyboards.length > 0) {
      sections.push(formatStoryboardBeatsAsMarkdown(project.storyboards));
      sections.push("\n---\n");
    }

    // Scene Canvas
    if (project.sceneCanvases.length > 0) {
      sections.push("# Scene Canvases\n");
      for (const canvas of project.sceneCanvases) {
        sections.push(`## ${canvas.name}`);
        if (canvas.actors.length > 0) {
          sections.push("\n### Blocking\n");
          for (const actor of canvas.actors) {
            sections.push(`- **${actor.name}** (${actor.type}) at position (${Math.round(actor.x)}%, ${Math.round(actor.y)}%)`);
          }
        }
        if (canvas.generatedOutput) {
          sections.push("\n### Generated Canvas\n");
          sections.push(canvas.generatedOutput);
        }
        sections.push("");
      }
      sections.push("\n---\n");
    }

    const content = sections.join("\n");
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cinefora-export.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasContent = project && (
    project.characters.length > 0 ||
    project.assets.length > 0 ||
    project.locations.length > 0 ||
    project.buildings.length > 0 ||
    project.spacecraft.length > 0 ||
    project.scenes.length > 0 ||
    project.storyboards.length > 0 ||
    project.sceneCanvases.length > 0
  );

  return (
    <Button
      size="sm"
      variant="outline"
      className="border-white/10 gap-2"
      onClick={handleExportAll}
      disabled={!hasContent}
    >
      <Download className="h-4 w-4" /> Export All as Text
    </Button>
  );
}
