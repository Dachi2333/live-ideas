import { build } from "esbuild";

const common = {
  bundle: true,
  format: "iife",
  platform: "neutral",
  target: "es2017",
  minify: false,
};

await build({
  ...common,
  entryPoints: ["drafts/send-entry.js"],
  outfile: "dist/live-lyrics-send.js",
});

await build({
  ...common,
  entryPoints: ["drafts/fragments-entry.js"],
  outfile: "dist/live-lyrics-fragments.js",
});
