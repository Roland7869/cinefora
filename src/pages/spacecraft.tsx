import { Rocket } from "lucide-react";
import { GenericExtractionPage } from "@/components/extraction/GenericExtractionPage";
import { extractPrompt } from "@/lib/prompts";
import type { ExtractionCategory } from "@/types";

export default function SpacecraftPage() {
  return (
    <GenericExtractionPage
      category={"spacecraft" as ExtractionCategory}
      title="Spacecraft, Space Station & Outpost Extraction"
      subtitle="Extract vessel names, hull look, hull form/geometry, physical scale, and mission/defense function."
      icon={<Rocket className="h-5 w-5" />}
      prompt={(source) => extractPrompt("spacecraft", source)}
    />
  );
}
