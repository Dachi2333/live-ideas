export function createFragment({ id, text, createdAt }) {
  return { id, text, createdAt, sentAt: null, status: "draft", miroItemId: null };
}

export function markSending(fragment) {
  return { ...fragment, status: "sending" };
}

export function markSent(fragment, sentAt, miroItemId = fragment.miroItemId ?? null) {
  return { ...fragment, status: "sent", sentAt, miroItemId };
}

export function markFailed(fragment, { miroItemId = fragment.miroItemId ?? null } = {}) {
  return { ...fragment, status: "failed", sentAt: null, miroItemId };
}
