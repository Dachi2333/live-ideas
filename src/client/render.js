export function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const trashIcon = `<svg class="trash-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 6.5h15M9 6.5V4.2h6v2.3M7 6.5l1 13h8l1-13M10 10v6.5M14 10v6.5" /></svg>`;

export function renderFragments(fragments, { formatTime }) {
  return fragments.map((fragment) => {
    const id = escapeHtml(fragment.id);
    const text = escapeHtml(fragment.text).replaceAll("\n", "<br>");
    const time = escapeHtml(formatTime(fragment.sentAt));
    return `<article class="fragment-shell" data-fragment-id="${id}"><button class="delete-zone" type="button" aria-label="Delete fragment">${trashIcon}</button><div class="fragment-row"><div class="fragment-text">${text}</div><time>${time}</time></div></article>`;
  }).join("");
}
