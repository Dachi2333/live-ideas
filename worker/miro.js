import { getStickyPosition } from "../src/domain/positioning.js";

export function escapeMiroContent(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
    .replaceAll("\n", "<br>");
}

function positionKey(position) {
  return `${position.x}:${position.y}`;
}

function firstOpenGridPosition(items) {
  const occupied = new Set(
    items
      .map((item) => item?.position)
      .filter((position) => Number.isFinite(position?.x) && Number.isFinite(position?.y))
      .map(positionKey),
  );

  for (let index = 0; ; index += 1) {
    const position = getStickyPosition(index);
    if (!occupied.has(positionKey(position))) return position;
  }
}

export function createMiroClient({ fetchImpl = fetch, accessToken, boardId }) {
  const encodedBoardId = encodeURIComponent(boardId);
  const authorizationHeaders = {
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  async function listStickyItems() {
    const items = [];
    let cursor = null;

    do {
      const cursorParam = cursor ? `&cursor=${encodeURIComponent(cursor)}` : "";
      const response = await fetchImpl(
        `https://api.miro.com/v2/boards/${encodedBoardId}/items?type=sticky_note&limit=50${cursorParam}`,
        {
          method: "GET",
          headers: authorizationHeaders,
        },
      );

      if (response.status !== 200) {
        return { ok: false, statusCode: response.status };
      }

      const data = await response.json().catch(() => null);
      if (!Array.isArray(data?.data)) {
        return { ok: false };
      }

      items.push(...data.data);
      cursor = typeof data.cursor === "string" && data.cursor.length > 0 ? data.cursor : null;
    } while (cursor);

    return { ok: true, items };
  }

  return {
    async createSticky({ text }) {
      try {
        const listed = await listStickyItems();
        if (!listed.ok) {
          return {
            ok: false,
            ...(listed.statusCode ? { statusCode: listed.statusCode } : {}),
            error: "miro_create_failed",
          };
        }

        const position = firstOpenGridPosition(listed.items);
        const response = await fetchImpl(
          `https://api.miro.com/v2/boards/${encodedBoardId}/sticky_notes`,
          {
            method: "POST",
            headers: {
              ...authorizationHeaders,
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
