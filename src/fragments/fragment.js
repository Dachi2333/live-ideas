export function createFragment({ id, text, createdAt }) {
  return {
    id,
    text,
    createdAt,
    sentAt: null,
    status: "draft",
  };
}

export function markSending(fragment) {
  return { ...fragment, status: "sending" };
}

export function markSent(fragment, sentAt) {
  return { ...fragment, status: "sent", sentAt };
}

export function markFailed(fragment) {
  return { ...fragment, status: "failed", sentAt: null };
}
