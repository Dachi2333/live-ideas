import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("mobile shell uses the approved Live Ideas capture copy and success toast", async () => {
  const html = await readFile(new URL("../../index.html", import.meta.url), "utf8");
  assert.match(html, /class="app-brand"[^>]*>Live Ideas</);
  assert.match(html, /id="capture-input"/);
  assert.match(html, /placeholder="Type your idea\.\.\."/);
  assert.match(html, /id="capture-toast"[^>]*>Your idea was sent to Miro</);
  assert.match(html, /id="capture-tab"[^>]*>Capture</);
  assert.match(html, /id="fragments-tab"[^>]*>Fragments</);
  assert.doesNotMatch(html, />\s*(Search|Tags|Folder|Song|Record|AI)\s*</i);
});

test("Figma-approved visual tokens and proportions are used", async () => {
  const css = await readFile(new URL("../../src/client/styles.css", import.meta.url), "utf8");
  const manifest = JSON.parse(await readFile(new URL("../../public/manifest.webmanifest", import.meta.url), "utf8"));

  assert.match(css, /--color-bg:\s*#202222/i);
  assert.match(css, /--color-surface:\s*#282b29/i);
  assert.match(css, /--color-accent:\s*#ff4b1f/i);
  assert.match(css, /\.capture-card\s*\{[^}]*border-radius:\s*18px/s);
  assert.match(css, /\.send-action\s*\{[^}]*width:\s*58px[^}]*height:\s*58px[^}]*border-radius:\s*50%/s);
  assert.match(css, /\.app-tab\s*\{[^}]*font-size:\s*18px[^}]*font-weight:\s*700/s);
  assert.match(css, /\.tab-indicator\s*\{[^}]*width:\s*101px[^}]*height:\s*3px/s);
  assert.match(css, /\.fragment-text\s*\{[^}]*-webkit-line-clamp:\s*6/s);
  assert.match(css, /\.delete-zone\s*\{[^}]*width:\s*63px[^}]*border:\s*0[^}]*border-radius:\s*0\s+18px\s+18px\s+0/s);
  assert.match(css, /\.fragment-shell\.is-open\s+\.fragment-row\s*\{[^}]*border-top-right-radius:\s*0[^}]*border-bottom-right-radius:\s*0/s);
  assert.equal(manifest.name, "Live Ideas");
});

test("autofocused capture textarea does not render a giant accent focus outline", async () => {
  const css = await readFile(new URL("../../src/client/styles.css", import.meta.url), "utf8");
  assert.doesNotMatch(css, /textarea:focus-visible/);
  assert.match(css, /button:focus-visible\s*\{/);
});

test("Capture and Fragments use direct-manipulation page swiping", async () => {
  const css = await readFile(new URL("../../src/client/styles.css", import.meta.url), "utf8");
  const app = await readFile(new URL("../../src/client/app.js", import.meta.url), "utf8");

  assert.match(css, /\.content-area\s*\{[^}]*touch-action:\s*pan-y/s);
  assert.match(css, /\.app-shell\.is-page-dragging\s+\.app-view\s*\{[^}]*transition:\s*none/s);
  assert.match(app, /pointermove/);
  assert.match(app, /setPageDragProgress/);
  assert.match(app, /style\.transform/);
  assert.match(app, /tabIndicator\.style\.left/);
  assert.doesNotMatch(app, /touchStartX/);
  assert.doesNotMatch(app, /Math\.abs\(dx\)\s*<\s*56/);
});

test("capture status only appears for sending, error, and success feedback", async () => {
  const app = await readFile(new URL("../../src/client/app.js", import.meta.url), "utf8");
  assert.match(app, /"Sending\.\.\."/);
  assert.match(app, /"Failed to send\. Tap to retry\."/);
  assert.match(app, /const retryIcon\s*=\s*`<svg/);
  assert.match(app, /captureToast\.classList\.add\("is-visible"\)/);
  assert.doesNotMatch(app, /"Ready"/);
  assert.doesNotMatch(app, /"Typing…"/);
  assert.doesNotMatch(app, /characters`/);
});

test("Fragments support a single swipe-open local delete action", async () => {
  const app = await readFile(new URL("../../src/client/app.js", import.meta.url), "utf8");
  const render = await readFile(new URL("../../src/client/render.js", import.meta.url), "utf8");

  assert.match(render, /class="fragment-shell"/);
  assert.match(render, /class="delete-zone"/);
  assert.match(render, /data-fragment-id=/);
  assert.match(app, /let openFragmentShell = null/);
  assert.match(app, /closeOpenFragment/);
  assert.match(app, /openFragmentShell !== shell/);
  assert.match(app, /vm\.deleteSent\(/);
});

test("shell stays fixed without feeding iOS visual viewport scroll back into layout", async () => {
  const css = await readFile(new URL("../../src/client/styles.css", import.meta.url), "utf8");
  const app = await readFile(new URL("../../src/client/app.js", import.meta.url), "utf8");

  assert.match(css, /html, body, #app\s*\{[^}]*overflow:\s*hidden/s);
  assert.match(css, /\.app-shell\s*\{[^}]*position:\s*fixed[^}]*height:\s*var\(--app-viewport-height/s);
  assert.match(app, /window\.visualViewport/);
  assert.match(app, /--app-viewport-height/);
  assert.doesNotMatch(app, /visualViewport\?\.addEventListener\("scroll"/);
});
