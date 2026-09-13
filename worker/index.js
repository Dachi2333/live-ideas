import { authorizeSelfHost, handleCreateFragment, isSelfHostMode } from "./api.js";

function selfHostChallenge() {
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "cache-control": "no-store",
      "www-authenticate": 'Basic realm="Live Ideas", charset="UTF-8"',
    },
  });
}

export default {
  async fetch(request, env) {
    if (isSelfHostMode(env) && !authorizeSelfHost(request, env.SELF_HOST_PASSWORD)) {
      return selfHostChallenge();
    }

    const url = new URL(request.url);
    if (url.pathname === "/api/fragments") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ ok: false, error: "method_not_allowed" }), {
          status: 405,
          headers: { "content-type": "application/json; charset=utf-8", allow: "POST" },
        });
      }
      return handleCreateFragment(request, env);
    }
    if (url.pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ ok: false, error: "not_found" }), {
        status: 404,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }
    return env.ASSETS.fetch(request);
  },
};
