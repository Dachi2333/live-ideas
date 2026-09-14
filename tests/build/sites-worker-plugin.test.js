import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { findSitesWorkerBuild } from "../../build/sites-worker-plugin.js";

test("findSitesWorkerBuild accepts Cloudflare's sanitized live_ideas output directory", async () => {
  const root = await mkdtemp(join(tmpdir(), "live-ideas-sites-"));
  try {
    const workerDir = join(root, "dist", "live_ideas");
    await mkdir(workerDir, { recursive: true });
    await writeFile(join(workerDir, "index.js"), "export default {};\n");

    assert.equal(await findSitesWorkerBuild(root), join(workerDir, "index.js"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
