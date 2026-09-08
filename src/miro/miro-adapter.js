function escapeMiroContent(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
    .replaceAll("\n", "<br>");
}

export function createMiroAdapter({ request, accessToken, boardId }) {
  return {
    createSticky({ text, position }) {
      try {
        const response = request({
          url: `https://api.miro.com/v2/boards/${encodeURIComponent(boardId)}/sticky_notes`,
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          data: {
            data: {
              content: escapeMiroContent(text),
              shape: "square",
            },
            position,
          },
        });

        if (
          response?.success === true &&
          response?.statusCode === 201 &&
          typeof response?.responseData?.id === "string" &&
          response.responseData.id.length > 0
        ) {
          return { ok: true, itemId: response.responseData.id };
        }

        return {
          ok: false,
          statusCode: response?.statusCode,
          error: response?.error || "miro_create_failed",
        };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : "miro_request_failed",
        };
      }
    },
  };
}
