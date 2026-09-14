// Live AI engine client. Supports cloud providers (OpenAI-compatible chat +
// Anthropic messages) and local LLM servers (LM Studio, Ollama, Unsloth,
// Llama.cpp) which are all OpenAI-compatible chat endpoints.

import type { CloudProvider, EngineConfig, ExtractionCategory, LocalEngineConfig } from "@/types";

export interface AiResponse {
  content: string;
  engine: string;
  model: string;
  elapsedMs: number;
  error?: string;
}

async function postJson(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

// Base REST endpoints for each cloud provider (OpenAI-compatible /chat/completions).
const CLOUD_BASE: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta",
  xai: "https://api.x.ai/v1",
  groq: "https://api.groq.com/openai/v1",
  mistral: "https://api.mistral.ai/v1",
  together: "https://api.together.xyz/v1",
};

const GEMINI_MODEL = "gemini-2.0-flash";

async function cloudChat(config: EngineConfig, provider: CloudProvider, prompt: string): Promise<AiResponse> {
  const cloud = config.cloud;
  const apiKey = cloud.apiKey;
  const anthropic = provider === "anthropic";
  const start = performance.now();
  try {
    if (anthropic || !apiKey) {
      return { content: "No API key configured for the selected cloud provider.", engine: provider, model: "", elapsedMs: 0 };
    }
    if (provider === "gemini") {
      const res = await postJson(
        `${CLOUD_BASE.gemini}/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: "You are a meticulous film-production extraction specialist. Return ONLY valid JSON, nothing else.",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            temperature: 0.4,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      const text = data?.candidates?.[0]?.content?.parts?.map((p: { text: string }) => p.text)?.join("");
      return {
        content: text ?? (res.ok ? "Empty response from provider." : (data as any)?.error?.message),
        engine: provider,
        model: GEMINI_MODEL,
        elapsedMs: Math.round(performance.now() - start),
      };
    }

    // OpenAI-compatible providers.
    const baseUrl = `${CLOUD_BASE[provider]}/chat/completions`;
    const res = await postJson(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: anthropic ? "claude-3-5-sonnet-20241022" : "gpt-4o-mini",
        messages: [{ role: "system", content: "You are a meticulous film-production extraction specialist. Return ONLY valid JSON, nothing else." }, { role: "user", content: prompt }],
        temperature: 0.2,
        stream: false,
      }),
    });
    const data = await res.json().catch(() => ({}));
    const text = data?.choices?.[0]?.message?.content;
    return {
      content: text ?? (res.ok ? "Empty response from provider." : (data as any)?.error?.message),
      engine: provider,
      model: anthropic ? "claude-3-5-sonnet-20241022" : "gpt-4o-mini",
      elapsedMs: Math.round(performance.now() - start),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { content: `Provider request failed: ${message}`, engine: provider, model: "", elapsedMs: 0, error: message };
  }
}

async function localChat(config: EngineConfig, local: LocalEngineConfig, prompt: string): Promise<AiResponse> {
  const start = performance.now();
  const baseUrl = `${local.baseUrl.replace(/\/$/, "")}/v1/chat/completions`;
  try {
    const res = await postJson(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        model: local.model,
        messages: [{ role: "system", content: "You are a meticulous film-production extraction specialist. Return ONLY valid JSON, nothing else." }, { role: "user", content: prompt }],
        temperature: 0.2,
        stream: false,
      }),
    });
    const data = await res.json().catch(() => ({}));
    const text = data?.choices?.[0]?.message?.content;
    return {
      content: text ?? (res.ok ? "Empty response from local engine." : (data as any)?.error?.message),
      engine: local.kind,
      model: local.model,
      elapsedMs: Math.round(performance.now() - start),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { content: `Local engine request failed: ${message}`, engine: local.kind, model: local.model, elapsedMs: 0, error: message };
  }
}

async function healthCheck(config: EngineConfig, local: LocalEngineConfig): Promise<{ ok: boolean; status: string; body: string }> {
  const url = `${local.baseUrl.replace(/\/$/, "")}${local.healthPath}`;
  try {
    const res = await fetch(url, { headers: { "Content-Type": "application/json", Accept: "application/json" } });
    const text = await res.text();
    return { ok: res.ok, status: String(res.status), body: text.slice(0, 200) };
  } catch (err) {
    return { ok: false, status: "ERR", body: err instanceof Error ? err.message : "network unreachable" };
  }
}

// Unified entry point used by every extraction page.
export async function runExtraction(config: EngineConfig, category: ExtractionCategory, prompt: string): Promise<AiResponse> {
  const start = performance.now();
  try {
    const local = config.local[0];
    if (local) {
      return localChat(config, local, prompt);
    }
    return cloudChat(config, config.cloud.provider, prompt);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { content: `AI request failed: ${message}`, engine: "unknown", model: "", elapsedMs: 0, error: message };
  }
}

export async function probeLocalEngine(config: EngineConfig, local: LocalEngineConfig): Promise<{ ok: boolean; status: string; body: string }> {
  return healthCheck(config, local);
}
