import { createMiroClient } from "./miro.js";

const MAX_BODY_BYTES = 64 * 1024;
const SELF_HOST_USERNAME = "liveideas";

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

export function isSelfHostMode(env) {
  return typeof env?.SELF_HOST_PASSWORD === "string" && env.SELF_HOST_PASSWORD.length > 0;
}

export function authorizeSelfHost(request, password) {
  if (typeof password !== "string" || password.length === 0) return false;
  const header = request.headers.get("authorization");
  if (typeof header !== "string" || !header.startsWith("Basic ")) return false;

  try {
    const decoded = atob(header.slice(6));
    const separator = decoded.indexOf(":");
    if (separator < 0) return false;
    const username = decoded.slice(0, separator);
    const suppliedPassword = decoded.slice(separator + 1);
    return username === SELF_HOST_USERNAME && suppliedPassword === password;
  } catch {
    return false;
  }
}

function runtimeConfigured(env) {
  if (!env?.MIRO_ACCESS_TOKEN || !env?.MIRO_BOARD_ID) return false;
  if (isSelfHostMode(env)) return true;
  return typeof env?.OWNER_EMAIL === "string" && env.OWNER_EMAIL.length > 0;
}

function authorizeRequest(request, env) {
  if (isSelfHostMode(env)) return authorizeSelfHost(request, env.SELF_HOST_PASSWORD);
  return authorizeOwner(request, env?.OWNER_EMAIL);
}

function validPosition(position) {
  return position && Number.isFinite(position.x) && Number.isFinite(position.y);
}

export async function handleCreateFragment(request, env, deps = {}) {
  if (!runtimeConfigured(env)) {
    return json({ ok: false, error: "runtime_not_configured" }, 503);
  }
  if (!authorizeRequest(request, env)) {
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
