import { createMiroClient } from "./miro.js";

const MAX_BODY_BYTES = 64 * 1024;

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export function authorizeOwner(request, ownerEmail) {
  if (typeof ownerEmail !== "string" || ownerEmail.length === 0) return false;
  const email = request.headers.get("oai-authenticated-user-email");
  return typeof email === "string" && email.toLowerCase() === ownerEmail.toLowerCase();
}

function validPosition(position) {
  return position && Number.isFinite(position.x) && Number.isFinite(position.y);
}

export async function handleCreateFragment(request, env, deps = {}) {
  if (!env?.MIRO_ACCESS_TOKEN || !env?.MIRO_BOARD_ID || !env?.OWNER_EMAIL) {
    return json({ ok: false, error: "runtime_not_configured" }, 503);
  }
  if (!authorizeOwner(request, env.OWNER_EMAIL)) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return json({ ok: false, error: "request_too_large" }, 413);
  }

  let body;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return json({ ok: false, error: "request_too_large" }, 413);
    }
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "invalid_fragment" }, 400);
  }

  if (typeof body?.text !== "string" || body.text.length === 0 || !validPosition(body.position)) {
    return json({ ok: false, error: "invalid_fragment" }, 400);
  }

  const makeClient = deps.createClient ?? createMiroClient;
  const client = makeClient({
    fetchImpl: deps.fetchImpl ?? fetch,
    accessToken: env.MIRO_ACCESS_TOKEN,
    boardId: env.MIRO_BOARD_ID,
  });
  const result = await client.createSticky({ text: body.text, position: body.position });

  if (result?.ok && typeof result.itemId === "string" && result.itemId.length > 0) {
    return json({ ok: true, itemId: result.itemId }, 201);
  }

  const status = result?.statusCode === 429 ? 429 : 502;
  return json({ ok: false, error: result?.error || "miro_create_failed" }, status);
}
