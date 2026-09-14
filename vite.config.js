import { sites } from "@openai/sites-vite-plugin";
import { defineConfig } from "vite";
import { copySitesWorker } from "./build/sites-worker-plugin.js";

export default defineConfig(async () => {
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    plugins: [
      sites(),
      copySitesWorker(),
      cloudflare(),
    ],
  };
});
