import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("mobile shell exposes only capture, Fragments, and send as daily controls", async () => {
  const html = await readFile(new URL("../../index.html", import.meta.url), "utf8");
  assert.match(html, /id="fragments-button"[^>]*>Fragments</);
  assert.match(html, /id="capture-input"/);
  assert.match(html, /id="send-button"[^>]*>↗</);
  assert.match(html, /id="fragments-view"/);
  assert.doesNotMatch(html, />\s*(Search|Tags|Folder|Song|Record|AI)\s*</i);
  assert.doesNotMatch(html, /contenteditable/);
});

test("shell declares standalone web-app metadata without a service worker", async () => {
  const html = await readFile(new URL("../../index.html", import.meta.url), "utf8");
  const manifest = JSON.parse(await readFile(new URL("../../public/manifest.webmanifest", import.meta.url), "utf8"));
  const app = await readFile(new URL("../../src/client/app.js", import.meta.url), "utf8");
  assert.match(html, /apple-mobile-web-app-capable/);
  assert.equal(manifest.name, "Live Lyrics");
  assert.equal(manifest.display, "standalone");
  assert.doesNotMatch(app, /serviceWorker/);
});
