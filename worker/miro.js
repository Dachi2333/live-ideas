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

function normalizedCoordinate(value) {
  return Math.round(value * 1000) / 1000;
}

function positionKey(position) {
  return `${normalizedCoordinate(position.x)}:${normalizedCoordinate(position.y)}`;
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
  const itemCache = new Map();

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

  async function getItem(itemId) {
    if (itemCache.has(itemId)) return { ok: true, item: itemCache.get(itemId) };

    const response = await fetchImpl(
      `https://api.miro.com/v2/boards/${encodedBoardId}/items/${encodeURIComponent(itemId)}`,
      {
        method: "GET",
        headers: authorizationHeaders,
      },
    );
    if (response.status !== 200) {
      return { ok: false, statusCode: response.status };
    }

    const item = await response.json().catch(() => null);
    if (!item || typeof item !== "object") return { ok: false };
    itemCache.set(itemId, item);
    return { ok: true, item };
  }

  async function resolveCanvasPosition(item, ancestors = new Set()) {
    const position = item?.position;
    if (!Number.isFinite(position?.x) || !Number.isFinite(position?.y)) {
      return { ok: false };
    }

    const parentId = item?.parent?.id;
    if (!parentId || !position.relativeTo || position.relativeTo === "canvas_center") {
      return { ok: true, position: { x: position.x, y: position.y } };
    }

    if (ancestors.has(parentId)) return { ok: false };
    const parentResult = await getItem(parentId);
    if (!parentResult.ok) return parentResult;

    const nextAncestors = new Set(ancestors);
    if (typeof item?.id === "string") nextAncestors.add(item.id);
    const parentPositionResult = await resolveCanvasPosition(parentResult.item, nextAncestors);
    if (!parentPositionResult.ok) return parentPositionResult;

    const parentPosition = parentPositionResult.position;
    if (position.relativeTo === "parent_center") {
      return {
        ok: true,
        position: {
          x: parentPosition.x + position.x,
          y: parentPosition.y + position.y,
        },
      };
    }

    if (position.relativeTo === "parent_top_left") {
      const width = parentResult.item?.geometry?.width;
      const height = parentResult.item?.geometry?.height;
      if (!Number.isFinite(width) || !Number.isFinite(height)) return { ok: false };
      return {
        ok: true,
        position: {
          x: parentPosition.x - width / 2 + position.x,
          y: parentPosition.y - height / 2 + position.y,
        },
      };
    }

    return { ok: false };
  }

  async function normalizeStickyPositions(items) {
    const normalized = [];
    for (const item of items) {
      const resolved = await resolveCanvasPosition(item);
      if (!resolved.ok) return resolved;
      normalized.push({ ...item, position: resolved.position });
    }
    return { ok: true, items: normalized };
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

        const normalized = await normalizeStickyPositions(listed.items);
        if (!normalized.ok) {
          return {
            ok: false,
            ...(normalized.statusCode ? { statusCode: normalized.statusCode } : {}),
            error: "miro_create_failed",
          };
        }

        const position = firstOpenGridPosition(normalized.items);
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
