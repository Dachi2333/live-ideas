export function escapeMiroContent(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
    .replaceAll("\n", "<br>");
}

export function createMiroClient({ fetchImpl = fetch, accessToken, boardId }) {
  return {
    async createSticky({ text, position }) {
      try {
        const response = await fetchImpl(
          `https://api.miro.com/v2/boards/${encodeURIComponent(boardId)}/sticky_notes`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              data: { content: escapeMiroContent(text), shape: "square" },
              position,
            }),
          },
        );

        if (response.status === 201) {
          const data = await response.json().catch(() => null);
          if (typeof data?.id === "string" && data.id.length > 0) {
            return { ok: true, itemId: data.id };
          }
        }
        return { ok: false, statusCode: response.status, error: "miro_create_failed" };
      } catch {
        return { ok: false, error: "miro_request_failed" };
      }
    },
  };
}
