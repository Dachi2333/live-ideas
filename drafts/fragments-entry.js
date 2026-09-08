import { createFragmentStore } from "../src/fragments/store.js";
import { createDraftsStorage } from "../src/device/drafts-storage.js";
import { renderFragmentsHtml } from "../src/device/fragments-html.js";

const fileManager = FileManager.createLocal();
const storage = createDraftsStorage(fileManager);
const store = createFragmentStore(storage);
const html = renderFragmentsHtml(store.listSent());
const preview = HTMLPreview.create();
preview.show(html);
