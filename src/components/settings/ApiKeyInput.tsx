import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ApiKeyInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
}

export function ApiKeyInput({ label, value, onChange, placeholder, hint }: ApiKeyInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-white/70">{label}</Label>
      <div className="flex items-stretch gap-2">
        <Input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="font-mono text-sm"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="grid size-10 shrink-0 place-items-center rounded-md border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
          aria-label={visible ? "Mask key" : "Reveal key"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hint && <p className="text-[11px] text-white/40">{hint}</p>}
    </div>
  );
}
