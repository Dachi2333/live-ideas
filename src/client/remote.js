export function createRemoteClient(fetchImpl = fetch) {
  return {
    async createSticky({ text, position, miroItemId = null }) {
      try {
        const body = { text, position };
        if (typeof miroItemId === "string" && miroItemId.length > 0) body.miroItemId = miroItemId;

        const response = await fetchImpl("/api/fragments", {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await response.json().catch(() => null);
        if (response.status === 201 && data?.ok === true && typeof data.itemId === "string") {
          return { ok: true, itemId: data.itemId };
        }
        return {
          ok: false,
          statusCode: response.status,
          error: typeof data?.error === "string" ? data.error : "miro_create_failed",
          ...(typeof data?.itemId === "string" && data.itemId.length > 0 ? { itemId: data.itemId } : {}),
        };
      } catch {
        return { ok: false, error: "network_error" };
      }
    },
  };
}
