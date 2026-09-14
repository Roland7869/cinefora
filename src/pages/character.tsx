import { Users } from "lucide-react";
import { GenericExtractionPage } from "@/components/extraction/GenericExtractionPage";
import { extractPrompt } from "@/lib/prompts";
import type { ExtractionCategory } from "@/types";

export default function CharacterPage() {
  return (
    <GenericExtractionPage
      category={"characters" as ExtractionCategory}
      title="Character Extraction"
      subtitle="Extract characters, traits, look, form, size, role, and psychological profile into structured cards."
      icon={<Users className="h-5 w-5" />}
      prompt={(source) => extractPrompt("characters", source)}
    />
  );
}
