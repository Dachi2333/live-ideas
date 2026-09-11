import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("mobile shell matches the approved Live Ideas capture and Fragments navigation", async () => {
  const html = await readFile(new URL("../../index.html", import.meta.url), "utf8");
  assert.match(html, /class="app-brand"[^>]*>Live Ideas</);
  assert.match(html, /id="capture-input"/);
  assert.match(html, /placeholder="Type what you hear\.\.\."/);
  assert.match(html, /id="send-button"[^>]*>[\s\S]*<svg[^>]*class="send-icon"/);
  assert.match(html, /id="capture-tab"[^>]*>Capture</);
  assert.match(html, /id="fragments-tab"[^>]*>Fragments</);
  assert.match(html, /id="tab-indicator"/);
  assert.match(html, /id="content-area"/);
  assert.match(html, /id="fragments-view"/);
  assert.doesNotMatch(html, />\s*(Search|Tags|Folder|Song|Record|AI)\s*</i);
  assert.doesNotMatch(html, /contenteditable/);
});

test("approved v4 visual proportions use the refined tab, bar, send, and retry sizing", async () => {
  const css = await readFile(new URL("../../src/client/styles.css", import.meta.url), "utf8");
  const manifest = JSON.parse(await readFile(new URL("../../public/manifest.webmanifest", import.meta.url), "utf8"));

  assert.match(css, /--color-bg:\s*#191b1a/i);
  assert.match(css, /--color-accent:\s*#ff4b1f/i);
  assert.match(css, /\.app-brand\s*\{[^}]*color:\s*var\(--color-accent\)/s);
  assert.match(css, /\.capture-card\s*\{[^}]*border-radius:/s);
  assert.match(css, /\.send-action\s*\{[^}]*width:\s*54px[^}]*height:\s*54px[^}]*border-radius:\s*50%/s);
  assert.match(css, /\.send-icon\s*\{[^}]*width:\s*26px[^}]*height:\s*26px/s);
  assert.match(css, /\.app-tab\s*\{[^}]*font-size:\s*16px[^}]*font-weight:\s*700/s);
  assert.match(css, /\.tab-indicator\s*\{[^}]*width:\s*96px/s);
  assert.match(css, /\.retry-icon\s*\{[^}]*width:\s*32px[^}]*height:\s*32px/s);
  assert.equal(manifest.name, "Live Ideas");
  assert.equal(manifest.short_name, "Live Ideas");
  assert.equal(manifest.background_color.toLowerCase(), "#191b1a");
  assert.equal(manifest.theme_color.toLowerCase(), "#191b1a");
});

test("tabs animate the page track and one centered indicator instead of swapping hidden views", async () => {
  const css = await readFile(new URL("../../src/client/styles.css", import.meta.url), "utf8");
  const app = await readFile(new URL("../../src/client/app.js", import.meta.url), "utf8");

  assert.match(css, /\.app-view\s*\{[^}]*position:\s*absolute[^}]*transition:\s*transform\s+285ms/s);
  assert.match(css, /\.fragments-view\s*\{[^}]*transform:\s*translateX\(112%\)/s);
  assert.match(css, /\.app-shell\[data-page="fragments"\]\s+\.capture-view\s*\{[^}]*translateX\(-112%\)/s);
  assert.match(css, /\.app-shell\[data-page="fragments"\]\s+\.fragments-view\s*\{[^}]*translateX\(0\)/s);
  assert.match(css, /\.tab-indicator\s*\{[^}]*left:\s*calc\(25% \+ 10px\)[^}]*transition:\s*left\s+270ms/s);
  assert.match(css, /\.app-tabs\[data-active="fragments"\]\s+\.tab-indicator\s*\{[^}]*left:\s*calc\(75% - 10px\)/s);
  assert.match(app, /appShell\.dataset\.page\s*=\s*view/);
  assert.match(app, /tabs\.dataset\.active\s*=\s*view/);
  assert.match(app, /touchStartX/);
  assert.match(app, /Math\.abs\(dx\)\s*<\s*56/);
});

test("capture state uses the reference Ready, Typing, long text, sending, and SVG retry treatments", async () => {
  const app = await readFile(new URL("../../src/client/app.js", import.meta.url), "utf8");
  assert.match(app, /"Ready"/);
  assert.match(app, /"Typing…"/);
  assert.match(app, /state\.text\.length\s*>=\s*120/);
  assert.match(app, /`\$\{state\.text\.length\} characters`/);
  assert.match(app, /"Sending…"/);
  assert.match(app, /const retryIcon\s*=\s*`<svg/);
  assert.match(app, /sendButton\.innerHTML\s*=\s*retryIcon/);
  assert.match(app, /captureTab\.classList\.toggle\("is-active"/);
  assert.match(app, /fragmentsTab\.classList\.toggle\("is-active"/);
});

test("shell declares standalone web-app metadata without a service worker", async () => {
  const html = await readFile(new URL("../../index.html", import.meta.url), "utf8");
  const manifest = JSON.parse(await readFile(new URL("../../public/manifest.webmanifest", import.meta.url), "utf8"));
  const app = await readFile(new URL("../../src/client/app.js", import.meta.url), "utf8");
  assert.match(html, /apple-mobile-web-app-capable/);
  assert.equal(manifest.name, "Live Ideas");
  assert.equal(manifest.display, "standalone");
  assert.doesNotMatch(app, /serviceWorker/);
});

test("capture shell stays fixed without feeding iOS visual viewport scroll back into layout", async () => {
  const css = await readFile(new URL("../../src/client/styles.css", import.meta.url), "utf8");
  const app = await readFile(new URL("../../src/client/app.js", import.meta.url), "utf8");

  assert.match(css, /html, body, #app\s*\{[^}]*overflow:\s*hidden/s);
  assert.match(css, /\.app-shell\s*\{[^}]*position:\s*fixed[^}]*height:\s*var\(--app-viewport-height/s);
  assert.match(css, /\.capture-view\s*\{[^}]*overflow:\s*hidden/s);
  assert.match(css, /\.fragments-list\s*\{[^}]*overflow-y:\s*auto/s);
  assert.match(app, /window\.visualViewport/);
  assert.match(app, /--app-viewport-height/);
  assert.doesNotMatch(app, /--app-viewport-top/);
  assert.doesNotMatch(app, /visualViewport\?\.addEventListener\("scroll"/);
  assert.doesNotMatch(css, /--app-viewport-top/);
});
