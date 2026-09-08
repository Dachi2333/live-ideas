import { createCaptureService } from "../domain/capture-service.js";

export function createCaptureViewModel({ persistence, store, remote, makeId, now }) {
  const freshCapture = () => ({ id: makeId(), text: "", createdAt: now() });
  let capture = persistence.loadCapture() ?? freshCapture();
  let sending = false;
  let error = null;
  let localSafe = true;
  const service = createCaptureService({ store, remote, now });

  return {
    getState() {
      return { text: capture.text, sending, error };
    },
    setText(text) {
      error = null;
      if (text.length === 0) {
        capture = freshCapture();
        try {
          persistence.clearCapture();
          localSafe = true;
          return true;
        } catch {
          localSafe = false;
          error = "local_save_failed";
          return false;
        }
      }
      capture = { ...capture, text };
      try {
        persistence.saveCapture(capture);
        localSafe = true;
        return true;
      } catch {
        localSafe = false;
        error = "local_save_failed";
        return false;
      }
    },
    listSent() {
      return store.listSent();
    },
    async send() {
      if (sending) {
        return { ok: false, clearInput: false, error: "send_in_progress", fragment: null };
      }
      if (!localSafe) {
        error = "local_save_failed";
        return { ok: false, clearInput: false, error, fragment: null };
      }
      sending = true;
      error = null;
      try {
        if (capture.text.length > 0) {
          try {
            persistence.saveCapture(capture);
          } catch {
            localSafe = false;
            error = "local_save_failed";
            return { ok: false, clearInput: false, error, fragment: null };
          }
        }
        const result = await service.send(capture);
        if (result.ok && result.clearInput) {
          try {
            persistence.clearCapture();
            localSafe = true;
            capture = freshCapture();
          } catch {
            error = "local_clear_failed";
            return { ok: false, clearInput: false, error, fragment: result.fragment };
          }
        } else {
          error = result.error ?? "send_failed";
        }
        return result;
      } finally {
        sending = false;
      }
    },
  };
}
