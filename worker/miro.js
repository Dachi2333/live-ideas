import { getStickyPosition } from "../src/domain/positioning.js";

const DEFAULT_STICKY_WIDTH = 199;
const DEFAULT_STICKY_HEIGHT = 228;
const ORIGIN_TAG_TITLE = "live-ideas-origin";

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

function overlapsGridPosition(item, candidate) {
  const position = item?.position;
  if (!Number.isFinite(position?.x) || !Number.isFinite(position?.y)) return false;

  const width = item?.geometry?.width;
  const height = item?.geometry?.height;
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return positionKey(position) === positionKey(candidate);
  }

  return (
    Math.abs(position.x - candidate.x) < (width + DEFAULT_STICKY_WIDTH) / 2
    && Math.abs(position.y - candidate.y) < (height + DEFAULT_STICKY_HEIGHT) / 2
  );
}

function firstOpenGridPosition(items) {
  for (let index = 0; ; index += 1) {
    const position = getStickyPosition(index);
    if (!items.some((item) => overlapsGridPosition(item, position))) return position;
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

  async function listBoardTags() {
    const tags = [];
    let offset = 0;

    for (;;) {
      const response = await fetchImpl(
        `https://api.miro.com/v2/boards/${encodedBoardId}/tags?limit=50&offset=${offset}`,
        {
          method: "GET",
          headers: authorizationHeaders,
        },
      );

      if (response.status !== 200) {
        return { ok: false, statusCode: response.status, error: "origin_tag_lookup_failed" };
      }

      const data = await response.json().catch(() => null);
      if (!Array.isArray(data?.data)) {
        return { ok: false, error: "origin_tag_lookup_failed" };
      }

      tags.push(...data.data);
      if (data.data.length < 50) break;
      offset += data.data.length;
    }

    return { ok: true, tags };
  }

  async function createOriginTag() {
    const response = await fetchImpl(
      `https://api.miro.com/v2/boards/${encodedBoardId}/tags`,
      {
        method: "POST",
        headers: {
          ...authorizationHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: ORIGIN_TAG_TITLE }),
      },
    );

    if (response.status !== 201) {
      return { ok: false, statusCode: response.status, error: "origin_tag_create_failed" };
    }

    const data = await response.json().catch(() => null);
    if (typeof data?.id !== "string" || data.id.length === 0) {
      return { ok: false, error: "origin_tag_create_failed" };
    }

    return { ok: true, tagId: data.id };
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
    async ensureOriginTag() {
      try {
        const listed = await listBoardTags();
        if (!listed.ok) return listed;

        const matching = listed.tags.filter((tag) => tag?.title === ORIGIN_TAG_TITLE);
        if (matching.length > 1) {
          return { ok: false, error: "ambiguous_origin_tag" };
        }
        if (matching.length === 1) {
          const tagId = matching[0]?.id;
          if (typeof tagId === "string" && tagId.length > 0) {
            return { ok: true, tagId };
          }
          return { ok: false, error: "origin_tag_lookup_failed" };
        }

        return await createOriginTag();
      } catch {
        return { ok: false, error: "origin_tag_request_failed" };
      }
    },

    async attachOriginTag({ itemId, tagId }) {
      try {
        const response = await fetchImpl(
          `https://api.miro.com/v2/boards/${encodedBoardId}/items/${encodeURIComponent(itemId)}?tag_id=${encodeURIComponent(tagId)}`,
          {
            method: "POST",
            headers: authorizationHeaders,
          },
        );
        if (response.status === 204) return { ok: true };
        return { ok: false, statusCode: response.status, error: "origin_tag_failed" };
      } catch {
        return { ok: false, error: "origin_tag_failed" };
      }
    },

    async verifyRepairTarget(itemId) {
      try {
        const response = await fetchImpl(
          `https://api.miro.com/v2/boards/${encodedBoardId}/sticky_notes/${encodeURIComponent(itemId)}`,
          {
            method: "GET",
            headers: authorizationHeaders,
          },
        );
        if (response.status !== 200) {
          return { ok: false, statusCode: response.status, error: "invalid_repair_target" };
        }
        const item = await response.json().catch(() => null);
        if (!item || typeof item !== "object" || item.id !== itemId) {
          return { ok: false, error: "invalid_repair_target" };
        }
        return { ok: true };
      } catch {
        return { ok: false, error: "invalid_repair_target" };
      }
    },

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
