import {
  createFragment,
  markFailed,
  markSending,
  markSent,
} from "../fragments/fragment.js";
import { getStickyPosition } from "../positioning/grid.js";

function failure(fragment, error) {
  return {
    ok: false,
    clearInput: false,
    fragment,
    error,
  };
}

export function createCaptureService({ store, miro, now }) {
  return {
    send({ id, text, createdAt }) {
      if (text.length === 0) {
        return {
          ok: false,
          clearInput: false,
          fragment: null,
          error: "empty_fragment",
        };
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

      // Retries deliberately reuse the locally preserved text associated
      // with this id. The caller's transient input is never allowed to
      // overwrite the safety copy during a retry.
      const position = getStickyPosition(store.countSent());
      const sending = markSending(fragment);

      try {
        store.replace(sending);
      } catch {
        return failure(fragment, "sending_state_persist_failed");
      }

      const remote = miro.createSticky({
        text: sending.text,
        position,
      });

      if (!remote?.ok) {
        const failed = markFailed(sending);
        try {
          store.replace(failed);
        } catch {
          return failure(sending, "failed_state_persist_failed");
        }
        return failure(failed, remote?.error || "miro_create_failed");
      }

      const sent = markSent(sending, now());
      try {
        store.replace(sent);
      } catch {
        // Remote creation succeeded, but the local safety/history record did
        // not reach `sent`. Do not clear the Drafts input: preserving text is
        // more important than pretending the transaction completed.
        return failure(sending, "sent_state_persist_failed");
      }

      return {
        ok: true,
        clearInput: true,
        fragment: sent,
      };
    },
  };
}
