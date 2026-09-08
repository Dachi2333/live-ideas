import { access, cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

export function copySitesWorker() {
  let root = process.cwd();
  return {
    name: "copy-sites-worker",
    apply: "build",
    configResolved(config) { root = config.root; },
    async closeBundle() {
      const cloudflareWorker = resolve(root, "dist", "live-lyrics", "index.js");
      if (!(await exists(cloudflareWorker))) throw new Error("Sites worker build was not produced");
      const serverDirectory = resolve(root, "dist", "server");
      await mkdir(serverDirectory, { recursive: true });
      await cp(cloudflareWorker, resolve(serverDirectory, "index.js"));
    },
  };
}
