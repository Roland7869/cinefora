import { Package } from "lucide-react";
import { GenericExtractionPage } from "@/components/extraction/GenericExtractionPage";
import { extractPrompt } from "@/lib/prompts";
import type { ExtractionCategory } from "@/types";

export default function AssetsPage() {
  return (
    <GenericExtractionPage
      category={"assets" as ExtractionCategory}
      title="Asset & Object Extraction"
      subtitle="Extract physical props, tools, artifacts — look, form, size, and function."
      icon={<Package className="h-5 w-5" />}
      prompt={(source) => extractPrompt("assets", source)}
    />
  );
}
