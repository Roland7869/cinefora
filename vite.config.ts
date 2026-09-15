import { defineConfig, type Plugin } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Plugin that proxies /local-proxy/* requests to a user-configured local
// engine, bypassing browser CORS restrictions. The target URL is passed via
// the X-Local-Engine header on each request.
function localEngineProxy(): Plugin {
  return {
    name: "local-engine-proxy",
    configureServer(server) {
      server.middlewares.use("/local-proxy", async (req, res) => {
        const targetBase = (req.headers["x-local-engine"] as string) || "http://localhost:1234";
        const targetUrl = new URL(req.url || "/", targetBase);

        // Collect request body chunks.
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk);
        const body = Buffer.concat(chunks);

        try {
          const proxyRes = await fetch(targetUrl.toString(), {
            method: req.method,
            headers: {
              "Content-Type": (req.headers["content-type"] as string) || "application/json",
              Accept: (req.headers["accept"] as string) || "application/json",
            },
            body: req.method !== "GET" && req.method !== "HEAD" && body.length > 0 ? body : undefined,
          });

          const resBody = await proxyRes.text();
          res.writeHead(proxyRes.status, {
            "Content-Type": proxyRes.headers.get("content-type") || "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Accept, X-Local-Engine",
          });
          res.end(resBody);
        } catch (err) {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: `Proxy error: ${err instanceof Error ? err.message : String(err)}` }));
        }
      });
    },
  };
}

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 5173,
  },
  plugins: [dyadComponentTagger(), react(), localEngineProxy()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
