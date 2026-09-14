import { Map } from "lucide-react";
import { GenericExtractionPage } from "@/components/extraction/GenericExtractionPage";
import { extractPrompt } from "@/lib/prompts";
import type { ExtractionCategory } from "@/types";

export default function LocationPage() {
  return (
    <GenericExtractionPage
      category={"locations" as ExtractionCategory}
      title="Location & Environment Extraction"
      subtitle="Extract places, biomes, visual look, spatial form, scale, and operational function."
      icon={<Map className="h-5 w-5" />}
      prompt={(source) => extractPrompt("locations", source)}
    />
  );
}
