function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderFragmentsHtml(fragments) {
  const rows = fragments
    .map((fragment) => {
      const text = escapeHtml(fragment.text)
        .replaceAll("\r\n", "\n")
        .replaceAll("\r", "\n")
        .replaceAll("\n", "<br>");
      const time = escapeHtml(fragment.sentAt);
      return `<article><div class="text">${text}</div><time>${time}</time></article>`;
    })
    .join("");

  return `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<style>
:root { color-scheme: light dark; }
* { box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  margin: 0;
  padding: calc(24px + env(safe-area-inset-top)) 22px calc(32px + env(safe-area-inset-bottom));
  background: Canvas;
  color: CanvasText;
}
main { max-width: 720px; margin: 0 auto; }
h1 {
  margin: 0 0 24px;
  font-size: 13px;
  line-height: 1;
  font-weight: 600;
  letter-spacing: .12em;
  opacity: .55;
}
article {
  padding: 18px 0 16px;
  border-top: 1px solid color-mix(in srgb, CanvasText 18%, transparent);
}
.text {
  font-size: 19px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
time {
  display: block;
  margin-top: 9px;
  font-size: 11px;
  line-height: 1.3;
  font-variant-numeric: tabular-nums;
  opacity: .42;
}
.empty {
  padding-top: 12px;
  font-size: 15px;
  opacity: .45;
}
</style>
</head>
<body><main><h1>FRAGMENTS</h1>${rows || '<div class="empty">Nothing sent yet.</div>'}</main></body>
</html>`;
}
