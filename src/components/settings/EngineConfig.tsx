import { useState } from "react";
import { Cloud, Server, Zap, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { ApiKeyInput } from "@/components/settings/ApiKeyInput";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { probeLocalEngine } from "@/lib/ai";
import { useSettings } from "@/context/AppSettingsContext";
import type { CloudProvider, EngineConfig as EngineConfigType } from "@/types";

const CLOUD_PROVIDERS: { value: CloudProvider; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic Claude" },
  { value: "gemini", label: "Google Gemini" },
  { value: "xai", label: "xAI" },
  { value: "groq", label: "Groq" },
  { value: "mistral", label: "Mistral" },
  { value: "together", label: "Together AI" },
];

const LOCAL_ENGINES: { value: EngineConfigType["local"][0]["kind"]; label: string; defaultUrl: string; defaultModel: string }[] = [
  { value: "lm-studio", label: "LM Studio", defaultUrl: "http://localhost:1234", defaultModel: "local-model" },
  { value: "ollama", label: "Ollama", defaultUrl: "http://localhost:11434", defaultModel: "llama3.2" },
  { value: "unsloth", label: "Unsloth", defaultUrl: "http://localhost:8000", defaultModel: "unsloth-model" },
  { value: "llama-cpp", label: "Llama.cpp", defaultUrl: "http://localhost:8080", defaultModel: "llama3.2" },
];

const MODEL_HINTS: Record<CloudProvider, string> = {
  openai: "e.g. gpt-4o, gpt-4o-mini",
  anthropic: "e.g. claude-3-5-sonnet-20241022",
  gemini: "gemini-2.0-flash (auto)",
  xai: "e.g. grok-beta",
  groq: "e.g. llama-3.3-70b-specdec",
  mistral: "e.g. mistral-large-latest",
  together: "e.g. meta-llama/Llama-3.3-70B-Instruct",
};

export function EngineConfig() {
  const { settings, updateEngines } = useSettings();
  const [activeProvider, setActiveProvider] = useState<CloudProvider>(settings.engines.cloud.provider);
  const [cloudKey, setCloudKey] = useState(settings.engines.cloud.apiKey);
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [probeResult, setProbeResult] = useState<Record<string, { ok: boolean; status: string }>>({});
  const [localUrls, setLocalUrls] = useState<Record<string, string>>(
    Object.fromEntries(settings.engines.local.map((e) => [e.kind, e.baseUrl]))
  );
  const [localModels, setLocalModels] = useState<Record<string, string>>(
    Object.fromEntries(settings.engines.local.map((e) => [e.kind, e.model]))
  );

  const handleProviderChange = (provider: CloudProvider) => {
    setActiveProvider(provider);
    updateEngines({ ...settings.engines, cloud: { provider, apiKey: cloudKey } });
  };

  const handleKeyChange = (key: string) => {
    setCloudKey(key);
    updateEngines({ ...settings.engines, cloud: { provider: activeProvider, apiKey: key } });
  };

  const testLocal = async (kind: EngineConfigType["local"][0]["kind"]) => {
    const url = localUrls[kind] || LOCAL_ENGINES.find((e) => e.value === kind)!.defaultUrl;
    const model = localModels[kind] || LOCAL_ENGINES.find((e) => e.value === kind)!.defaultModel;
    const local = { kind, baseUrl: url, model, healthPath: "/v1/models" };
    setTesting((t) => ({ ...t, [kind]: true }));
    const testConfig: EngineConfigType = { cloud: { provider: activeProvider, apiKey: cloudKey }, local: [local] };
    const res = await probeLocalEngine(testConfig, local);
    setProbeResult((p) => ({ ...p, [kind]: { ok: res.ok, status: res.status } }));
    setTesting((t) => ({ ...t, [kind]: false }));
  };

  const handleLocalUrlChange = (kind: string, url: string) => {
    setLocalUrls((prev) => ({ ...prev, [kind]: url }));
    const nextLocal = settings.engines.local.map((e) => (e.kind === kind ? { ...e, baseUrl: url } : e));
    updateEngines({ ...settings.engines, local: nextLocal });
  };

  const handleLocalModelChange = (kind: string, model: string) => {
    setLocalModels((prev) => ({ ...prev, [kind]: model }));
    const nextLocal = settings.engines.local.map((e) => (e.kind === kind ? { ...e, model } : e));
    updateEngines({ ...settings.engines, local: nextLocal });
  };

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="mb-5 flex items-center gap-2">
          <Cloud className="h-5 w-5 text-[#6366F1]" />
          <h2 className="text-lg font-semibold text-white">Cloud Providers & API Keys</h2>
        </div>

        <div className="mb-5">
          <Label className="text-sm text-white/70">Active provider</Label>
          <Select value={activeProvider} onValueChange={handleProviderChange}>
            <SelectTrigger className="mt-2 max-w-md border-white/10 bg-white/5">
              <SelectValue className="text-white" />
            </SelectTrigger>
            <SelectContent>
              {CLOUD_PROVIDERS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ApiKeyInput
          label={`${activeProvider.toUpperCase()} API Key`}
          value={cloudKey}
          onChange={handleKeyChange}
          placeholder="sk-… or your provider key"
          hint={`Model: ${MODEL_HINTS[activeProvider]}. Keys are stored locally in this browser only.`}
        />
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="mb-5 flex items-center gap-2">
          <Server className="h-5 w-5 text-[#6366F1]" />
          <h2 className="text-lg font-semibold text-white">Local AI Engines</h2>
        </div>
        <p className="mb-5 text-sm text-white/50">
          Point Cinefora at a local LLM server. Every engine exposes an OpenAI-compatible <code className="rounded bg-white/10 px-1">/v1/chat/completions</code> endpoint.
        </p>

        <div className="space-y-4">
          {LOCAL_ENGINES.map((engine) => {
            const result = probeResult[engine.value];
            return (
              <div key={engine.value} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-[#6366F1]" />
                    <span className="font-medium text-white">{engine.label}</span>
                  </div>
                  <Button
                    size="sm"
                    variant={result?.ok ? "default" : "outline"}
                    onClick={() => testLocal(engine.value)}
                    disabled={testing[engine.value]}
                  >
                    {testing[engine.value] ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : result?.ok ? <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 mr-2 text-white/40" />}
                    {testing[engine.value] ? "Testing…" : result?.ok ? "Connected" : "Test Connection"}
                  </Button>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/60">Endpoint</Label>
                    <input
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white focus:border-[#6366F1] focus:outline-none"
                      placeholder={engine.defaultUrl}
                      value={localUrls[engine.value] ?? engine.defaultUrl}
                      onChange={(e) => handleLocalUrlChange(engine.value, e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/60">Model</Label>
                    <input
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white focus:border-[#6366F1] focus:outline-none"
                      placeholder={engine.defaultModel}
                      value={localModels[engine.value] ?? engine.defaultModel}
                      onChange={(e) => handleLocalModelChange(engine.value, e.target.value)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-[#6366F1]" />
          <h2 className="text-lg font-semibold text-white">Persistence</h2>
        </div>
        <p className="mt-2 text-sm text-white/50">
          API keys and endpoints are encrypted at rest via Web Crypto (AES-GCM) and stored in <code className="rounded bg-white/10 px-1">localStorage</code>, so they survive reloads and are never sent to a third party.
        </p>
      </section>
    </div>
  );
}
