import { createFragment, markFailed, markSending, markSent } from "./fragment.js";
import { getStickyPosition } from "./positioning.js";

function failure(fragment, error) {
  return { ok: false, clearInput: false, fragment, error };
}

export function createCaptureService({ store, remote, now }) {
  return {
    async send({ id, text, createdAt }) {
      if (text.length === 0) {
        return failure(null, "empty_fragment");
      }

      let fragment = store.get(id);
      if (fragment?.status === "sent") {
        return { ok: true, clearInput: true, fragment };
      }

      if (fragment == null) {
        fragment = createFragment({ id, text, createdAt });
        try {
          store.insert(fragment);
        } catch {
          return failure(fragment, "draft_state_persist_failed");
        }
      }

      const position = getStickyPosition(store.countSent());
      const sending = markSending(fragment);
      try {
        store.replace(sending);
      } catch {
        return failure(fragment, "sending_state_persist_failed");
      }

      let remoteResult;
      try {
        remoteResult = await remote.createSticky({ text: sending.text, position });
      } catch {
        remoteResult = { ok: false, error: "network_error" };
      }

      if (!remoteResult?.ok) {
        const failed = markFailed(sending);
        try {
          store.replace(failed);
        } catch {
          return failure(sending, "failed_state_persist_failed");
        }
        return failure(failed, remoteResult?.error || "miro_create_failed");
      }

      const sent = markSent(sending, now());
      try {
        store.replace(sent);
      } catch {
        return failure(sending, "sent_state_persist_failed");
      }

      return { ok: true, clearInput: true, fragment: sent };
    },
  };
}
