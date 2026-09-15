// Local encryption-at-rest for sensitive settings (API keys).
//
// A random 256-bit key is generated once per browser and stored alongside the
// ciphertext. Settings are serialized, encrypted with AES-GCM, and written to
// localStorage. This keeps keys out of plaintext while remaining purely
// client-side — nothing leaves the device.

// Canonical storage key — used for BOTH saving and loading (must match storage.ts).
const SETTINGS_KEY = "cinefora.settings.v1";
const KEY_MATERIAL_KEY = "cinefora.settings.v1.key";

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return typeof btoa !== "undefined" ? btoa(binary) : "";
}

async function deriveKey(): Promise<CryptoKey> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    crypto.getRandomValues(new Uint8Array(32)),
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"],
  );
  const exported = await crypto.subtle.exportKey("raw", keyMaterial);
  const combined = new Uint8Array(12 + exported.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(exported), 12);
  localStorage.setItem(KEY_MATERIAL_KEY, arrayBufferToBase64(combined.buffer));
  return keyMaterial;
}

async function loadKey(): Promise<CryptoKey> {
  const cached = localStorage.getItem(KEY_MATERIAL_KEY);
  if (cached) {
    try {
      const material = new Uint8Array(base64ToArrayBuffer(cached));
      const keyMaterial = material.slice(12);
      return await crypto.subtle.importKey("raw", keyMaterial, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
    } catch {
      // Corrupted or wrong-length key material — regenerate.
    }
  }
  return deriveKey();
}

// Encrypt a JSON blob and persist it under the canonical settings key.
export async function encryptSettings(settings: unknown): Promise<string> {
  const key = await loadKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  // UTF-8 on both sides so the encode/decode round trip is lossless.
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(settings));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext));
  const json = JSON.stringify({ iv: arrayBufferToBase64(iv.buffer), data: arrayBufferToBase64(ciphertext.buffer) });
  localStorage.setItem(SETTINGS_KEY, json);
  return json;
}

// Decrypt a settings blob previously written by encryptSettings.
export async function decryptSettings(json: string): Promise<unknown> {
  let parsed: { iv: string; data: string };
  try {
    parsed = JSON.parse(json) as { iv: string; data: string };
  } catch {
    // Corrupted ciphertext — fall back to a safe default shape with local engines.
    return {
      engines: {
        cloud: { provider: "openai", apiKey: "" },
        local: [
          { kind: "lm-studio", baseUrl: "http://localhost:1234", model: "local-model", healthPath: "/v1/models" },
          { kind: "ollama", baseUrl: "http://localhost:11434", model: "llama3.2", healthPath: "/v1/models" },
          { kind: "unsloth", baseUrl: "http://localhost:8000", model: "unsloth-model", healthPath: "/v1/models" },
          { kind: "llama-cpp", baseUrl: "http://localhost:8080", model: "llama3.2", healthPath: "/v1/models" },
        ],
      },
      markdownFiles: [],
    };
  }
  const key = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(base64ToArrayBuffer(localStorage.getItem(KEY_MATERIAL_KEY) ?? "")),
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );
  const bytes = new Uint8Array(base64ToArrayBuffer(parsed.data));
  const ivBytes = new Uint8Array(base64ToArrayBuffer(parsed.iv));
  const plaintext = new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: ivBytes }, key, bytes));
  try {
    return JSON.parse(plaintext);
  } catch {
    // Decrypted but unparseable — return defaults so the app never crashes.
    return {
      engines: {
        cloud: { provider: "openai", apiKey: "" },
        local: [
          { kind: "lm-studio", baseUrl: "http://localhost:1234", model: "local-model", healthPath: "/v1/models" },
          { kind: "ollama", baseUrl: "http://localhost:11434", model: "llama3.2", healthPath: "/v1/models" },
          { kind: "unsloth", baseUrl: "http://localhost:8000", model: "unsloth-model", healthPath: "/v1/models" },
          { kind: "llama-cpp", baseUrl: "http://localhost:8080", model: "llama3.2", healthPath: "/v1/models" },
        ],
      },
      markdownFiles: [],
    };
  }
}
