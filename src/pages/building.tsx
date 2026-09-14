import { Building2 } from "lucide-react";
import { GenericExtractionPage } from "@/components/extraction/GenericExtractionPage";
import { extractPrompt } from "@/lib/prompts";
import type { ExtractionCategory } from "@/types";

export default function BuildingPage() {
  return (
    <GenericExtractionPage
      category={"building" as ExtractionCategory}
      title="Building & Architecture Extraction"
      subtitle="Extract edifices, architecture, look, structural form, height/size, and function."
      icon={<Building2 className="h-5 w-5" />}
      prompt={(source) => extractPrompt("building", source)}
    />
  );
}
