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
      cloudflare({
        config: {
          name: "live-lyrics",
          main: "./worker/index.js",
          compatibility_date: "2026-09-01",
          assets: {
            binding: "ASSETS",
            not_found_handling: "single-page-application",
            run_worker_first: ["/*"],
          },
        },
      }),
    ],
  };
});
