export function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderFragments(fragments, { formatTime }) {
  return fragments.map((fragment) => {
    const text = escapeHtml(fragment.text).replaceAll("\n", "<br>");
    const time = escapeHtml(formatTime(fragment.sentAt));
    return `<article class="fragment-row"><div class="fragment-text">${text}</div><time>${time}</time></article>`;
  }).join("");
}
