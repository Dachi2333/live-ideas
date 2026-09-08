import { createCaptureService } from "../src/capture/send-fragment.js";
import { createFragmentStore } from "../src/fragments/store.js";
import { createMiroAdapter } from "../src/miro/miro-adapter.js";
import { createDraftsStorage } from "../src/device/drafts-storage.js";
import { createDraftsHttp } from "../src/device/drafts-http.js";
import { runDraftsSendAction } from "../src/device/drafts-send-action.js";

const credential = Credential.create(
  "live-ideas-miro",
  "Miro credentials for Live Lyrics. Requires boards:write access only.",
);
credential.addPasswordField("accessToken", "Miro access token");
credential.addTextField("boardId", "Miro board ID");

if (!credential.authorize()) {
  context.fail("Miro credential setup cancelled");
} else {
  const accessToken = credential.getValue("accessToken");
  const boardId = credential.getValue("boardId");
  const fileManager = FileManager.createLocal();
  const http = HTTP.create();

  runDraftsSendAction({
    currentDraft: draft,
    createService: () => {
      const storage = createDraftsStorage(fileManager);
      const store = createFragmentStore(storage);
      const request = createDraftsHttp(http);
      const miro = createMiroAdapter({ request, accessToken, boardId });
      return createCaptureService({
        store,
        miro,
        now: () => new Date().toISOString(),
      });
    },
    onSuccess: () => {
      draft.folder = "trash";
      draft.update();
      editor.new();
    },
    onFailure: (error) => {
      context.fail(`Send failed: ${error}`);
    },
  });
}
