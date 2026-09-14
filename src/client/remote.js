export function createRemoteClient(fetchImpl = fetch) {
  return {
    async createSticky({ text, position }) {
      try {
        const response = await fetchImpl("/api/fragments", {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text, position }),
        });
        const data = await response.json().catch(() => null);
        if (response.status === 201 && data?.ok === true && typeof data.itemId === "string") {
          return { ok: true, itemId: data.itemId };
        }
        return {
          ok: false,
          statusCode: response.status,
          error: typeof data?.error === "string" ? data.error : "miro_create_failed",
        };
      } catch {
        return { ok: false, error: "network_error" };
      }
    },
  };
}
