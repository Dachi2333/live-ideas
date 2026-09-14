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

export async function findSitesWorkerBuild(root) {
  const candidates = [
    resolve(root, "dist", "live_ideas", "index.js"),
    resolve(root, "dist", "live-ideas", "index.js"),
  ];

  for (const candidate of candidates) {
    if (await exists(candidate)) return candidate;
  }

  return null;
}

export function copySitesWorker() {
  let root = process.cwd();
  return {
    name: "copy-sites-worker",
    apply: "build",
    configResolved(config) { root = config.root; },
    async closeBundle() {
      const cloudflareWorker = await findSitesWorkerBuild(root);
      if (!cloudflareWorker) throw new Error("Sites worker build was not produced");
      const serverDirectory = resolve(root, "dist", "server");
      await mkdir(serverDirectory, { recursive: true });
      await cp(cloudflareWorker, resolve(serverDirectory, "index.js"));
    },
  };
}
